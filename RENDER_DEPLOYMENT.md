# Deploy to Render - Complete Guide

## Step 1: Prepare Your Code for GitHub

1. **Export your current database data:**
   ```bash
   node scripts/export-data.js
   ```
   This creates `data-export.json` with all your current data.

2. **Create a new GitHub repository:**
   - Go to GitHub.com and click "New repository"
   - Name it: `long-quan-business-management`
   - Make it Public (required for free Render)
   - Don't initialize with README

3. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/long-quan-business-management.git
   git push -u origin main
   ```

## Step 2: Create Render Account & Deploy

1. **Sign up for Render:**
   - Go to render.com
   - Click "Get Started for Free"
   - Sign up with GitHub (recommended)

2. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `long-quan-db`
   - Database: `long_quan_business`
   - User: `long_quan_user`
   - Region: Choose closest to your users
   - Plan: **Free** (500MB storage)
   - Click "Create Database"
   - **IMPORTANT:** Copy the "External Database URL" - you'll need it

3. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect to your GitHub repository
   - Name: `long-quan-business-management`
   - Environment: `Node`
   - Region: Same as database
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**

4. **Set Environment Variables:**
   - In your web service settings, go to "Environment"
   - Add these variables:
     ```
     NODE_ENV=production
     DATABASE_URL=[paste your External Database URL here]
     ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

## Step 3: Set Up Database Schema

1. **Connect to your database:**
   - In Render dashboard, go to your PostgreSQL database
   - Click "Connect" and copy the PSQL Command
   - Run it in your terminal (or use the web shell)

2. **Create tables and import data:**
   ```sql
   -- Create tables (copy from your current schema)
   CREATE TABLE businesses (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     tax_id VARCHAR(20) NOT NULL UNIQUE,
     address TEXT,
     phone VARCHAR(20),
     email TEXT,
     website TEXT,
     industry TEXT,
     contact_person TEXT,
     account TEXT,
     password TEXT,
     bank_account TEXT,
     bank_name TEXT,
     custom_fields JSONB DEFAULT '{}',
     notes TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
   );

   CREATE TABLE document_transactions (
     id SERIAL PRIMARY KEY,
     business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     document_type TEXT NOT NULL,
     transaction_type TEXT NOT NULL,
     handled_by TEXT NOT NULL,
     transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
     notes TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
   );

   CREATE TABLE admin_users (
     id SERIAL PRIMARY KEY,
     username TEXT NOT NULL UNIQUE,
     password TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
   );
   ```

3. **Import your data:**
   - Use the data from `data-export.json`
   - Insert admin user:
   ```sql
   INSERT INTO admin_users (username, password) VALUES ('quanadmin', '01020811');
   ```
   - Import your businesses and documents as needed

## Step 4: Test Your Deployment

1. **Get your app URL:**
   - In Render dashboard, your web service will show a URL like:
   - `https://long-quan-business-management.onrender.com`

2. **Test the application:**
   - Visit your URL
   - Try adding a business
   - Test admin login with: `quanadmin` / `01020811`
   - Test document tracking features

## Step 5: Custom Domain (Optional)

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. **In Render:**
   - Go to your web service
   - Click "Settings" → "Custom Domains"
   - Add your domain
3. **Update DNS:**
   - Add CNAME record pointing to your Render URL

## Important Notes:

- **Free Limitations:**
  - 500MB database storage
  - Service sleeps after 15 min inactivity
  - 750 hours/month (enough for always-on)

- **Costs if you exceed free tier:**
  - Database: $7/month for 1GB
  - Web service: $7/month for always-on

- **Automatic deployments:**
  - Every time you push to GitHub, Render automatically redeploys

## Troubleshooting:

- If deployment fails, check the build logs in Render dashboard
- Database connection issues: Verify DATABASE_URL is correct
- App not loading: Check that port is set correctly (Render provides PORT env var)

Your app will be live at: `https://YOUR_APP_NAME.onrender.com`