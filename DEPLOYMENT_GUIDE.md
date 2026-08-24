# 🚀 Find-Links Cloud Deployment Guide (Split Hosting)

This guide walks you through deploying your **Find-Links** full-stack application to the cloud for free:
- **Frontend**: Hosted on **Vercel** (or Netlify) with global high-speed CDN.
- **Backend**: Hosted on **Render** (or Railway) as a 24/7 background service for the 10-minute price scraper cron job and Telegram Bot.

---

## 📋 Prerequisites
1. A **GitHub account** (to store your code).
2. A **Vercel account** ([vercel.com](https://vercel.com)) — Free.
3. A **Render account** ([render.com](https://render.com)) — Free.
4. Your Telegram Bot Token (`8493687278:AAGLFqtKAzsbAzTe5lcIaJS2E21s2xg25j0`).

---

## Step 1: Push Your Code to GitHub

If you haven't pushed this project to a GitHub repository yet, run the following in your terminal:

```bash
cd /home/justin/Projects/Find-links

# Initialize Git repository (if not already done)
git init
git add .
git commit -m "feat: Find-Links multi-store price tracker & telegram bot"

# Create a new repository on GitHub (e.g. Find-links) and push:
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Find-links.git
git push -u origin main
```

---

## Step 2: Deploy the Backend to Render (Free 24/7 Service)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Select **"Build and deploy from a Git repository"** and choose your **`Find-links`** repository.
4. Fill in the service configuration:
   - **Name**: `find-links-backend` (or any name you prefer)
   - **Region**: `Singapore (Southeast Asia)` or `Frankfurt` (closest to India)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `DATABASE_URL` | `file:./dev.db` | Local SQLite database |
| `JWT_SECRET` | `super_secure_jwt_secret_key_prod_2026_xyz` | Any random 32-character string |
| `TELEGRAM_BOT_TOKEN` | `8493687278:AAGLFqtKAzsbAzTe5lcIaJS2E21s2xg25j0` | Your Bot Token |
| `TELEGRAM_BOT_USERNAME` | `pricedroplivebot` | Your Bot Username (without `@`) |
| `CRON_INTERVAL` | `*/10 * * * *` | Checks prices every 10 minutes |
| `MOCK_SCRAPER_FALLBACK`| `true` | Resilience layer for retail anti-bot blocks |

6. Click **Create Web Service**.
7. Render will build and launch your backend service. Once deployed, note down your backend URL (e.g. `https://find-links-backend.onrender.com`).
8. You can verify it by opening `https://find-links-backend.onrender.com/api/health` in your browser.

---

## Step 3: Deploy the Frontend to Vercel (Free Global CDN)

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New…** → **Project**.
3. Select your **`Find-links`** GitHub repository.
4. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose **`frontend`**
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
5. Expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://find-links-backend.onrender.com` |

*(Replace with your actual Render backend URL from Step 2)*

6. Click **Deploy**.
7. Vercel will build and deploy your React frontend within 30 seconds.
8. You will receive your public live URL (e.g. `https://find-links.vercel.app`)!

---

## 🔄 Alternative: Deploying on Railway (All-in-One)

If you prefer Railway instead of Render:
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Set root directory to `backend`.
4. Add the environment variables from Step 2.
5. Railway will deploy and provide your backend URL.

---

## ✅ Post-Deployment Verification Checklist

1. **Open Frontend on your Phone or PC**: Visit your Vercel URL `https://your-app.vercel.app`.
2. **Set Delivery PIN**: Click the PIN pill in the navbar and set your location (e.g. `560001` Bangalore).
3. **Connect Telegram**:
   - In Telegram, open [**@pricedroplivebot**](https://t.me/pricedroplivebot) and press **START**.
   - Your Telegram is now connected!
4. **Track a Product**: Click **"Track New Product"** and paste an Amazon or Flipkart link.
5. **Test Alerts**: Open the product card and click **"Test Drop Alert (10%)"** to confirm instant Telegram message delivery on your phone!
