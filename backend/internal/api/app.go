package api

import "database/sql"

type App struct {
	DB        *sql.DB
	JWTSecret []byte
}

func New(db *sql.DB, jwtSecret string) *App {
	return &App{
		DB:        db,
		JWTSecret: []byte(jwtSecret),
	}
}
