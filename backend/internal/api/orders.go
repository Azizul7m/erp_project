package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"erp_backend/internal/models"

	"github.com/labstack/echo/v4"
)

func (app *App) HandleListOrders(c echo.Context) error {
	query := searchQuery(c)
	sqlQuery := `SELECT o.id, o.customer_id, o.user_id, o.total_amount::float8, o.status, o.created_at
		FROM orders o
		LEFT JOIN customers cst ON cst.id = o.customer_id`
	args := []any{}
	if query != "" {
		sqlQuery += `
		WHERE CAST(o.id AS TEXT) ILIKE $1
		   OR COALESCE(cst.name, '') ILIKE $1
		   OR COALESCE(o.status, '') ILIKE $1
		   OR CAST(o.total_amount AS TEXT) ILIKE $1`
		args = append(args, searchPattern(query))
	}
	sqlQuery += ` ORDER BY o.id DESC`

	rows, err := app.DB.Query(sqlQuery, args...)
	if err != nil {
		return serverError(c, err)
	}
	defer rows.Close()

	var out []models.Order
	for rows.Next() {
		var row models.Order
		if err := rows.Scan(&row.ID, &row.CustomerID, &row.UserID, &row.TotalAmount, &row.Status, &row.CreatedAt); err != nil {
			return serverError(c, err)
		}
		out = append(out, row)
	}
	return c.JSON(http.StatusOK, out)
}

func (app *App) HandleCreateOrder(c echo.Context) error {
	var input struct {
		CustomerID *int64 `json:"customer_id"`
		Status     string `json:"status"`
		Items      []struct {
			ProductID int64 `json:"product_id"`
			Quantity  int   `json:"quantity"`
		} `json:"items"`
	}
	if err := c.Bind(&input); err != nil {
		return badRequest(c, "invalid request body")
	}
	if len(input.Items) == 0 {
		return badRequest(c, "at least one order item is required")
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "pending"
	}

	userID := c.Get("userID").(int64)
	tx, err := app.DB.BeginTx(c.Request().Context(), &sql.TxOptions{})
	if err != nil {
		return serverError(c, err)
	}
	defer tx.Rollback()

	total := 0.0
	computedItems := make([]models.OrderItem, 0, len(input.Items))
	for _, item := range input.Items {
		if item.ProductID <= 0 || item.Quantity <= 0 {
			return badRequest(c, "each item must have a valid product_id and quantity")
		}

		var stock int
		var unitPrice float64
		err := tx.QueryRow(
			`SELECT stock, price::float8 FROM products WHERE id = $1 FOR UPDATE`,
			item.ProductID,
		).Scan(&stock, &unitPrice)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return c.JSON(http.StatusNotFound, map[string]string{"message": "product not found"})
			}
			return serverError(c, err)
		}
		if stock < item.Quantity {
			return c.JSON(http.StatusBadRequest, map[string]string{"message": "insufficient product stock"})
		}

		total += unitPrice * float64(item.Quantity)
		computedItems = append(computedItems, models.OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     unitPrice,
		})
	}

	var created models.Order
	err = tx.QueryRow(
		`INSERT INTO orders (customer_id, user_id, total_amount, status)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, customer_id, user_id, total_amount::float8, status, created_at`,
		input.CustomerID, userID, total, status,
	).Scan(&created.ID, &created.CustomerID, &created.UserID, &created.TotalAmount, &created.Status, &created.CreatedAt)
	if err != nil {
		return serverError(c, err)
	}

	for i := range computedItems {
		err := tx.QueryRow(
			`INSERT INTO order_items (order_id, product_id, quantity, price)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, order_id, product_id, quantity, price::float8`,
			created.ID, computedItems[i].ProductID, computedItems[i].Quantity, computedItems[i].Price,
		).Scan(&computedItems[i].ID, &computedItems[i].OrderID, &computedItems[i].ProductID, &computedItems[i].Quantity, &computedItems[i].Price)
		if err != nil {
			return serverError(c, err)
		}

		if _, err := tx.Exec(
			`UPDATE products SET stock = stock - $2 WHERE id = $1`,
			computedItems[i].ProductID, computedItems[i].Quantity,
		); err != nil {
			return serverError(c, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return serverError(c, err)
	}

	created.Items = computedItems
	return c.JSON(http.StatusCreated, created)
}

func (app *App) HandleGetOrder(c echo.Context) error {
	id, err := parseID(c.Param("id"))
	if err != nil {
		return badRequest(c, "invalid order id")
	}

	var row models.Order
	err = app.DB.QueryRow(
		`SELECT id, customer_id, user_id, total_amount::float8, status, created_at
		 FROM orders WHERE id = $1`,
		id,
	).Scan(&row.ID, &row.CustomerID, &row.UserID, &row.TotalAmount, &row.Status, &row.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"message": "order not found"})
		}
		return serverError(c, err)
	}

	items, err := app.DB.Query(
		`SELECT id, order_id, product_id, quantity, price::float8
		 FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
		id,
	)
	if err != nil {
		return serverError(c, err)
	}
	defer items.Close()

	for items.Next() {
		var item models.OrderItem
		if err := items.Scan(&item.ID, &item.OrderID, &item.ProductID, &item.Quantity, &item.Price); err != nil {
			return serverError(c, err)
		}
		row.Items = append(row.Items, item)
	}

	return c.JSON(http.StatusOK, row)
}
