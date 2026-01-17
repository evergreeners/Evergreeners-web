# 🚀 Deployment Guide

Your application consists of three main parts:
1.  **Frontend**: React + Vite (hosted on Vercel)
2.  **Backend**: Fastify + Node.js (needs hosting)
3.  **Database**: Supabase (already hosted)

You mentioned the Frontend and Database are ready. Now you need to **deploy the Backend**.

---

## ☁️ Deploying the Backend Server

You can deploy the contents of the `server/` directory to any Node.js hosting provider. Good options include **Railway**, **Render**, or **Fly.io**.

### Option 1: Railway (Recommended for Ease)

1.  Create a GitHub repository for your project (if you haven't already).
2.  Go to [Railway.app](https://railway.app/).
3.  Click "New Project" -> "Deploy from GitHub repo".
4.  Select your repository.
5.  **Important**: Configure the **Root Directory** to be `server`.
    *   Railway needs to know your backend code is in the subfolder.
6.  **Environment Variables**: Add the following variables in Railway:
    *   `DATABASE_URL`: Your Supabase Transaction Pooler URL (port 6543).
    *   `PORT`: `3000` (or `8080`, Railway usually assigns one automatically as `PORT`).
    *   `BETTER_AUTH_SECRET`: The same secret from your local `.env`.
    *   `BETTER_AUTH_URL`: The **Production URL** of your deployed backend (e.g., `https://evergreeners-backend.up.railway.app`).
        *   **Tip**: If you don't know this URL yet (because you haven't deployed), you can:
            1.  Deploy first (it might fail or behave oddly).
            2.  Copy the domain the host assigns you.
            3.  Update the variable.
            4.  Redeploy.
    *   `ALLOWED_ORIGINS`: Your Vercel Frontend URL (e.g., `https://evergreeners.vercel.app`).
7.  Deploy!

### Option 2: Render

Similar to Railway:
1.  Create a "Web Service".
2.  Connect your Repo.
3.  Set **Root Directory** to `server`.
4.  Set **Build Command**: `npm install && npm run build`.
5.  Set **Start Command**: `npm start`.
6.  Add Environment Variables (same as above).

---

## 🔗 Connecting Frontend to Backend

Once your backend is live (e.g., `https://evergreeners-backend.up.railway.app`), you need to tell your Vercel Frontend where to find it.

1.  Go to your project on **Vercel**.
2.  Go to **Settings** -> **Environment Variables**.
3.  Add a new variable:
    *   **Key**: `VITE_API_URL`
    *   **Value**: Your new Backend URL (e.g., `https://evergreeners-backend.up.railway.app`)
4.  **Redeploy** your frontend on Vercel for the changes to take effect.

---

## ✅ Checklist for Public Launch

- [ ] **Backend Deployed**: Server running on Railway/Render.
- [ ] **Backend Configured**: `ALLOWED_ORIGINS` set to your Vercel URL.
- [ ] **Frontend Configured**: `VITE_API_URL` set to your Backend URL.
- [ ] **Supabase**: Ensure Database is accessible (Transaction Pooler is recommended).

Once these steps are done, you can share your Vercel link with the world! 🌍
