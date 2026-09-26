# ইসমা গুড়া মসলা প্রাইভেট লিমিটেড — Setup Guide

## Two Ways to Run This App

### Option A: Local (One Device) — Easiest, No Setup
The app works **right now** on a single device with SQLite (no cloud needed).
- Data is saved on that device only.
- Perfect for one shop owner using one phone/computer.
- **Cost: Free forever.**

### Option B: Supabase (Multi-Device, Cloud Sync) — Recommended for 5-10 Users
All devices connect to the same cloud database. Everyone sees the same data.
- Works from anywhere (home, shop, market).
- Data is safe in the cloud (auto-backed-up).
- **Cost: Free forever** (Supabase free tier handles small shops easily).

---

## How to Set Up Supabase (Option B) — Step by Step

### Step 1: Create a Free Supabase Account
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub or email (free, no credit card)

### Step 2: Create a New Project
1. Click **"New Project"**
2. Name it: `isma-mosla` (or anything you like)
3. Set a strong database password — **WRITE THIS DOWN** (you'll need it)
4. Choose region: `Southeast Asia (Singapore)` or closest to Bangladesh
5. Click **"Create new project"** — wait ~2 minutes for setup

### Step 3: Get Your Database Connection String
1. In your Supabase dashboard, go to **Settings** (gear icon, bottom left)
2. Click **Database**
3. Find **"Connection string"** → select **"URI"** format
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres`
5. Replace `[YOUR-PASSWORD]` with the password you set in Step 2

### Step 4: Get Your API Keys
1. Still in Settings, click **API**
2. Copy these two values:
   - **Project URL**: `https://abcdefghijklm.supabase.co`
   - **anon public key**: `eyJhbGciOi...` (long string)

### Step 5: Add Credentials to Your App
Open the `.env` file in the project folder and replace the content with:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Replace `YOUR_PASSWORD`, `YOUR_PROJECT_REF`, and `YOUR_ANON_KEY` with your actual values.

### Step 6: Push Database to Supabase
Run this one command in the project folder:
```bash
bun run db:setup
```
This automatically:
- Detects Supabase (PostgreSQL) from your DATABASE_URL
- Switches to the Supabase schema
- Creates all 14 tables in your Supabase database
- Generates the Prisma client

### Step 7: Restart & Verify
```bash
bun run dev
```
Open the app — it now uses Supabase. Register a new shop, and all data is in the cloud.

---

## Deploying to Vercel (Free Hosting)

### Step 1: Push Code to GitHub
1. Create a GitHub repo
2. Push your project code to it

### Step 2: Connect to Vercel
1. Go to **https://vercel.com** → sign up with GitHub (free)
2. Click **"Add New Project"** → import your GitHub repo
3. Vercel auto-detects Next.js — keep default settings

### Step 3: Add Environment Variables
In Vercel project settings → **Environment Variables**, add:
- `DATABASE_URL` = your Supabase connection string
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

### Step 4: Set Build Command
In Vercel settings → Build & Development Settings:
- Build Command: `bun run db:setup && bun run build`

### Step 5: Deploy
Click **Deploy** — your app is live at `https://your-app.vercel.app`
All 5-10 users open this URL on their phones → same data, everywhere, free.

---

## Multi-User Guide

### How Multiple People Use the Same Shop Data

1. **Owner** registers a new shop → gets a **Shop Code** (e.g., `ISMA-AB1234`)
2. Owner shares the Shop Code with staff (via WhatsApp, SMS, verbally)
3. **Staff** opens the app → taps **"Join Existing Shop"** → enters:
   - Shop Code
   - Their name
   - Their phone number
   - Their own password
4. Staff now sees the **same products, sales, customers, reports** as the owner
5. Changes made by any user instantly appear for everyone

### Adding More Staff Later
Owner goes to: **Profile → Shop Members → Add Member**
- Or: new staff self-registers using the Shop Code

---

## Data Safety

- **Supabase**: Data is in the cloud, auto-backed-up, never lost
- **JSON Backup**: Profile → Backup → download a full JSON backup anytime
- **CSV Export**: Profile → Export → download all transactions as Excel/CSV

---

## Demo Login (for testing)
- **Phone**: `01700000000`
- **Password**: `1234`

---

## Cost Summary

| Item | Cost |
|------|------|
| Supabase (free tier) | $0 forever |
| Vercel (free tier) | $0 forever |
| This app | $0 forever |
| **Total** | **$0/month, forever** |

Supabase free tier includes:
- 500MB database (years of shop data)
- 50,000 monthly users (way more than 10)
- No credit card required
- No time limit

**You will never pay anything.**
