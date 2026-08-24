# Find-Links | Indian Multi-Store E-Commerce Price Tracker & Telegram Alerts

A modern, full-stack, multi-user price tracking and comparison platform tailored for the Indian e-commerce landscape. Track products from **Amazon.in**, **Flipkart**, **Croma**, **Reliance Digital**, **Tata CLiQ**, **JioMart**, and **Myntra**, compare real-time prices for your delivery PIN code, visualize historical price charts, and receive instant **Telegram Bot** and in-app alerts whenever prices drop!

---

## ✨ Features

- **🛍️ Multi-Store Comparison Matrix**: Compare prices, discounts, and delivery estimates across 7 major Indian retail platforms in a unified view.
- **📍 Location & PIN Code Support**: Default delivery postal PIN code (e.g., `560001` Bangalore, `110001` Delhi, `400001` Mumbai) with per-item overrides.
- **⚡ 1-Click Product Addition**: Simply paste a product URL from Amazon or Flipkart—the intelligent extractor automatically detects product details and searches for matching listings across other stores.
- **📈 Interactive Price History Charts**: Visual multi-store price trends with time-range filtering (7 Days, 30 Days, All-Time) and **All-Time Low** highlights.
- **🤖 Telegram Price Drop Alerts**:
  - Instant Telegram notifications with product thumbnail, previous price, new price, savings amount, discount %, and direct buy links.
  - 1-Click bot connection via deep link (e.g., `https://t.me/YourBot?start=<token>`) or manual Chat ID configuration.
- **⏱️ Automated 10-Minute Price Checks**: Background cron scheduler automatically checks product prices every 10 minutes, plus an instant on-demand *"Refresh Price Now"* button.
- **🎯 Custom Target Price Alerts**: Set specific target alert thresholds (e.g., *"Notify me if iPhone 15 drops below ₹65,000"*).
- **🔔 In-App Notification Center**: Unread count badges, price drop cards, and instant status updates.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Chart.js / react-chartjs-2, Lucide React, Modern CSS Design System (dark theme, glassmorphism, responsive).
- **Backend**: Node.js, Express, Prisma ORM, SQLite database, JSON Web Tokens (JWT), bcrypt.
- **Scraper & Matcher Engine**: Multi-strategy parser (JSON-LD structured data, Cheerio, OpenGraph, dynamic fallback resilience layer).
- **Scheduler**: `node-cron` background worker running every 10 minutes.
- **Notifications**: Telegram Bot API integration + In-App notification service.

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install
npx prisma db push
npm start
```
*Backend runs on `http://localhost:5000` with SQLite database `backend/dev.db`.*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🤖 Configuring Your Telegram Bot

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the prompts to name your bot and choose a username (e.g. `MyPriceAlertBot`).
3. Copy the HTTP API token provided by BotFather.
4. Paste your token in `backend/.env`:
   ```env
   TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
   TELEGRAM_BOT_USERNAME="MyPriceAlertBot"
   ```
5. Restart the backend server.
6. In the web app, click **"Configure Telegram Bot"** and tap the deep link to start receiving instant price drop alerts!

---

## 🧪 Testing Price Drops (Demo Mode)

To verify the real-time notification workflow and Telegram dispatch without waiting days for real store price fluctuations:
1. Open any product in the dashboard to view its details.
2. Click **"Test Drop Alert (10%)"**.
3. A price drop is simulated, a new price history point is recorded, the in-app notification bell illuminates, and a Telegram alert is sent immediately!
