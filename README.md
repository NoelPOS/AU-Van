# AU Van

Production-oriented van booking platform for Assumption University, evolving from a campus MVP into a LINE-integrated system.

## Recruiter Quick View
- **Problem solved:** replaces manual LINE booking with structured booking, admin operations, and audit-friendly workflows.
- **Current state:** working web app with admin + student booking flows.
- **Target state:** admin web portal + student LIFF app + LINE bot/rich menu integration.
- **Focus areas:** backend architecture, reliability, role-based operations, and production readiness.

## Project Status
**In Progress (Active Development)**

This repository is intentionally transparent about what is complete vs planned.

## What Is Implemented
- User authentication (credentials + Google via NextAuth)
- Role-based admin access control
- Route and timeslot management
- Seat map and seat locking workflow
- Booking creation, updates, and cancellation
- Payment records with manual status update flow
- In-app and email notification foundations
- Admin dashboards for bookings, payments, users, and timeslots

## What Is In Progress
- LIFF student experience and LINE identity flow
- LINE Official Account bot + rich menu entry points
- Manual PromptPay proof submission and approval UX hardening
- Reminder scheduling and delivery retries
- Architecture hardening toward stronger Clean Architecture boundaries

## Architecture
### Current (implemented)
- Next.js App Router monolith
- API routes + service layer + Mongoose models
- NextAuth session-based auth
- MongoDB persistence
- SSE for real-time seat/notification updates

### Target (planned)
- Admin Portal (web)
- Student LIFF App (mobile-first inside LINE)
- LINE Bot webhook and rich menu integration
- Background worker for reminders/retries

See detailed implementation and architecture roadmap:
- [`docs/system-implementation-plan.md`](./docs/system-implementation-plan.md)

## Engineering Direction
This project is being refactored and expanded using:
- Clean Architecture boundaries
- SOLID principles
- Design patterns where appropriate (Strategy, Factory, Observer/Event-driven, Adapter)

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers, TypeScript
- **Auth:** NextAuth
- **Database:** MongoDB + Mongoose
- **Notifications:** SSE + Nodemailer
- **Validation:** Zod

## Local Development
### 1) Install
```bash
npm install
```

### 2) Configure environment
Create `.env.local`:
```env
MONGODB_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@auvan.com
SEAT_LOCK_TIMEOUT_MS=300000
```

### 3) Run
```bash
npm run dev
```

## Roadmap (High Level)
- Phase 1: data model and admin workflow hardening
- Phase 2: LIFF MVP for student booking
- Phase 3: LINE bot + rich menu + webhook integration
- Phase 4: reminder worker, retries, monitoring
- Phase 5: UAT and production rollout

## Why This Repo Is Portfolio-Relevant
- Demonstrates transition from MVP to production architecture
- Shows real-world constraints (manual operations, approval flows, role separation)
- Includes concurrency and operational reliability concerns
- Integrates product, backend, and platform thinking in one system

## Contact
Noel Paing Oak Soe  
Bangkok, Thailand  
Email: noelpaingoaksoe@gmail.com  
Portfolio: https://noelpos-dev.vercel.app  
GitHub: https://github.com/NoelPOS
