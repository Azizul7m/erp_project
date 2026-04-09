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
			role TEXT NOT NULL DEFAULT 'admin',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
		`UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL`,
		`UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL`,
		`UPDATE users SET created_at = NOW() WHERE created_at IS NULL`,
		`UPDATE users SET role = 'admin' WHERE role IS NULL OR role = ''`,
		`ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN password SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW()`,
		`ALTER TABLE users ALTER COLUMN created_at SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN role SET NOT NULL`,
		`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin'`,
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
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
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
