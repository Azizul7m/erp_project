package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"erp_backend/internal/models"

	"github.com/labstack/echo/v4"
)

func (app *App) HandleListProducts(c echo.Context) error {
	rows, err := app.DB.Query(`SELECT id, name, price::float8, stock, created_at FROM products ORDER BY id DESC`)
	if err != nil {
		return serverError(c, err)
	}
	defer rows.Close()

	var out []models.Product
	for rows.Next() {
		var row models.Product
		if err := rows.Scan(&row.ID, &row.Name, &row.Price, &row.Stock, &row.CreatedAt); err != nil {
			return serverError(c, err)
		}
		out = append(out, row)
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) HandleCreateProduct(c echo.Context) error {
	var input struct {
		Name  string  `json:"name"`
		Price float64 `json:"price"`
		Stock int     `json:"stock"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" || input.Price < 0 || input.Stock < 0 {
		return badRequest(c, "name, non-negative price, and non-negative stock are required")
	}

	var row models.Product
	err := app.DB.QueryRow(
		`INSERT INTO products (name, price, stock)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, price::float8, stock, created_at`,
		input.Name, input.Price, input.Stock,
	).Scan(&row.ID, &row.Name, &row.Price, &row.Stock, &row.CreatedAt)
	if err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusCreated, row)
}

func (app *App) HandleUpdateProduct(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid product id")
	}
	var input struct {
		Name  string  `json:"name"`
		Price float64 `json:"price"`
		Stock int     `json:"stock"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" || input.Price < 0 || input.Stock < 0 {
		return badRequest(c, "name, non-negative price, and non-negative stock are required")
	}

	var row models.Product
	err = app.DB.QueryRow(
		`UPDATE products
		 SET name = $2, price = $3, stock = $4
		 WHERE id = $1
		 RETURNING id, name, price::float8, stock, created_at`,
		id, input.Name, input.Price, input.Stock,
	).Scan(&row.ID, &row.Name, &row.Price, &row.Stock, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "product not found"})
		}
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, row)
}

func (app *App) HandleDeleteProduct(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid product id")
	}
	result, err := app.DB.Exec(`DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return serverError(c, err)
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "product not found"})
	}
	return c.NoContent(http.StatusNoContent)
}
