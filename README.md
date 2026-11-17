# SAVORA – Dynamic Restaurant Menu Website

## 1. Project Overview

SAVORA is a dynamic restaurant menu website developed using Next.js, TypeScript, Tailwind CSS, and NeonDB PostgreSQL.

The website allows users to view restaurant menu items, add new dishes, and delete existing dishes. Menu data is stored in a NeonDB database and retrieved through API routes.

## 2. Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- NeonDB PostgreSQL
- @neondatabase/serverless

## 3. Main Features

- Professional restaurant website design.
- Dynamic menu display from the database.
- Add new menu items.
- Delete existing menu items.
- Store menu information in NeonDB.
- Data remains saved after refreshing the website.
- Responsive website layout.

## 4. Project Structure

```text
restaurant-menu/
│
├── public/
│   └── hero.jpg
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── menu/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   └── lib/
│       └── db.ts
│
├── .env.local
├── package.json
└── README.md
```

## 5. Database Configuration

The project uses NeonDB PostgreSQL as its database.

Create a database table using the following SQL query:

```sql
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT
);
```

## 6. Environment Setup

Create a `.env.local` file in the project root directory and add your NeonDB connection string:

```env
DATABASE_URL="YOUR_NEON_DATABASE_CONNECTION_STRING"
```

Do not share your actual database credentials publicly.

## 7. Installation and Running the Project

Install project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the following address in your browser:

```text
http://localhost:3000
```

## 8. API Routes

The project uses the following API endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/menu` | Retrieve menu items |
| POST | `/api/menu` | Add a new menu item |
| DELETE | `/api/menu` | Delete a menu item |

## 9. How the Project Works

1. The website sends a GET request to retrieve menu items from NeonDB.
2. The user enters a dish name, price, and description.
3. The website sends a POST request to save the new dish.
4. The API inserts the information into the database.
5. The updated menu is displayed on the website.
6. The user can delete a menu item using the DELETE API.
7. Database changes remain saved after refreshing the website.

## 10. Conclusion

SAVORA demonstrates how to build a dynamic restaurant menu website using Next.js and NeonDB. It provides basic CRUD functionality through API routes and stores menu information in a PostgreSQL database.