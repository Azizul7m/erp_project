# 🧠 ERP Web Application (Next.js + Go Echo + PostgreSQL)

## 🎯 Project Goal

Build a **modular ERP web application** inspired by the provided Excel system.

> ⚠️ Note: This is a **BSc CSE defense project**, so full enterprise-level features are NOT required. Focus on core modules, clean architecture, and working functionality.

---

## 🏗️ Tech Stack

- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend:** Golang Echo (REST API)
- **Database:** PostgreSQL
- **Authentication:** JWT
- **State Management:** React Context / Zustand
- **API Communication:** Axios / Fetch

---

## 📦 Core Modules

### ✅ MUST HAVE

- Authentication & Users
- Dashboard (basic stats)
- Customers Management
- Products Management
- Orders Management (basic)
- Transactions (income/expense)

### ⚡ OPTIONAL

- Vendors
- Payroll
- Inventory tracking
- Role-based access

---

## 🧩 System Architecture

### 🔹 Backend (Go Echo)

#### Models

- User
- Customer
- Product
- Order
- OrderItem
- Transaction

#### Relationships

- User → hasMany Orders
- Customer → hasMany Orders
- Order → hasMany OrderItems
- Product → hasMany OrderItems

---

## 🗄️ Database Schema (PostgreSQL)

### users

- id
- name
- email
- password
- role
- created_at

### customers

- id
- name
- phone
- email
- address
- created_at

### products

- id
- name
- price
- stock
- created_at

### orders

- id
- customer_id
- user_id
- total_amount
- status
- created_at

### order_items

- id
- order_id
- product_id
- quantity
- price

### transactions

- id
- type (income/expense)
- amount
- description
- created_at

---

## 🔌 API Endpoints

### Auth

- POST /api/register
- POST /api/login
- GET /api/user

### Customers

- GET /api/customers
- POST /api/customers
- PUT /api/customers/{id}
- DELETE /api/customers/{id}

### Products

- GET /api/products
- POST /api/products
- PUT /api/products/{id}
- DELETE /api/products/{id}

### Orders

- GET /api/orders
- POST /api/orders
- GET /api/orders/{id}

### Transactions

- GET /api/transactions
- POST /api/transactions

---

## 🎨 Frontend (Next.js)

### Pages

- /login
- /dashboard
- /customers
- /products
- /orders
- /transactions

---

## 🖥️ UI Requirements

- Sidebar navigation
- Dashboard cards (sales, orders, customers)
- Tables with CRUD
- Forms with validation
- Toast notifications

---

## 🔐 Authentication Flow

1. Login → receive token
2. Store token (cookie/localStorage)
3. Protect routes using middleware

---

## 🔄 Order Flow

1. Select customer
2. Add products (quantity)
3. Calculate total
4. Save order + order items
5. Reduce product stock

---

## 📊 Dashboard Features

- Total customers
- Total products
- Total orders
- Total revenue

---

## 🧪 Validation Rules

- Required fields
- Numeric validation (price, amount)
- Email format validation

---

## 🚀 Development Steps

### Step 1: Backend

- Setup Go Echo
- Configure PostgreSQL
- Create migrations & models
- Build API controllers
- Test with Postman

### Step 2: Frontend

- Setup Next.js
- Configure Tailwind
- Build layout (sidebar + header)

### Step 3: Authentication

- Login page
- Token handling
- Protected routes

### Step 4: CRUD Modules

1. Customers
2. Products
3. Orders
4. Transactions

### Step 5: Dashboard

- Fetch summary data
- Display cards & charts

---

## 🎓 Defense Key Points

Ensure your project demonstrates:

- Layered backend architecture (Go Echo)
- REST API design
- Database normalization
- Authentication system
- Real-world ERP concept

---

## 🎯 Simplifications Allowed

- No complex payroll
- No real-time system
- Simple UI is acceptable

---

## ⭐ Bonus Features

- Role-based access (Admin/User)
- Export reports (CSV)
- Charts (Recharts)

---

## 🧠 Final Instruction for Cursor

Generate clean, modular, production-style code.  
Focus on readability, separation of concerns, and proper API structure.  
Avoid unnecessary complexity.
