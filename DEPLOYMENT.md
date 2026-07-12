# 🚀 Deployment Guide

Your application consists of three main parts:
1.  **Frontend**: React + Vite (hosted on Vercel)
2.  **Backend**: Fastify + Node.js (hosted on Heroku)
3.  **Database & Storage**: Supabase (PostgreSQL & Object Storage)

---

## ☁️ Deploying the Backend Server

You can deploy the contents of the `server/` directory to **Heroku**, **Railway**, **Render**, or **Fly.io**. Below are instructions for Heroku.

### Option 1: Heroku (Recommended)

1.  **Prepare local Git**: Ensure your changes are committed on your repository.
2.  **Log in to Heroku CLI**:
    ```bash
    heroku login
    ```
3.  **Create your Heroku App**:
    ```bash
    heroku create <your-app-name>
    ```
4.  **Set Environment Variables (Config Vars)**:
    Set these in the Heroku Dashboard under **Settings > Config Vars** or via CLI:
    *   `DATABASE_URL`: Your Supabase Transaction Pooler URL (port 6543).
    *   `BETTER_AUTH_SECRET`: The same secret from your local `.env`.
    *   `BETTER_AUTH_URL`: Your frontend custom URL (e.g. `https://evergreeners.dev`) or the Heroku backend URL depending on your configuration.
    *   `ALLOWED_ORIGINS`: Comma-separated Vercel Frontend and local dev URLs (e.g. `https://evergreeners.dev,https://evergreeners.vercel.app`).
    *   `APP_URL`: Your frontend application URL (e.g. `https://evergreeners.dev`).
    *   `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App credentials.
    *   `RESEND_API_KEY` & `EMAIL_FROM`: Resend email API configuration.
    *   `GEMINI_API_KEY`: Google Generative AI API key for intelligence reports.
    *   `SUPABASE_URL`: Your Supabase project URL (e.g. `https://<ref>.supabase.co`).
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret API key (bypasses RLS to write uploads).
    *   `USE_NPM_INSTALL`: Set to `true` to ensure npm resolves and compiles platform-specific esbuild dependencies on Heroku's Linux containers.

5.  **Deploy the backend subdirectory**:
    Since the backend code lives inside the `/server` directory of the monorepo, push only the subdirectory using `git subtree` or create a clean temporary deploy repository inside `/server`:
    ```bash
    cd server
    git init
    git add .
    git commit -m "Deploy to Heroku"
    git remote add heroku https://git.heroku.com/<your-app-name>.git
    git push --force heroku master
    ```
    *Note: The Procfile inside `/server` automatically handles running migrations (`release: npm run db:migrate`) and booting up the app (`web: npm start`).*

---

## 🗄️ Supabase Storage Setup

To support community image uploads, you must create a storage bucket in Supabase:
1.  Go to your **Supabase Dashboard → Storage**.
2.  Create a new bucket named `community-images`.
3.  Make sure the bucket is configured as **Public** so files can be publicly read by clients.

---

## 🔗 Connecting Frontend to Backend

Once your backend is live on Heroku (e.g., `https://evergreeners-backend-2f9624f97235.herokuapp.com`), you need to route requests from your frontend:

1.  Open your project's [vercel.json](file:///home/adam/Projects/Evergreeners-main/vercel.json).
2.  Update the destination for `/api/(.*)` rewrites to point to your Heroku app:
    ```json
    {
      "rewrites": [
        {
          "source": "/api/(.*)",
          "destination": "https://<your-heroku-app-name>.herokuapp.com/api/$1"
        },
        ...
      ]
    }
    ```
3.  Commit and push this change to your main branch on GitHub to trigger a frontend redeployment on Vercel.

---

## ✅ Checklist for Public Launch

- [ ] **Backend Deployed**: Fastify running on Heroku.
- [ ] **Database Migrated**: Applied drizzle schemas in the database.
- [ ] **Supabase Storage Bucket**: Created `community-images` public bucket.
- [ ] **Vercel Rewrites**: Configured `vercel.json` to proxy `/api/` to Heroku.
- [ ] **GitHub OAuth callback**: Updated to point to your new backend URL on Heroku.

