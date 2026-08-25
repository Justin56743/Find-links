# 🚀 Find-Links Cloud Deployment & 24/7 Keep-Alive Guide

This guide details how to host **Find-Links** completely free in the cloud with:
- **Database**: 100% free serverless **PostgreSQL** on **Neon.tech** (permanent, zero data loss on restarts).
- **Backend & Telegram Bot**: Hosted on **Render** with 24/7 continuous uptime.
- **Frontend**: Hosted on **Vercel** with high-speed global CDN.

---

## 🗄️ Step 1: Create Free PostgreSQL Database on Neon.tech (30 Seconds)

1. Open [**Neon.tech**](https://neon.tech) and click **Sign Up** (with GitHub or Google).
2. Click **Create Project**:
   - **Project Name**: `find-links-db`
   - **Region**: `AWS Singapore (ap-southeast-1)` *(Best for Indian users)*
   - **Postgres Version**: `16` (Default)
3. Click **Create Project**.
4. In your project dashboard, look at the **Connection Details** box.
5. Select **Prisma** or **Pooled connection** and copy the connection string:
   ```text
   postgresql://neondb_owner:npg_ABC123xyz@ep-cool-sample-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   *(Keep this string handy for Step 2)*.

---

## ⚙️ Step 2: Configure Render Backend Environment Variables

1. Go to your [**Render Dashboard**](https://dashboard.render.com) and click on your `find-links-backend` service.
2. Go to **Environment** (or **Environment Variables** in Settings).
3. Set the following environment variables:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require` | Your Neon connection string from Step 1 |
| `JWT_SECRET` | `find_links_super_secure_prod_key_2026_xyz` | Any random 32-character secret |
| `TELEGRAM_BOT_TOKEN` | `8493687278:AAGLFqtKAzsbAzTe5lcIaJS2E21s2xg25j0` | Your Telegram Bot token from @BotFather |
| `TELEGRAM_BOT_USERNAME` | `pricedroplivebot` | Your Telegram Bot username (without `@`) |
| `CRON_INTERVAL` | `*/10 * * * *` | Checks prices every 10 minutes |
| `MOCK_SCRAPER_FALLBACK`| `true` | Scraper resilience safety |
| `NODE_ENV` | `production` | Production mode |

4. Click **Save Changes**. Render will automatically redeploy and sync your database tables using Prisma!

---

## 💓 Step 3: Keep Render Online 24/7 For Free (Prevent Sleep)

Render's free tier automatically goes to sleep after 15 minutes of inactivity. To keep your price scraper checking every 10 minutes and Telegram bot awake 24/7:

1. Open [**UptimeRobot.com**](https://uptimerobot.com) and sign up for a free account.
2. Click **+ Add New Monitor**.
3. Configure the monitor:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Find-Links Price Bot Keep-Alive`
   - **URL (or IP)**: `https://<YOUR-RENDER-BACKEND-URL>/api/health`
   - **Monitoring Interval**: `Every 5 minutes`
4. Click **Create Monitor**.

🎉 **That's it!** UptimeRobot will ping your backend every 5 minutes. Render will **never go to sleep**, keeping your 10-minute price scraper running 24/7/365!

---

## 🌐 Step 4: Deploy / Redeploy Frontend on Vercel

1. Go to your [**Vercel Dashboard**](https://vercel.com).
2. Ensure your Project **Settings** → **Environment Variables** has:
   - `VITE_API_URL`: `https://<YOUR-RENDER-BACKEND-URL>`
3. In the **Deployments** tab, click **Redeploy**.

---

## ✅ Verification Checklist

1. **Persistent Database Test**:
   - Add a product in the web app.
   - Go to Render and trigger a **Manual Deploy** / Restart.
   - Refresh your dashboard: all your tracked products, price history charts, and settings are **100% preserved** in Neon PostgreSQL!
2. **24/7 Telegram Test**:
   - Open [@pricedroplivebot](https://t.me/pricedroplivebot) on Telegram and press `/start`.
   - Your bot will remain online 24/7 and push alerts whenever prices drop!
