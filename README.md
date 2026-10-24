# SellManager API

## Description

*_SellManager API_ is a RESTful API developed in **Node.js** with **TypeScript**. This project is part of my studies in **Clean Architecture**, software design principles, and scalable API development.

The goal is to apply concepts like **separation of concerns**, **SOLID principles**, and a clear distinction between **domain, infrastructure, and application layers**.

---

## Main Features

- ✅ **Authentication with JWT**
- ✅ **Customer management (CRUD)**
- ✅ **Product management (CRUD) with image uploads**
- ✅ **Order management with item tracking**
- ✅ **Middleware-based validation and authentication**
- ✅ **Centralized error handling with custom exceptions**
- ✅ **Environment-based configuration**
- ✅ **Clean, modular, and scalable code structure inspired by Clean Architecture principles**

---

## Tech Stack

- **Node.js**
- **TypeScript**
- **Express.js**
- **TypeORM** (MySQL / PostgreSQL)
- **JWT** (Authentication)
- **Multer** (File uploads)
- **Yarn** (Package manager)

---

## Purpose

> 🚀 This project is a study case to learn and apply **Clean Architecture** concepts in a real Node.js API. It is not intended for production but for learning how to build **scalable**, **maintainable**, and **well-structured software.**

---

## Installation

### Requirements

- Node.js (v18+)
- Yarn
- MySQL or PostgreSQL database

### Clone the repository

```bash
git clone https://github.com/KaiokkFernandes/Api-Vendas.git
cd Api-Vendas
```

### Install dependencies

```bash
yarn install
```

### Configure environment variables

Create a `.env` file:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=api_vendas

JWT_SECRET=yourjwtsecret
APP_API_URL=http://localhost:3333
```

### Run migrations

```bash
yarn typeorm migration:run
```

### Start the API

```bash
yarn dev
```

API running at: `http://localhost:3333`

---

## API Routes Overview

### Authentication

| Method | Endpoint    | Description      |
| ------ | ----------- | ---------------- |
| POST   | `/sessions` | User login (JWT) |

### Customers

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/customers`     | List all customers |
| GET    | `/customers/:id` | Get customer by ID |
| POST   | `/customers`     | Create customer    |
| PUT    | `/customers/:id` | Update customer    |
| DELETE | `/customers/:id` | Delete customer    |

### Products

| Method | Endpoint        | Description          |
| ------ | --------------- | -------------------- |
| GET    | `/products`     | List all products    |
| GET    | `/products/:id` | Get product by ID    |
| POST   | `/products`     | Create a product     |
| PUT    | `/products/:id` | Update a product     |
| DELETE | `/products/:id` | Delete a product     |
| PATCH  | `/products/:id` | Upload product image |

### Orders

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| GET    | `/orders/:id` | Get order by ID    |
| POST   | `/orders`     | Create a new order |

---

## Folder Structure (Based on Clean Architecture)

```
src/
 ┣ config/             → Config files (auth, upload, etc.)
 ┣ modules/            → Business logic (Customers, Products, Orders, Users)
 ┣ shared/
 ┃ ┣ errors/           → Custom error handling (AppError)
 ┃ ┣ http/             → Server config, routes
 ┃ ┣ middlewares/      → Authentication, error handling
 ┃ ┣ typeorm/          → Database entities, migrations, repositories
 ┗ index.ts            → App entry point
```

---

## Usage Example

- **Login:**

```http
POST /sessions
{
  "email": "admin@example.com",
  "password": "123456"
}
```

- Response:

```json
{
  "user": {
    "id": "uuid",
    "name": "Admin"
  },
  "token": "jwt-token"
}
```

Use the token in the header:

```
Authorization: Bearer jwt-token
```

---

## Build for Production

```bash
yarn build
node build/index.js
```

---

## 🚀 Disclaimer

> This project is for **educational purposes only**, focusing on practicing **Clean Architecture** concepts, modular code organization, and best practices for Node.js APIs. Not intended for production use.
