package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"erp_backend/internal/models"

	"github.com/labstack/echo/v4"
)

func (app *App) HandleListVendors(c echo.Context) error {
	query := searchQuery(c)
	sqlQuery := `SELECT id, name, phone, email, address, created_at
		FROM vendors`
	args := []any{}
	if query != "" {
		sqlQuery += `
		WHERE name ILIKE $1
		   OR COALESCE(phone, '') ILIKE $1
		   OR COALESCE(email, '') ILIKE $1
		   OR COALESCE(address, '') ILIKE $1`
		args = append(args, searchPattern(query))
	}
	sqlQuery += ` ORDER BY id DESC`

	rows, err := app.DB.Query(sqlQuery, args...)
	if err != nil {
		return serverError(c, err)
	}
	defer rows.Close()

	var out []models.Vendor
	for rows.Next() {
		var row models.Vendor
		if err := rows.Scan(&row.ID, &row.Name, &row.Phone, &row.Email, &row.Address, &row.CreatedAt); err != nil {
			return serverError(c, err)
		}
		out = append(out, row)
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) HandleCreateVendor(c echo.Context) error {
	var input struct {
		Name    string  `json:"name"`
		Phone   *string `json:"phone"`
		Email   *string `json:"email"`
		Address *string `json:"address"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return badRequest(c, "name is required")
	}

	var row models.Vendor
	err := app.DB.QueryRow(
		`INSERT INTO vendors (name, phone, email, address)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, phone, email, address, created_at`,
		input.Name, cleanNullable(input.Phone), cleanNullable(input.Email), cleanNullable(input.Address),
	).Scan(&row.ID, &row.Name, &row.Phone, &row.Email, &row.Address, &row.CreatedAt)
	if err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusCreated, row)
}

func (app *App) HandleUpdateVendor(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid vendor id")
	}
	var input struct {
		Name    string  `json:"name"`
		Phone   *string `json:"phone"`
		Email   *string `json:"email"`
		Address *string `json:"address"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return badRequest(c, "name is required")
	}

	var row models.Vendor
	err = app.DB.QueryRow(
		`UPDATE vendors
		 SET name = $2, phone = $3, email = $4, address = $5
		 WHERE id = $1
		 RETURNING id, name, phone, email, address, created_at`,
		id, input.Name, cleanNullable(input.Phone), cleanNullable(input.Email), cleanNullable(input.Address),
	).Scan(&row.ID, &row.Name, &row.Phone, &row.Email, &row.Address, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "vendor not found"})
		}
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, row)
}

func (app *App) HandleDeleteVendor(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid vendor id")
	}
	result, err := app.DB.Exec(`DELETE FROM vendors WHERE id = $1`, id)
	if err != nil {
		return serverError(c, err)
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "vendor not found"})
	}
	return c.NoContent(http.StatusNoContent)
}
