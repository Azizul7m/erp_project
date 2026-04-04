package api

import (
	"net/http"
	"strings"

	"erp_backend/internal/models"

	"github.com/labstack/echo/v4"
)

func (app *App) HandleListTransactions(c echo.Context) error {
	rows, err := app.DB.Query(
		`SELECT id, type, amount::float8, description, created_at
		 FROM transactions ORDER BY id DESC`,
	)
	if err != nil {
		return serverError(c, err)
	}
	defer rows.Close()

	var out []models.Transaction
	for rows.Next() {
		var row models.Transaction
		if err := rows.Scan(&row.ID, &row.Type, &row.Amount, &row.Description, &row.CreatedAt); err != nil {
			return serverError(c, err)
		}
		out = append(out, row)
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) HandleCreateTransaction(c echo.Context) error {
	var input struct {
		Type        string  `json:"type"`
		Amount      float64 `json:"amount"`
		Description *string `json:"description"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	input.Type = strings.TrimSpace(strings.ToLower(input.Type))
	if (input.Type != "income" && input.Type != "expense") || input.Amount <= 0 {
		return badRequest(c, "type must be income/expense and amount must be positive")
	}

	var row models.Transaction
	err := app.DB.QueryRow(
		`INSERT INTO transactions (type, amount, description)
		 VALUES ($1, $2, $3)
		 RETURNING id, type, amount::float8, description, created_at`,
		input.Type, input.Amount, cleanNullable(input.Description),
	).Scan(&row.ID, &row.Type, &row.Amount, &row.Description, &row.CreatedAt)
	if err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusCreated, row)
}
