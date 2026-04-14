package api

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
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

		role := normalizeRole(claims.Role)
		if role == "" {
			role, err = app.lookupUserRole(claims.UserID)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) {
					return c.JSON(http.StatusUnauthorized, map[string]string{"message": "user not found"})
				}
				return serverError(c, err)
			}
		}

		c.Set("userID", claims.UserID)
		c.Set("userRole", role)
		return next(c)
	}
}

func (app *App) HandleRegister(c echo.Context) error {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		Phone    string `json:"phone"`
		Position string `json:"position"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)
	input.Position = normalizeEmployeePosition(input.Position)
	if input.Name == "" || input.Email == "" || len(input.Password) < 8 {
		return badRequest(c, "name, email, and password (min 8 chars) are required")
	}

	role, err := app.resolveRegistrationRole(input.Role)
	if err != nil {
		return serverError(c, err)
	}
	if role == RoleEmployee && input.Position == "" {
		return badRequest(c, "position is required for employee sign up")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return serverError(c, err)
	}

	tx, err := app.DB.BeginTx(c.Request().Context(), nil)
	if err != nil {
		return serverError(c, err)
	}
	defer tx.Rollback()

	var created models.User
	err = tx.QueryRow(
		`INSERT INTO users (name, email, password, password_hash, role)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, name, email, role, created_at`,
		input.Name, input.Email, string(passwordHash), string(passwordHash), role,
	).Scan(&created.ID, &created.Name, &created.Email, &created.Role, &created.CreatedAt)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return c.JSON(http.StatusConflict, map[string]string{"message": "email already exists"})
		}
		return serverError(c, err)
	}

	if role == RoleCustomer {
		_, err = tx.Exec(
			`INSERT INTO customers (id, name, email) VALUES ($1, $2, $3)`,
			created.ID, created.Name, created.Email,
		)
		if err != nil {
			return serverError(c, err)
		}
	}
	if role == RoleEmployee {
		_, err = tx.Exec(
			`INSERT INTO employees (user_id, name, email, phone, position, salary)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			created.ID,
			created.Name,
			created.Email,
			nullIfBlank(input.Phone),
			input.Position,
			salaryForPosition(input.Position),
		)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
				return c.JSON(http.StatusConflict, map[string]string{"message": "employee record already exists for this email"})
			}
			return serverError(c, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return serverError(c, err)
	}

	token, err := app.issueToken(created.ID, created.Role)
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

	token, err := app.issueToken(dbUser.ID, dbUser.Role)
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

func (app *App) issueToken(userID int64, role string) (string, error) {
	claims := models.AuthClaims{
		UserID: userID,
		Role:   normalizeRole(role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(app.JWTSecret)
}

func (app *App) HandleForgotPassword(c echo.Context) error {
	var input struct {
		Email string `json:"email"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}

	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" {
		return badRequest(c, "email is required")
	}

	var userID int64
	err := app.DB.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// For security, don't reveal that the user doesn't exist
			return c.JSON(http.StatusOK, map[string]string{"message": "If an account with that email exists, a reset link has been sent."})
		}
		return serverError(c, err)
	}

	token := generateToken(32)
	expiry := time.Now().Add(1 * time.Hour)

	_, err = app.DB.Exec(
		"UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE id = $3",
		token, expiry, userID,
	)
	if err != nil {
		return serverError(c, err)
	}

	// In a real app, send an email here.
	fmt.Printf("Password reset token for %s: %s\n", email, token)

	return c.JSON(http.StatusOK, map[string]string{"message": "If an account with that email exists, a reset link has been sent."})
}

func (app *App) HandleResetPassword(c echo.Context) error {
	var input struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}

	if input.Token == "" || len(input.Password) < 8 {
		return badRequest(c, "token and password (min 8 chars) are required")
	}

	var userID int64
	err := app.DB.QueryRow(
		"SELECT id FROM users WHERE reset_token = $1 AND reset_expiry > $2",
		input.Token, time.Now(),
	).Scan(&userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return badRequest(c, "invalid or expired token")
		}
		return serverError(c, err)
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return serverError(c, err)
	}

	_, err = app.DB.Exec(
		"UPDATE users SET password_hash = $1, password = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2",
		string(passwordHash), userID,
	)
	if err != nil {
		return serverError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Password has been reset successfully."})
}

func generateToken(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return hex.EncodeToString(b)
}
