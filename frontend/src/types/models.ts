export type UserRole = "admin" | "customer" | "employee" | "vendor";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
};

export type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string;
};

export type Vendor = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string;
};

export type Employee = {
  id: number;
  user_id?: number | null;
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  salary: number | string;
  hire_date?: string;
  created_at?: string;
};

export type Product = {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  created_at?: string;
};

export type Order = {
  id: number;
  customer_id?: number | null;
  user_id?: number | null;
  total_amount: number | string;
  status?: string | null;
  items?: OrderItem[];
  created_at?: string;
};

export type OrderItem = {
  id?: number;
  order_id?: number;
  product_id: number;
  quantity: number;
  price?: number | string;
};

export type Transaction = {
  id: number;
  type: "income" | "expense" | string;
  amount: number | string;
  description?: string | null;
  order_id?: number | null;
  created_at?: string;
};
