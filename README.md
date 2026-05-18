# PerformiX 🚀  
### AI-Powered Enterprise Goal Setting & Performance Management Platform

PerformiX is a modern enterprise-grade SaaS platform designed to streamline employee goal management, approvals, quarterly performance tracking, analytics, reporting, and audit workflows through intelligent automation and scalable architecture.

Built for the **ATOMQUEST Hackathon 1.0**, the platform combines secure role-based workflows with AI-assisted productivity features to create a complete enterprise performance management solution.

---

# 🌐 Live Demo

## 🔗 Deployed Application
https://performi-x.vercel.app/

---

# 👨‍💻 Demo Credentials

## Admin (Full Access & Settings)

| Role | Email | Password |
|---|---|---|
| Admin / HR | admin@performix.com | admin123 |

---

## Managers (Team Analytics & Approvals)

| Role | Email | Password |
|---|---|---|
| Sales Manager | manager@performix.com | manager123 |
| Engineering Lead | eng.manager@performix.com | manager123 |

---

## Employees (Goal Creation & Check-ins)

| Role | Email | Password |
|---|---|---|
| Sales Representative 1 | employee@performix.com | employee123 |
| Sales Representative 2 | sales2@performix.com | employee123 |
| Developer 1 | dev1@performix.com | employee123 |
| Developer 2 | dev2@performix.com | employee123 |
| Marketing Executive | marketing@performix.com | employee123 |

---

# ✨ Key Features

## 👥 Role-Based Access Control (RBAC)

The platform supports three enterprise user roles:

### Employee
- Create and manage goals
- Submit quarterly check-ins
- Track personal analytics
- View manager feedback

### Manager
- Approve/reject employee goals
- Monitor team performance
- Export reports
- Review quarterly updates

### Admin / HR
- Organization-wide analytics
- User management
- Audit log tracking
- Department reporting

---

# 🤖 GoalIQ AI Assistant

PerformiX integrates an AI-powered productivity engine called **GoalIQ**.

### AI Capabilities
- SMART goal generation
- KPI recommendations
- Goal quality analysis
- Intelligent performance summaries
- AI-powered productivity suggestions

### Example

**Input:**  
> Improve sales performance

**AI Output:**  
> Increase quarterly sales conversion rate by 15% through CRM optimization and targeted lead tracking initiatives by Q3.

---

# 📊 Analytics Dashboard

Interactive dashboards provide:
- Team performance analytics
- Goal completion tracking
- Quarterly trend visualization
- Department insights
- Productivity monitoring

---

# 📁 Reporting System

Enterprise-grade reporting capabilities include:
- CSV exports
- Analytics reports
- Department reports
- Audit-ready exports

---

# 🔐 Authentication & Security

Implemented security systems:
- JWT Authentication
- Google OAuth
- Protected Routes
- Session Management
- Middleware Authorization

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────────────┐
                    │          Frontend            │
                    │   Next.js 15 + React UI     │
                    │   TailwindCSS + TypeScript  │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │         API Layer            │
                    │    Next.js API Routes        │
                    │ Authentication Middleware    │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼

┌────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ PostgreSQL DB  │     │   Anthropic AI     │     │   Google OAuth     │
│ Prisma ORM     │     │   GoalIQ Engine    │     │   Authentication   │
└────────────────┘     └────────────────────┘     └────────────────────┘
```

---

# ⚙️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + React + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon) |
| ORM | Prisma ORM |
| Authentication | JWT + Google OAuth |
| AI Integration | Claude API |
| Analytics | Recharts |
| Deployment | Vercel |

---

# 🔄 Workflow

```text
Employee Login
      ↓
Create Goals
      ↓
GoalIQ AI Suggestions
      ↓
Submit Goals
      ↓
Manager Approval
      ↓
Quarterly Check-ins
      ↓
Analytics Dashboard Updates
      ↓
CSV Reports & Audit Logs
```
---

# 🚀 Local Setup

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/performix.git
```

---

## 2. Navigate to Project

```bash
cd performix
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
ANTHROPIC_API_KEY=
```

---

## 5. Run Database Migration

```bash
npx prisma migrate dev
```

---

## 6. Start Development Server

```bash
npm run dev
```

---

# 🎯 Business Impact

PerformiX helps organizations:
- Improve productivity tracking
- Centralize performance management
- Reduce HR operational overhead
- Enable AI-assisted decision-making
- Streamline reporting and compliance

---

# 📌 Future Enhancements

- Predictive analytics
- Microsoft Teams integration
- Advanced AI forecasting
- HRMS integrations
- Real-time notifications

---

# 🏆 Hackathon Submission

Submitted for:

## ATOMQUEST Hackathon 1.0

---

# 👩‍💻 Developer

### Natasha Amrut Gawade

- GitHub: https://github.com/Natashagawade
- LinkedIn: https://www.linkedin.com/in/natashagawade/

---

# ⭐ Final Note

PerformiX demonstrates the implementation of a scalable enterprise SaaS platform combining:
- secure role-based workflows,
- AI-powered automation,
- analytics visualization,
- modern UI/UX,
- and production-ready architecture.
