package config

import (
	"os"
	"strings"
)

type Config struct {
	AppEnv     string
	Port       string
	DBHost     string
	DBPort     string
	DBName     string
	DBUser     string
	DBPassword string
	JWTSecret  string
	CORSOrigin string
}

func Load() Config {
	return Config{
		AppEnv:     envOrDefault("APP_ENV", "development"),
		Port:       envOrDefault("PORT", "8000"),
		DBHost:     envOrDefault("DB_HOST", "127.0.0.1"),
		DBPort:     envOrDefault("DB_PORT", "5432"),
		DBName:     envOrDefault("DB_NAME", "erp_db"),
		DBUser:     envOrDefault("DB_USER", "erp"),
		DBPassword: envOrDefault("DB_PASSWORD", "secret"),
		JWTSecret:  envOrDefault("JWT_SECRET", "change-me"),
		CORSOrigin: envOrDefault("CORS_ORIGIN", "http://localhost:3000"),
	}
}

func envOrDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
