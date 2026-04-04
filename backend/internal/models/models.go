package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Customer struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Phone     *string   `json:"phone"`
	Email     *string   `json:"email"`
	Address   *string   `json:"address"`
	CreatedAt time.Time `json:"created_at"`
}

type Product struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Price     float64   `json:"price"`
	Stock     int       `json:"stock"`
	CreatedAt time.Time `json:"created_at"`
}

type Order struct {
	ID          int64       `json:"id"`
	CustomerID  *int64      `json:"customer_id"`
	UserID      *int64      `json:"user_id"`
	TotalAmount float64     `json:"total_amount"`
	Status      string      `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	Items       []OrderItem `json:"items,omitempty"`
}

type OrderItem struct {
	ID        int64   `json:"id"`
	OrderID   int64   `json:"order_id"`
	ProductID int64   `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type Transaction struct {
	ID          int64     `json:"id"`
	Type        string    `json:"type"`
	Amount      float64   `json:"amount"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type AuthClaims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}
