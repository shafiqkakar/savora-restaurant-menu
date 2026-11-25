# SAVORA – Dynamic Restaurant Website

## Project Overview

SAVORA is a dynamic restaurant website developed using Next.js, TypeScript, Tailwind CSS, and NeonDB PostgreSQL.

The website allows visitors to explore restaurant menu items, while the admin can securely manage menu items through an admin dashboard.

## Technologies Used

- Next.js (App Router)
- React.js
- TypeScript
- Tailwind CSS
- NeonDB (PostgreSQL)
- Cloudinary (Image Management)
- GitHub
- Vercel

## Main Features

### Public Website
- View restaurant menu items.
- View item names, prices, descriptions, and images.
- Browse menu categories.
- Add items to cart.
- Place orders.

### Admin Panel
- Secure admin login and logout.
- Dashboard overview and analytics.
- Add new menu items.
- Edit existing menu items.
- Delete menu items.
- Manage menu categories.
- Search and filter menu items.
- Manage customer orders.
- View order details.

### Database
- Menu items are stored in NeonDB.
- Customer orders are stored in NeonDB.
- Order details are stored in the order items table.
- Data remains available after refreshing the website.

## Database Table Structure

### menu_items

| Column | Type |
|---|---|
| id | SERIAL PRIMARY KEY |
| name | VARCHAR |
| price | NUMERIC |
| description | TEXT |
| image_url | TEXT |
| category | VARCHAR |

### orders

| Column | Type |
|---|---|
| id | SERIAL PRIMARY KEY |
| customer_name | VARCHAR |
| address | TEXT |
| total_amount | NUMERIC |
| status | VARCHAR |
| created_at | TIMESTAMP |

### order_items

| Column | Type |
|---|---|
| id | SERIAL PRIMARY KEY |
| order_id | INTEGER |
| menu_item_id | INTEGER |
| item_name | VARCHAR |
| quantity | INTEGER |
| price | NUMERIC |

*Note: Actual column types and constraints should match your NeonDB tables.*

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/shafiqkakar/savora-restaurant-menu.git
   ```

2. Open the project folder:

   ```bash
   cd savora-restaurant-menu
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env.local` file in the project root.

5. Add the required environment variables using your own credentials. Check the project configuration for the exact variable names.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open:

   ```text
   http://localhost:3000
   ```

## Security

- Admin routes are protected.
- Server-side authentication is used.
- Session cookies are used for admin access.
- Menu write operations require admin authentication.
- Database credentials and session secrets are kept out of client-side code.

## Deployment

The project can be deployed using Vercel.

GitHub Repository:  
https://github.com/shafiqkakar/savora-restaurant-menu

## Project Purpose

This project demonstrates practical knowledge of Next.js, React, API routes, authentication, database integration, and dynamic website development.

**Project Name:** SAVORA Restaurant Website  
**Project Type:** Dynamic Full-Stack Web Application
