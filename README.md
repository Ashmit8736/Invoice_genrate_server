# Invoice Generation System - Server

The backend REST API for the Invoice Generation System, built with Node.js and Express. It interfaces with a MySQL database to securely store customers, settings, and invoice records, while also handling bulk imports via Excel files.

## 🚀 Features
- **Database Architecture (MySQL & TiDB):** This project strictly requires a **MySQL** database.
  - *Local Development:* Initially built and tested using a local MySQL instance.
  - *Production / Live Deployment:* For hosting, the database was migrated to **TiDB Cloud (Serverless)**. Since TiDB is fully MySQL-compatible, it fulfills the MySQL requirement seamlessly while providing a scalable, live cloud environment. We also integrated **Prisma ORM** for secure and efficient database operations.
- **RESTful API:** Clean endpoints for managing Customers, Invoices, and System Settings.
- **Bulk Excel Import:** Dedicated `multipart/form-data` endpoint to parse and ingest hundreds of invoices concurrently.
- **Tax & Calculation Logic:** Automatic computation of CGST, SGST, IGST based on Seller & Buyer State Codes.

## 🛠️ Tech Stack
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (Hosted on TiDB Cloud)
- **ORM:** `Prisma` (Replaced raw mysql2 queries for better maintainability)
- **File Upload:** `multer` (Buffer-based processing)
- **Excel Parsing:** `xlsx`
- **Security & Config:** `cors`, `dotenv`

## 📦 Setup Instructions
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file in the root directory (refer to the required variables).
4. Run `npx prisma db push` to sync the database schema with your live database.
5. (Optional) Run `npm run seed` to populate the database with dummy data.
6. Start the development server using `npm run dev` (Runs on Port 5000 by default)

## 🔑 Environment Variables Required
To run this project, create a `.env` file in the root directory. Since we are using TiDB (MySQL compatible) with Prisma, you only need to provide the `DATABASE_URL`.

```env
# TiDB / MySQL Connection String Format for Prisma
# Format: mysql://<username>:<password>@<host>:<port>/<database_name>?sslaccept=strict

DATABASE_URL="mysql://your_username:your_password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict"

PORT=5000
```
