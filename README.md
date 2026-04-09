# ERP Project

Full-stack ERP starter: **Next.js** frontend, **Go Echo** REST API, **PostgreSQL**, and Docker Compose.

## Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Go 1.25, Echo, JWT authentication
- Database: PostgreSQL 16
- Containers: Docker Compose for development with live reload

## Repository structure

```text
erp_project/
├── frontend/          # Next.js client
├── backend/           # Go Echo API
├── docker-compose.yml
└── README.md
```

## Services and ports (Docker Compose)

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (routes under `/api/*`)
- PostgreSQL: `localhost:5433` (maps to port `5432` inside Docker; avoids clashing with a local Postgres install)

## Quick start (Docker development)

```bash
docker compose up --build
```

This starts:

- Frontend dev server: http://localhost:3000
- Echo API server: http://localhost:8000
- PostgreSQL: localhost:5433

The setup is development-oriented:

- frontend source is bind-mounted into the Next.js container
- backend source is bind-mounted into the Go container
- Go module cache, `node_modules`, and `.next` are stored in Docker volumes
- the backend creates tables automatically on startup

You can also **register** via `POST /api/register` or sign up from the Next.js app if you add a register page.

## API (summary)

Public:

- `POST /api/register` — `{ name, email, password }` → `{ token, user }`
- `POST /api/login` — `{ email, password }` → `{ token, user }`

Authenticated (`Authorization: Bearer <token>`):

- `GET /api/user`
- Customers / products: `GET|POST|GET{id}|PUT|DELETE /api/customers`, `/api/products`
- Orders: `GET|POST /api/orders`, `GET /api/orders/{id}` (POST body: `customer_id`, `items: [{ product_id, quantity }]`, optional `status`)
- Transactions: `GET|POST /api/transactions`

To stop and remove containers:

```bash
docker compose down
```

To stop and also remove the database and dependency volumes:

```bash
docker compose down -v
```

## Local development (without Docker)

### Backend

```bash
cd backend
GOFLAGS=-mod=mod go mod tidy
cp .env.example .env
```

Ensure PostgreSQL matches the environment variables below, then:

```bash
export DB_HOST=127.0.0.1
export DB_PORT=5432
export DB_NAME=erp_db
export DB_USER=erp
export DB_PASSWORD=secret
export JWT_SECRET=change-me
GOFLAGS=-mod=mod go run ./cmd/api
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

Default dev server: http://localhost:3000

## CORS

Set `CORS_ORIGIN` in the backend environment to the frontend origin, for example `http://localhost:3000`.
