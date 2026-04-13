package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"erp_backend/internal/models"

	"github.com/labstack/echo/v4"
)

func (app *App) HandleListEmployees(c echo.Context) error {
	query := searchQuery(c)
	sqlQuery := `SELECT id, user_id, name, email, phone, position, salary::float8, hire_date, created_at
		FROM employees`
	args := []any{}
	if query != "" {
		sqlQuery += `
		WHERE name ILIKE $1
		   OR email ILIKE $1
		   OR COALESCE(phone, '') ILIKE $1
		   OR position ILIKE $1`
		args = append(args, searchPattern(query))
	}
	sqlQuery += ` ORDER BY id DESC`

	rows, err := app.DB.Query(sqlQuery, args...)
	if err != nil {
		return serverError(c, err)
	}
	defer rows.Close()

	var out []models.Employee
	for rows.Next() {
		var row models.Employee
		if err := rows.Scan(&row.ID, &row.UserID, &row.Name, &row.Email, &row.Phone, &row.Position, &row.Salary, &row.HireDate, &row.CreatedAt); err != nil {
			return serverError(c, err)
		}
		out = append(out, row)
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) HandleCurrentEmployee(c echo.Context) error {
	userID := c.Get("userID").(int64)
	var row models.Employee
	err := app.DB.QueryRow(
		`SELECT id, user_id, name, email, phone, position, salary::float8, hire_date, created_at
		 FROM employees
		 WHERE user_id = $1
		 LIMIT 1`,
		userID,
	).Scan(&row.ID, &row.UserID, &row.Name, &row.Email, &row.Phone, &row.Position, &row.Salary, &row.HireDate, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "employee profile not found"})
		}
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, row)
}

func (app *App) HandleCreateEmployee(c echo.Context) error {
	var input struct {
		Name     string  `json:"name"`
		Email    string  `json:"email"`
		Phone    *string `json:"phone"`
		Position string  `json:"position"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Position = normalizeEmployeePosition(input.Position)

	if input.Name == "" || input.Email == "" || input.Position == "" {
		return badRequest(c, "name, email, and position are required")
	}

	var row models.Employee
	err := app.DB.QueryRow(
		`INSERT INTO employees (name, email, phone, position, salary)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, user_id, name, email, phone, position, salary::float8, hire_date, created_at`,
		input.Name, input.Email, cleanNullable(input.Phone), input.Position, salaryForPosition(input.Position),
	).Scan(&row.ID, &row.UserID, &row.Name, &row.Email, &row.Phone, &row.Position, &row.Salary, &row.HireDate, &row.CreatedAt)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return c.JSON(http.StatusConflict, map[string]string{"message": "email already exists"})
		}
		return serverError(c, err)
	}
	return c.JSON(http.StatusCreated, row)
}

func (app *App) HandleUpdateEmployee(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid employee id")
	}
	var input struct {
		Name     string  `json:"name"`
		Email    string  `json:"email"`
		Phone    *string `json:"phone"`
		Position string  `json:"position"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Position = normalizeEmployeePosition(input.Position)

	if input.Name == "" || input.Email == "" || input.Position == "" {
		return badRequest(c, "name, email, and position are required")
	}

	tx, err := app.DB.BeginTx(c.Request().Context(), nil)
	if err != nil {
		return serverError(c, err)
	}
	defer tx.Rollback()

	var row models.Employee
	err = tx.QueryRow(
		`UPDATE employees
		 SET name = $2, email = $3, phone = $4, position = $5, salary = $6
		 WHERE id = $1
		 RETURNING id, user_id, name, email, phone, position, salary::float8, hire_date, created_at`,
		id, input.Name, input.Email, cleanNullable(input.Phone), input.Position, salaryForPosition(input.Position),
	).Scan(&row.ID, &row.UserID, &row.Name, &row.Email, &row.Phone, &row.Position, &row.Salary, &row.HireDate, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "employee not found"})
		}
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return c.JSON(http.StatusConflict, map[string]string{"message": "email already exists"})
		}
		return serverError(c, err)
	}

	if row.UserID != nil {
		_, err = tx.Exec(
			`UPDATE users
			 SET name = $2, email = $3
			 WHERE id = $1`,
			*row.UserID, row.Name, row.Email,
		)
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
				return c.JSON(http.StatusConflict, map[string]string{"message": "email already exists"})
			}
			return serverError(c, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, row)
}

func (app *App) HandleDeleteEmployee(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid employee id")
	}
	result, err := app.DB.Exec(`DELETE FROM employees WHERE id = $1`, id)
	if err != nil {
		return serverError(c, err)
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "employee not found"})
	}
	return c.NoContent(http.StatusNoContent)
}
