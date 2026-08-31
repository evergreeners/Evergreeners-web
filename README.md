<div align="center">
  <img src="public/icon.png" width="120" height="120" alt="Evergreeners Logo" />
  <h1>Evergreeners</h1>
  <p><strong>Track your consistency. Grow your legacy.</strong></p>
</div>

Evergreeners is a developer-focused habit and contribution tracking application.. a **digital garden** where consistency compounds over time. It helps users visualize daily activity, maintain streaks, and build a lasting record of effort.

## 📚 Documentation

The official Evergreeners documentation is now hosted in its own repository: [Evergreeners-Docs](https://github.com/evergreeners/Evergreeners-Docs).

It includes detailed guides on:
- **Getting Started**: Installation and local development.
- **Core Concepts**: Understanding the Streak Engine and Consistency Garden.
- **API Reference**: Technical details for developers.
- **Contributing**: How to get involved in the project.

---

## ✨ Features

- **GitHub-style Contribution Graph**: Visualize daily activity using a familiar heatmap.
- **Streak Tracking**: Track active streaks and maintain momentum over time.
- **Dark Mode First**: Developer-friendly dark UI powered by Tailwind CSS and `lucide-react`.
- **Authentication**: Secure email/password authentication using **Better Auth** (backend-only).
- **Responsive Design**: Optimized for desktop and mobile devices.
- **Backend API**: A Fastify server handling authentication, business logic, and data persistence with **Drizzle ORM** and **PostgreSQL**.

---

## 🧱 Architecture Overview

```text
Browser (React)
   ↓
Fastify API (Backend)
   ↓
Better Auth (Sessions & Users)
   ↓
Drizzle ORM
   ↓
PostgreSQL (Supabase)

```

> [!NOTE]
> Supabase is used strictly as a managed PostgreSQL database. All authentication and application logic live in the Fastify backend.

---

## 🛠️ Tech Stack

### Frontend

* **Framework**: React + Vite
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui
* **Icons**: Lucide React
* **State Management**: React Hooks & Context

### Backend (`/server`)

* **Server**: Fastify
* **Database**: PostgreSQL (Supabase)
* **ORM**: Drizzle ORM
* **Authentication**: Better Auth

---

## 🏁 Getting Started

### Prerequisites

* Node.js v18+
* A Supabase project (PostgreSQL)
* Git

### 📦 Installation

#### 1. Clone the Repository

```bash
git clone [https://github.com/evergreeners/Evergreeners-web.git](https://github.com/evergreeners/Evergreeners-web.git)
cd evergreeners

```

#### 2. Frontend Setup

```bash
npm install
npm run dev

```

The frontend will run on `http://localhost:5173`.

#### 3. Backend Setup

```bash
cd server
npm install

```

Create a `.env` file inside the `server` directory:

```env
PORT=3000

# PostgreSQL connection (Supabase)
DATABASE_URL="postgresql://app_user:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-secure-random-string"
BETTER_AUTH_URL="http://localhost:3000"

```

> [!IMPORTANT]
> **Security Notes:**
> * Do NOT use the Supabase postgres admin user in production.
> * Create a dedicated database role (e.g. `app_user`) with limited privileges.
> * Never commit `.env` files to version control.
> 
> 

#### 4. Database Migration

```bash
npm run db:generate
npm run db:migrate

```

#### 5. Run the Backend

```bash
npm run dev

```

The backend will run on `http://localhost:3000`.

---

## 📂 Project Structure

```text
evergreeners/
├── src/                 # Frontend React code
│   ├── components/      # Reusable UI components
│   ├── pages/           # App pages (Landing, Auth, Dashboard)
│   ├── lib/             # Utilities (auth client, helpers)
│   └── App.tsx
│
├── server/              # Backend (Fastify)
│   ├── src/
│   │   ├── db/          # Drizzle schema & DB connection
│   │   ├── auth.ts      # Better Auth configuration
│   │   └── index.ts     # Server entry point
│   └── drizzle/         # Migration files
│
└── README.md

```

---

## 🚀 Deployment

* **Frontend**: Vercel
* **Backend**: Railway, Fly.io, or Render
* **Database**: Supabase (PostgreSQL)

*Ensure production environment variables match your local `.env` configuration.*

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes: `git commit -m "Add your feature"`.
4. Push to your branch: `git push origin feature/your-feature-name`.
5. Open a Pull Request.

---

## 📄 License

This project is open-source and licensed under the **MIT License**.

---

## 💚 Vision

Evergreeners is about showing up every day — not perfection, but persistence. Small actions, done consistently, grow into something meaningful.

**Grow steadily. Stay evergreen. 🌲**
