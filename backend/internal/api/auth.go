package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"erp_backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

func (app *App) AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get(echo.HeaderAuthorization)
		if authHeader == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "missing authorization header"})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid authorization header"})
		}

		token, err := jwt.ParseWithClaims(parts[1], &models.AuthClaims{}, func(token *jwt.Token) (any, error) {
			return app.JWTSecret, nil
		})
		if err != nil || !token.Valid {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid token"})
		}

		claims, ok := token.Claims.(*models.AuthClaims)
		if !ok {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid token claims"})
		}

		c.Set("userID", claims.UserID)
		return next(c)
	}
}

func (app *App) HandleRegister(c echo.Context) error {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	if input.Name == "" || input.Email == "" || len(input.Password) < 8 {
		return badRequest(c, "name, email, and password (min 8 chars) are required")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return serverError(c, err)
	}

	var created models.User
	err = app.DB.QueryRow(
		`INSERT INTO users (name, email, password, password_hash, role)
		 VALUES ($1, $2, $3, $4, 'admin')
		 RETURNING id, name, email, role, created_at`,
		input.Name, input.Email, string(passwordHash), string(passwordHash),
	).Scan(&created.ID, &created.Name, &created.Email, &created.Role, &created.CreatedAt)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return c.JSON(http.StatusConflict, map[string]string{"message": "email already exists"})
		}
		return serverError(c, err)
	}

	token, err := app.issueToken(created.ID)
	if err != nil {
		return serverError(c, err)
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"token": token,
		"user":  created,
	})
}

func (app *App) HandleLogin(c echo.Context) error {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}

	var dbUser models.User
	var passwordHash string
	err := app.DB.QueryRow(
		`SELECT id, name, email, role, created_at, COALESCE(password_hash, password)
		 FROM users WHERE email = $1`,
		strings.TrimSpace(strings.ToLower(input.Email)),
	).Scan(&dbUser.ID, &dbUser.Name, &dbUser.Email, &dbUser.Role, &dbUser.CreatedAt, &passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid credentials"})
		}
		return serverError(c, err)
	}

	if bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.Password)) != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "invalid credentials"})
	}

	token, err := app.issueToken(dbUser.ID)
	if err != nil {
		return serverError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"token": token,
		"user":  dbUser,
	})
}

func (app *App) HandleCurrentUser(c echo.Context) error {
	userID := c.Get("userID").(int64)
	var user models.User
	err := app.DB.QueryRow(
		`SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "user not found"})
		}
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, user)
}

func (app *App) issueToken(userID int64) (string, error) {
	claims := models.AuthClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(app.JWTSecret)
}
