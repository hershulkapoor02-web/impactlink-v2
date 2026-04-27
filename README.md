# ImpactLink v2 — Production Upgrade

> Data-Driven Volunteer Coordination Platform with Smart Matching, Needs Heatmap, Check-in Tracking, and Role-Based Dashboards

---

## What's new in v2

| Feature                        | Description |
|-------------------------------|-------------|
| **Needs Heatmap**             | Visual urgency grid grouped by city — color-coded by severity, filterable by category/status |
| **Skill-to-Task Matching**    | Algorithm scores volunteers by skill overlap, location, availability, and activity |
| **Best Matches feed**         | Volunteers see personalized ranked task list on their dashboard |
| **Check-in & hours tracking** | Volunteers check in/out; hours auto-log; coordinator verifies |
| **Coordinator role**          | New role: assign volunteers, verify attendance, flag needs |
| **Impact dashboard**          | NGO admins get charts on hours, tasks, completion rates |
| **Volunteer Certificate**     | Auto-generated verified contribution summary — printable |
| **NGO verification flow**     | Registration → pending → admin approves/rejects with note |
| **Light/Dark/System themes**  | Full design system with CSS tokens, smooth transitions |
| **Mobile bottom nav**         | Role-specific bottom tab bar on mobile |
| **Urgency scoring engine**    | Computed: severity × 15 + recency decay + report count weight |
| **Automated notifications**   | Urgent task alerts, shift reminders, application updates |

---

## Tech Stack

| Layer      | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS                   |
| Backend   | Node.js + Express                                |
| Database  | MongoDB (Atlas or local)                         |
| Auth      | JWT + bcryptjs                                   |
| Charts    | Recharts                                         |
| Fonts     | Plus Jakarta Sans (Google Fonts)                 |
| Design    | CSS custom properties — full light/dark theming  |

---

## Roles & URLs

| Role          | Dashboard      | Key Pages |
|--------------|---------------|-----------|
| Volunteer     | `/volunteer`   | Tasks, Matches, Check-in, Certificate, Leaderboard |
| Coordinator   | `/coordinator` | Task board, Attendance, Flag needs |
| NGO Admin     | `/org`         | Tasks, Needs, Volunteers, Impact report, Org profile |
| Super Admin   | `/admin`       | Overview, Users, Orgs, Needs Heatmap, Analytics |

---

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env — fill in MONGO_URI and JWT_SECRET
```

### 3. Seed demo data
```bash
cd server
node seed.js
```

### 4. Run both servers
```bash
# Terminal 1
cd server && npm run dev    # :5000

# Terminal 2
cd client && npm run dev    # :5173
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Accounts (password: `demo1234`)

| Email                  | Role          | Dashboard |
|-----------------------|--------------|-----------|
| `volunteer@demo.com`  | Volunteer     | /volunteer |
| `coord@demo.com`      | Coordinator   | /coordinator |
| `ngo@demo.com`        | NGO Admin     | /org |
| `admin@demo.com`      | Super Admin   | /admin |

---

## API Reference

```
POST  /api/auth/register         — register (volunteer / coordinator / ngo_admin)
POST  /api/auth/login            — login → JWT
GET   /api/auth/me               — current user
PUT   /api/auth/profile          — update profile

GET   /api/tasks                 — list (filter: status, category, urgency, search)
GET   /api/tasks/my-matches      — volunteer's personalized matches
GET   /api/tasks/mine            — volunteer's applied/assigned tasks
GET   /api/tasks/org             — org's tasks (coordinator/ngo_admin)
GET   /api/tasks/:id             — task detail
POST  /api/tasks                 — create (ngo_admin / coordinator)
PUT   /api/tasks/:id             — update
POST  /api/tasks/:id/apply       — volunteer applies
PUT   /api/tasks/:id/applicants/:userId — accept/reject applicant
POST  /api/tasks/:id/checkin     — volunteer checks in
POST  /api/tasks/:id/checkout    — volunteer checks out (logs hours)
PUT   /api/tasks/:id/verify/:userId    — coordinator verifies attendance
PUT   /api/tasks/:id/complete    — mark task complete
GET   /api/tasks/:id/matches     — top matched volunteers for a task

GET   /api/needs                 — list (filter: category, status)
POST  /api/needs                 — create
PUT   /api/needs/:id             — update
DELETE /api/needs/:id            — delete

GET   /api/orgs                  — list approved orgs
GET   /api/orgs/mine             — own org (ngo_admin)
PUT   /api/orgs/:id              — update org
PUT   /api/orgs/:id/verify       — approve/reject (super_admin)

GET   /api/users/volunteers      — list volunteers
GET   /api/users/leaderboard     — top 25 by hours
GET   /api/users/stats           — platform stats (admin / ngo_admin)
GET   /api/users/me/certificate  — own certificate data
GET   /api/users/:id/certificate — any user's certificate

GET   /api/notifications         — user's notifications
PUT   /api/notifications/read-all
PUT   /api/notifications/:id/read
```

---

## Matching Algorithm

Scores each volunteer against a task (0–100):
- **Skill overlap** — up to 60 pts (matched skills / required skills × 60)
- **Availability** — full_time: 20, part_time: 15, weekends: 10, on_demand: 5
- **Location match** — same city: 15 pts, same state: 7 pts
- **Activity bonus** — active within 7 days: 5 pts

---

## Urgency Score Formula

```
urgencyScore = (severityScore × 15) + max(0, 10 − daysSinceReported × 0.3) + (reportCount × 2)
```

Max theoretical: ~95 for a severity-5 need reported today with many confirmations.

---

## Phase 3 (Next features to add)
- [ ] Socket.io real-time notifications
- [ ] File upload for field reports (Multer + Cloudinary)
- [ ] CSV/PDF survey ingestion → auto-create Needs
- [ ] Geographic map with Mapbox GL
- [ ] Email notifications via Nodemailer
- [ ] Volunteer availability calendar
- [ ] Task comments / coordinator messaging thread
