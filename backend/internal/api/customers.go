package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"erp_backend/internal/models"

	"github.com/labstack/echo/v4"
)

func (app *App) HandleListCustomers(c echo.Context) error {
	rows, err := app.DB.Query(`SELECT id, name, phone, email, address, created_at FROM customers ORDER BY id DESC`)
	if err != nil {
		return serverError(c, err)
	}
	defer rows.Close()

	var out []models.Customer
	for rows.Next() {
		var row models.Customer
		if err := rows.Scan(&row.ID, &row.Name, &row.Phone, &row.Email, &row.Address, &row.CreatedAt); err != nil {
			return serverError(c, err)
		}
		out = append(out, row)
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) HandleCreateCustomer(c echo.Context) error {
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

	var row models.Customer
	err := app.DB.QueryRow(
		`INSERT INTO customers (name, phone, email, address)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, phone, email, address, created_at`,
		input.Name, cleanNullable(input.Phone), cleanNullable(input.Email), cleanNullable(input.Address),
	).Scan(&row.ID, &row.Name, &row.Phone, &row.Email, &row.Address, &row.CreatedAt)
	if err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusCreated, row)
}

func (app *App) HandleUpdateCustomer(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid customer id")
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

	var row models.Customer
	err = app.DB.QueryRow(
		`UPDATE customers
		 SET name = $2, phone = $3, email = $4, address = $5
		 WHERE id = $1
		 RETURNING id, name, phone, email, address, created_at`,
		id, input.Name, cleanNullable(input.Phone), cleanNullable(input.Email), cleanNullable(input.Address),
	).Scan(&row.ID, &row.Name, &row.Phone, &row.Email, &row.Address, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "customer not found"})
		}
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, row)
}

func (app *App) HandleDeleteCustomer(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid customer id")
	}
	result, err := app.DB.Exec(`DELETE FROM customers WHERE id = $1`, id)
	if err != nil {
		return serverError(c, err)
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "customer not found"})
	}
	return c.NoContent(http.StatusNoContent)
}
