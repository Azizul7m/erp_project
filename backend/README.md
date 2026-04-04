# ERP Backend

Go + Echo REST API for the ERP demo project.

## Stack

- Go 1.25
- Echo v4
- PostgreSQL 16
- JWT authentication

## Run locally

```bash
cd backend
GOFLAGS=-mod=mod go mod tidy
cp .env.example .env
GOFLAGS=-mod=mod go run ./cmd/api
```

Default environment values:

- `PORT=8000`
- `APP_ENV=development`
- `JWT_SECRET=change-me`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_NAME=erp_db`
- `DB_USER=erp`
- `DB_PASSWORD=secret`
- `CORS_ORIGIN=http://localhost:3000`

The service auto-creates the required tables on startup.

## API

Public:

- `POST /api/register`
- `POST /api/login`

Protected:

- `GET /api/user`
- `GET|POST|PUT|DELETE /api/customers`
- `GET|POST|PUT|DELETE /api/products`
- `GET|POST /api/orders`
- `GET /api/orders/:id`
- `GET|POST /api/transactions`
