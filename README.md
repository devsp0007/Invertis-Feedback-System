# 🎓 Invertis Feedback System

> A production-grade, university-wide **Teaching-Learning Feedback System (TLFQ)** built for **Invertis University**. Enables structured, anonymous student feedback collection — department-wise, section-wise, and semester-wise — with full role-based access control.

---

## 🌐 Live Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 Invertis Feedback System              │
│                                                       │
│  Super Admin → Creates Departments, HODs, Coordinators│
│  Coordinator → Manages Sections, Faculty, Students   │
│  HOD         → Creates & Opens Evaluation Forms       │
│  Student     → Submits Feedback (Section-Filtered)    │
└─────────────────────────────────────────────────────┘
```

---

## 👥 Role Hierarchy

| Role | Access Level | Key Responsibilities |
|------|-------------|---------------------|
| **Super Admin** | University-wide | Create departments, HODs, and Coordinators |
| **Coordinator** | University-wide (all depts) | Manage sections, courses, faculty, student pre-enrollment |
| **HOD** | Own department only | Create TLFQ forms, set deadlines, open/close portal |
| **Student** | Own section only | View and submit feedback for their assigned faculty |

---

## 🔑 Authentication Flow

**Single unified login page** (`/login`) for all roles:

```
┌─ Enter Email or Student ID ─────────────────────────────┐
│                                                          │
│  Email (staff)     →  Enter Password  →  Dashboard       │
│                                                          │
│  Student ID (PENDING) → Set Email + Password → Login     │
│  Student ID (ACTIVE)  → Enter Password → Dashboard       │
└──────────────────────────────────────────────────────────┘
```

The system **auto-detects** whether the identifier is an email (staff) or a Student ID (student) and adjusts the flow accordingly.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas cluster (or local MongoDB)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/invertis-feedback-system.git
cd invertis-feedback-system

# 2. Backend setup
cd server
npm install
cp .env.example .env
# Edit .env — add your MONGO_URI and JWT_SECRET

# 3. Frontend setup
cd ../frontend
npm install

# 4. Start both (in separate terminals)
cd server && npm start       # → http://localhost:5000
cd frontend && npm run dev   # → http://localhost:5173
```

### Environment Variables (`server/.env`)

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/invertis_feedback
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
```

---

## 🧪 Demo Accounts (Auto-seeded)

> **Single Login Page** at `/login` — enter Email (staff) or Student ID (students)

### 👨‍💼 Staff Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@invertis.edu.in` | `Admin@2025` |
| Coordinator | `coordinator@invertis.edu.in` | `Coord@2025` |
| HOD – B.Tech AI | `hod.btai@invertis.edu.in` | `Hod@2025` |
| HOD – B.Tech CS | `hod.bcs@invertis.edu.in` | `Hod@2025` |
| HOD – Electronics | `hod.btec@invertis.edu.in` | `Hod@2025` |
| HOD – Mechanical | `hod.btme@invertis.edu.in` | `Hod@2025` |
| HOD – Civil | `hod.btce@invertis.edu.in` | `Hod@2025` |

### 🎓 Student Accounts

| Student ID | Email (after activation) | Password | Section | Status |
|-----------|--------------------------|----------|---------|--------|
| `BTAI2025_01` | `btai2025.01@iu.edu.in` | `Student@2025` | BTAI-3A, Sem 3 | Active |
| `BCS2025_01` | `bcs2025.01@iu.edu.in` | `Student@2025` | BCS-3A, Sem 3 | Active |
| `BTEC2025_01` | `btec2025.01@iu.edu.in` | `Student@2025` | BTEC-3A, Sem 3 | Active |
| `BTAI2025_02` | _(not set yet)_ | — | BTAI-3A, Sem 3 | **Pending** — triggers registration |
| `BCS2025_02` | _(not set yet)_ | — | BCS-3A, Sem 3 | **Pending** — triggers registration |

> **Note:** Each section has one pre-activated demo student. All other students in that section are `pending` — enter their Student ID on the login page to trigger the account activation flow.

---

## 📡 API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/check-student` | Public | Check if student ID exists & return status |
| POST | `/auth/complete-registration` | Public | Activate pending student: set email + password |
| POST | `/auth/login` | Public | Unified login — accepts **email** or **student_id** + password |
| GET | `/auth/me` | Authenticated | Get current user profile |

### Coordinator (`/api/coordinator`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET/POST | `/coordinator/departments` | coordinator, super_admin | List / create departments |
| GET/POST | `/coordinator/sections` | coordinator, super_admin | List / create sections |
| GET/POST | `/coordinator/courses` | coordinator, super_admin | List / create courses |
| GET/POST | `/coordinator/faculty` | coordinator, super_admin | List / add faculty |
| POST | `/coordinator/assignments` | coordinator, super_admin | Assign faculty to section+course |
| GET/POST | `/coordinator/students` | coordinator, super_admin | List / pre-create student records |
| PUT | `/coordinator/students/:id/reset-password` | coordinator, super_admin | Reset student password |

### Super Admin (`/api/superadmin`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/superadmin/hods` | super_admin | Create HOD account |
| POST | `/superadmin/coordinators` | super_admin | Create Coordinator account |
| GET | `/superadmin/staff` | super_admin | List all HODs & coordinators |
| PUT/DELETE | `/superadmin/users/:id` | super_admin | Update / delete user |

### HOD (`/api/hod`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/hod/sections` | hod | View sections in own dept |
| GET | `/hod/section-faculty` | hod | Get faculty assignments for a section |
| GET | `/hod/stats` | hod | Department statistics |
| POST | `/hod/tlfq` | hod | Create evaluation form |
| GET | `/hod/tlfq` | hod | List own created forms |
| PUT | `/hod/tlfq/:id/toggle` | hod | Open / close a form |
| PUT | `/hod/tlfq/:id/deadline` | hod | Extend form deadline |
| GET/PUT | `/hod/portal` | hod | View / toggle department portal |

### Student (`/api/student`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/student/courses` | student | Get section-specific courses + TLFQs |
| GET | `/student/tlfq/:tlfqId` | student | Get specific evaluation form |
| POST | `/student/submit` | student | Submit feedback response |
| GET | `/student/analytics` | super_admin, hod | Department analytics |
| GET | `/student/leaderboard` | all | Anonymized leaderboard |

---

## 🗂️ Project Structure

```
invertis-feedback-system/
├── server/
│   ├── controllers/
│   │   ├── authController.js        # 2-step student auth
│   │   ├── coordinatorController.js # Section/faculty/student management
│   │   ├── hodController.js         # Form creation & portal control
│   │   ├── superadminController.js  # HOD/Coordinator creation
│   │   └── responseController.js    # Feedback submission & analytics
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── coordinatorRoutes.js
│   │   ├── hodRoutes.js
│   │   ├── superadminRoutes.js
│   │   └── responseRoutes.js
│   ├── middleware/
│   │   └── auth.js                  # JWT authenticate + role authorize
│   ├── db.js                        # Mongoose schemas + seed data
│   └── server.js                    # Express app entry point
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx            # Unified login (all roles — email or student ID)
        │   ├── Dashboard.jsx        # Role-aware dashboard hub
        │   ├── HODPanel.jsx         # HOD: form creation & portal management
        │   ├── CoordinatorPanel.jsx # 6-tab: sections, courses, faculty, students
        │   ├── SuperAdminPanel.jsx  # User & department management
        │   ├── Analytics.jsx        # Dept-wise analytics (charts)
        │   ├── TLFQPage.jsx         # Student feedback evaluation form
        │   └── Leaderboard.jsx      # Anonymized faculty leaderboard
        ├── components/
        │   ├── Navbar.jsx           # Glassmorphism topbar with role badge
        │   ├── Sidebar.jsx          # Role-filtered navigation
        │   └── ProtectedRoute.jsx   # JWT + role guard
        ├── context/
        │   └── AuthContext.jsx      # Global auth: login, logout, token
        └── services/
            └── api.js               # Axios instance with auto token injection
```

---

## 🛡️ Security Model

- **JWT Authentication** — all protected routes require valid tokens
- **Role-Based Authorization** — middleware checks role before every sensitive operation
- **Section Isolation** — students only see TLFQs matching their exact `section_id` and `semester`
- **Portal Gate** — HOD can disable all feedback submission for entire department instantly
- **Form Expiry** — each TLFQ has a `closing_time`; expired forms are auto-hidden from students
- **Anonymous Feedback** — student identity is never included in analytics or comment exports

---

## 🧩 Data Model

```
Department → Sections (semester + label: A/B/C)
           ↓
Section ←→ SectionFaculty (Faculty + Course per Section)
           ↓
TLFQ (Evaluation Form: section_id + course_id + faculty_id + closing_time)
           ↓
Response (student_id + tlfq_id) → Answers (question_id + rating 1-7)
```

---

## 🔄 Re-seeding the Database

```bash
cd server
node drop_db.js   # Drops all collections
npm start         # Server auto-seeds on next startup
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas via Mongoose |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| UI Icons | Lucide React |

---

## 📝 License

MIT License — Developed for Invertis University, Lucknow.
