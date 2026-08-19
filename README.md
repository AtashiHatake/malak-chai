# Malak Chai - Point of Sale (POS) System

A lightweight, web-based Point of Sale (POS) application designed for multi-branch retail environments. It features real-time inventory management, role-based access control, and direct-to-hardware Bluetooth thermal receipt printing directly from the browser.

## Core Features

* Web Bluetooth Thermal Printing: Direct connection to generic 58mm ESC/POS thermal printers (e.g., HOIN, MPT-II) from a mobile browser. Implements custom byte-chunking (20-byte BLE limits) to prevent hardware buffer overflow.
* Multi-Branch Architecture: Separate logins and isolated sales tracking for different store locations.
* Admin Dashboard:
  - Global inventory management (Add, Edit, Delete products).
  - Branch operator account management (Create, Update Passwords, Delete).
  - Global sales metrics and reporting.
  - Secure, password-protected sales data reset functionality.
* Live POS Terminal: Real-time cart calculation, stock tracking, and instant receipt generation with exact timestamp reprint capabilities.
* Role-Based Authentication: Secure JWT-based access distinguishing between 'ADMIN' and 'BRANCH' roles.

## Tech Stack

* Frontend: React.js
* Backend: Node.js (API Routes)
* Database: TiDB (MySQL compatible)
* Authentication: JSON Web Tokens (JWT) & bcryptjs
* Deployment: Vercel
* Hardware API: Web Bluetooth API, @point-of-sale/receipt-printer-encoder

## Hardware Requirements

* Thermal Receipt Printer: Bluetooth Low Energy (BLE) supported, ESC/POS compatible, 58mm width (32 columns).
* Client Device: Android device running Google Chrome (strict requirement for Web Bluetooth API support).

## Environment Variables

Create a .env.local file in the root directory with the following variables:

DATABASE_URL="mysql://username:password@host:port/database"
JWT_SECRET="your_secure_jwt_secret_key"

## Local Setup

1. Clone the repository:
   git clone https://github.com/yourusername/malak-chai.git
   cd malak-chai

2. Install dependencies:
   pnpm install

3. Start the development server:
   pnpm dev

## Deployment

This project is configured for deployment on Vercel.

1. Install the Vercel CLI (if not already installed):
   pnpm add -g vercel

2. Deploy directly to production:
   vercel --prod

## Notes on Bluetooth Printing

Due to security constraints in modern browsers, Bluetooth connections must be initiated by a direct user action (a button click). The application slices the encoded ESC/POS receipt data into 20-byte chunks with a 30ms delay to ensure stable transmission to low-memory thermal printer chips.
