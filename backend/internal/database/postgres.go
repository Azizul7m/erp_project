package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"erp_backend/internal/config"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Open(cfg config.Config) (*sql.DB, error) {
	connString := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBUser,
		cfg.DBPassword,
	)

	db, err := sql.Open("pgx", connString)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	return db, nil
}

func RunMigrations(db *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'customer',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL`,
		`UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL`,
		`UPDATE users SET created_at = NOW() WHERE created_at IS NULL`,
		`UPDATE users SET role = 'customer' WHERE role IS NULL OR role = ''`,
		`ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN password SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE users ALTER COLUMN created_at SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN role SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'`,
		`CREATE TABLE IF NOT EXISTS customers (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			phone TEXT,
			email TEXT,
			address TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE customers SET created_at = NOW() WHERE created_at IS NULL`,
		`ALTER TABLE customers ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE customers ALTER COLUMN created_at SET NOT NULL`,
		`CREATE TABLE IF NOT EXISTS vendors (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			phone TEXT,
			email TEXT,
			address TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE vendors SET created_at = NOW() WHERE created_at IS NULL`,
		`ALTER TABLE vendors ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE vendors ALTER COLUMN created_at SET NOT NULL`,
		`CREATE TABLE IF NOT EXISTS products (
			id BIGSERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
			stock INTEGER NOT NULL CHECK (stock >= 0),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE products SET created_at = NOW() WHERE created_at IS NULL`,
		`ALTER TABLE products ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE products ALTER COLUMN created_at SET NOT NULL`,
		`CREATE TABLE IF NOT EXISTS orders (
			id BIGSERIAL PRIMARY KEY,
			customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
			user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
			total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
			status TEXT NOT NULL DEFAULT 'pending',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE orders SET total_amount = 0 WHERE total_amount IS NULL`,
		`UPDATE orders SET status = 'pending' WHERE status IS NULL OR status = ''`,
		`ALTER TABLE orders ALTER COLUMN total_amount SET DEFAULT 0`,
		`ALTER TABLE orders ALTER COLUMN total_amount SET NOT NULL`,
		`ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'`,
		`ALTER TABLE orders ALTER COLUMN status SET NOT NULL`,
		`UPDATE orders SET created_at = NOW() WHERE created_at IS NULL`,
		`ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE orders ALTER COLUMN created_at SET NOT NULL`,
		`CREATE TABLE IF NOT EXISTS order_items (
			id BIGSERIAL PRIMARY KEY,
			order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
			product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
			quantity INTEGER NOT NULL CHECK (quantity > 0),
			price NUMERIC(12, 2) NOT NULL CHECK (price >= 0)
		)`,
		`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE`,
		`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT`,
		`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)`,
		`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0)`,
		`UPDATE order_items SET quantity = 1 WHERE quantity IS NULL OR quantity <= 0`,
		`UPDATE order_items SET price = 0 WHERE price IS NULL OR price < 0`,
		`ALTER TABLE order_items ALTER COLUMN order_id SET NOT NULL`,
		`ALTER TABLE order_items ALTER COLUMN product_id SET NOT NULL`,
		`ALTER TABLE order_items ALTER COLUMN quantity SET DEFAULT 1`,
		`ALTER TABLE order_items ALTER COLUMN quantity SET NOT NULL`,
		`ALTER TABLE order_items ALTER COLUMN price SET DEFAULT 0`,
		`ALTER TABLE order_items ALTER COLUMN price SET NOT NULL`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id BIGSERIAL PRIMARY KEY,
			type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
			amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
			description TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE transactions SET created_at = NOW() WHERE created_at IS NULL`,
		`ALTER TABLE transactions ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE transactions ALTER COLUMN created_at SET NOT NULL`,
	}

	for _, stmt := range statements {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("run migration: %w", err)
		}
	}

	return nil
}
