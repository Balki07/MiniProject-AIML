# ⚡ Advertisement Express

> A production-ready, trust-based advertisement platform with AI-powered fraud prevention and verification.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.x-61DAFB)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791)

---

## 🎯 What is Advertisement Express?

Advertisement Express is a full-stack web application where **only verified and trustworthy advertisements are published**. Every ad submission goes through an automated **Trust Scoring Engine** that:

- Detects scam keywords (`earn money fast`, `guaranteed income`, etc.)
- Scores content quality, length, and completeness
- Rewards verified users and positive track records
- **Auto-approves** high-trust ads (score ≥ 80)
- **Sends borderline ads** (50–79) to admin review
- **Auto-rejects** low-trust ads (< 50)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js (MVC pattern) |
| **Database** | PostgreSQL via [Neon.tech](https://neon.tech) (serverless) |
| **Auth** | JWT (JSON Web Tokens) + bcrypt |
| **File Upload** | Multer (local disk → Cloudinary-ready) |
| **UI Icons** | Lucide React |

---

## ✨ Features

### 🔐 Authentication
- Register / Login with JWT
- Role-based access control (User / Admin)
- Protected routes on both frontend and backend

### 📝 Advertisement System
- Post ads with title, description, category, location, image
- **Instant trust scoring** on submission
- Status tracking: Pending → Approved / Rejected / Flagged

### 🧠 Verification Engine
```
Base Score: 50
+ 30  →  Verified user account
+ 20  →  Clean submission history
+ 20  →  No scam keywords detected
+ 10  →  Detailed description (150+ chars)
+ 5   →  Image uploaded
- 40  →  Scam keywords found
- 15  →  Suspicious formatting (ALL CAPS, excessive !!!)
- 10  →  Description too short
━━━━━━━━━━━━━━━━━━━
≥ 80  → ✅ Auto-Approved
50–79 → ⏳ Admin Review
< 50  → ❌ Auto-Rejected
```

### ⭐ Trusted Feed
- Only approved ads shown publicly
- Featured ads get priority placement
- Category & location filtering
- Trust score badges on every card

### 🚨 Reporting System
- Users can report suspicious ads
- 3 reports → ad auto-flagged for review
- User trust level recalculated after each moderation

### 🛠️ Admin Dashboard
- View ads by status (Pending / Approved / Rejected / Flagged)
- One-click Approve / Reject with reason
- Platform analytics: users, ads, fraud rate
- Manual user verification

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- A free [Neon.tech](https://neon.tech) PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/advertisement-express.git
cd advertisement-express
```

### 2. Set up the database
1. Sign up at [neon.tech](https://neon.tech) and create a project
2. Open the **SQL Editor** and run the full contents of `backend/schema.sql`
3. Copy your connection string from **Connection Details → Node.js**

### 3. Configure the backend
```bash
cd backend
cp .env.example .env
```
Edit `.env` and fill in:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your_long_random_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173

# Optional: moderation email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_app_password
SENDER_EMAIL=Advertisement Express <no-reply@example.com>
```

### 4. Install & start the backend
```bash
cd backend
npm install
npm run dev
# ✅ API running at http://localhost:5000
```

### 5. Install & start the frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# ✅ App running at http://localhost:5173
```

Frontend `.env` values:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔑 Default Accounts

After running `schema.sql`, a default admin is seeded:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@adexpress.com` | `Admin@123456` |

> ⚠️ **Change the admin password** before deploying to production.

---

## 📁 Project Structure

```
advertisement-express/
│
├── backend/
│   ├── schema.sql              ← PostgreSQL schema (run on Neon.tech)
│   ├── .env.example            ← Environment variable template
│   └── src/
│       ├── config/             ← DB connection, JWT helpers
│       ├── models/             ← SQL query functions (no ORM)
│       ├── services/
│       │   ├── verificationEngine.js  ← 🧠 Core trust scoring
│       │   └── trustService.js        ← User trust recalculation
│       ├── controllers/        ← Request handlers
│       ├── routes/             ← Express routers
│       ├── middleware/         ← Auth, RBAC, upload, validation
│       └── app.js              ← Express entry point
│
└── frontend/
    └── src/
        ├── context/            ← AuthContext (JWT state)
        ├── services/           ← Axios API instance
        ├── components/         ← Navbar, AdCard, TrustBadge, etc.
        └── pages/              ← All route-level pages
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/auth/me` | Auth | Get current user |

### Ads
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/ads` | Public | Trusted feed (approved ads) |
| `GET` | `/api/ads/:id` | Public | Single ad detail |
| `POST` | `/api/ads` | Auth | Submit new ad (runs verification) |
| `GET` | `/api/ads/user/my` | Auth | My ads |
| `POST` | `/api/ads/:id/click` | Public | Track click |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/analytics` | Admin | Dashboard stats |
| `GET` | `/api/admin/ads?status=` | Admin | Ads by status |
| `PUT` | `/api/admin/ads/:id/status` | Admin | Approve / Reject |
| `GET` | `/api/admin/users` | Admin | All users |
| `POST` | `/api/admin/users/:id/verify` | Admin | Verify a user |

### Reports
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/reports` | Auth | Report an ad |

---

## 🔒 Security Features

- **Helmet.js** — Secure HTTP headers
- **CORS** — Restricted to frontend origin
- **Rate Limiting** — 20 req/15min on auth, 100 req/10min on ads
- **bcrypt** — Password hashing (10 rounds)
- **JWT** — Stateless auth, 7-day expiry
- **express-validator** — Input validation & sanitization
- **SQL parameterization** — No raw query string concatenation

---

## 🗺️ Roadmap

- [ ] Cloudinary integration for production image storage
- [ ] Email verification on registration
- [ ] Featured ads (paid boost) with Stripe
- [ ] Real-time notifications (Socket.io)
- [ ] Mobile app (React Native)

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

<div align="center">
  Built with ❤️ using React, Express, and PostgreSQL
</div>
