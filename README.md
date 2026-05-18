# PerformiX — Enterprise Goal Management Platform

> A polished, production-ready enterprise SaaS platform for goal setting, quarterly check-ins, AI-powered insights, and org-wide performance tracking.

![PerformiX](https://img.shields.io/badge/PerformiX-v1.0-black?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-5.22-teal?style=flat-square)

---

## 🏗️ Architecture

```
performix/
├── src/
│   ├── app/                   # Next.js 15 App Router pages
│   │   ├── auth/login/        # Login page
│   │   ├── dashboard/         # Role-specific dashboards
│   │   ├── goals/             # Employee goal management
│   │   ├── approvals/         # Manager approval workflow
│   │   ├── checkins/          # Quarterly check-ins
│   │   ├── analytics/         # Recharts analytics
│   │   ├── team/              # Team overview
│   │   ├── audit/             # Audit log (Admin/Manager)
│   │   ├── settings/          # Admin configuration
│   │   ├── ai/                # GoalIQ AI insights
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── layout/            # AppShell (sidebar + topbar)
│   │   ├── dashboard/         # Dashboard components
│   │   ├── goals/             # Goal CRUD + approvals
│   │   └── charts/            # Recharts analytics
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # JWT auth utilities
│   │   └── utils.ts           # Helpers, calculations
│   ├── types/index.ts         # TypeScript types
│   └── styles/globals.css     # Design system
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
└── package.json
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd performix
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and JWT_SECRET
```

### 3. Set up database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed demo accounts + data
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Employee | `employee@performix.com` | `GoalSync123` |
| Manager | `manager@performix.com` | `GoalSync123` |
| Admin / HR | `admin@performix.com` | `GoalSync123` |

---

## ✨ Feature Overview

### 🔐 Authentication
- JWT-based session auth with HTTP-only cookies
- Bcrypt password hashing
- Middleware route protection per role
- Role-based sidebar navigation

### 👤 Employee
- Create goals with AI-powered GoalIQ generator
- Weightage validation (min 10%, total 100%, max 8 goals)
- Submit goals for approval
- Quarterly check-in updates (Q1–Q4)
- Personal analytics with Recharts

### 👥 Manager
- Approve / Reject / Return goals with comments
- Team completion heatmap
- Quarterly check-in oversight
- Team drill-down analytics

### 🔧 Admin / HR
- Organization-wide analytics
- Department completion charts
- User management table
- Cycle management (create, activate, close)
- Escalation rule monitoring
- Shared goal push to departments
- Full audit log with export

### 🤖 GoalIQ AI Assistant
- Conversational AI powered by Claude (claude-sonnet-4)
- AI goal generator from vague input
- Goal health analysis
- Risk identification
- Q2 summary drafting
- Completion forecasting
- Persistent conversation context

---

## 🎨 Design System

**Color palette:**
- Background: `#ffffff` / `#f8f8f8`
- Primary text: `#111111`
- Secondary text: `#444444`
- Muted: `#777777` / `#aaaaaa`
- Border: `#e5e5e5` / `#d4d4d4`
- Success: `#16a34a`
- Warning: `#b45309`
- Danger: `#dc2626`

**Inspired by:** Linear, Vercel, Notion, Stripe Dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Database | PostgreSQL (Neon/Supabase) |
| ORM | Prisma 5 |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| AI | Anthropic Claude API |
| Notifications | Sonner |
| Icons | Lucide React |

---

## 📊 Database Schema

Core models:
- `User` — with roles (EMPLOYEE, MANAGER, ADMIN)
- `Department` — org structure
- `Cycle` — goal setting cycles (FY2025, etc.)
- `Goal` — individual/shared goals with full lifecycle
- `CheckIn` — quarterly Q1–Q4 achievement tracking
- `Notification` — in-app notification system
- `AuditLog` — full action history
- `Escalation` — configurable escalation chains

---

## 🚢 Deployment

### Vercel (recommended)
```bash
vercel deploy
# Set env vars in Vercel dashboard
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📄 License

MIT — Built for PerformiX Enterprise Goal Platform
