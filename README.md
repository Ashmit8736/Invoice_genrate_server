# Invoice Generation System - Server

The backend REST API for the Invoice Generation System, built with Node.js and Express. It interfaces with a MySQL database to securely store customers, settings, and invoice records, while also handling bulk imports via Excel files.

## 🚀 Features
- **Database Architecture:** Relational schema supporting invoices, multi-item line entries, automated GST calculation, and customer management.
- **RESTful API:** Clean endpoints for managing Customers, Invoices, and System Settings.
- **Bulk Excel Import:** Dedicated `multipart/form-data` endpoint to parse and ingest hundreds of invoices concurrently.
- **Tax & Calculation Logic:** Automatic computation of CGST, SGST, IGST based on Seller & Buyer State Codes.

## 🛠️ Tech Stack
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Driver:** `mysql2/promise` (Native Promises with Connection Pooling)
- **File Upload:** `multer` (Buffer-based processing)
- **Excel Parsing:** `xlsx`
- **Security & Config:** `cors`, `dotenv`

## 📦 Setup Instructions
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file in the root directory (refer to the required variables).
4. Run the database schema scripts (not included in the repo) in your MySQL instance.
5. Start the server using `npm start` (Runs on Port 5000 by default)

## 🔑 Environment Variables Required
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT`
