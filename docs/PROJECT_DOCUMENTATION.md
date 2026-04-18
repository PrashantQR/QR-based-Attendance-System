# QR-based Attendance System - Detailed Project Documentation

## 1. Project Overview

The `QR-based-Attendance-System` is a full-stack academic management platform that combines:
- QR-based attendance tracking
- Role-based user management (teacher and student)
- Exam lifecycle management with QR session entry
- Result publication and analytics
- Instructor feedback/evaluation
- Web + Android (Capacitor) client delivery

The system is designed to reduce manual attendance overhead, improve reliability of classroom tracking, and add digital workflows for tests and feedback.

---

## 2. High-Level Architecture

### 2.1 Technology Stack

**Backend (`server/`)**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Helmet + CORS + express-rate-limit
- Nodemailer for password reset emails

**Frontend (`client/`)**
- React 18 + React Router
- Axios API client with environment-aware base URL logic
- Tailwind CSS + Bootstrap + React Icons + Framer Motion
- Chart.js/Recharts for visual analytics

**Android APK (`client/android/`)**
- Capacitor wrapper around React build output
- Android Studio build chain

### 2.2 Runtime Architecture

1. Client authenticates via `/api/auth/*` and stores JWT.
2. API middleware validates JWT and injects `req.user`.
3. Role-based middleware enforces access control.
4. Feature routes persist/query MongoDB models.
5. In production, Express serves static React build from `client/build`.
6. For Android, Capacitor packages built web assets into native WebView.

---

## 3. Repository Structure

```
QR-based-Attendance-System/
├── client/                     # React frontend + Capacitor config
│   ├── src/
│   │   ├── components/         # auth, teacher, student, layout, results
│   │   ├── contexts/           # Auth context and state management
│   │   ├── utils/              # axios instance and helpers
│   │   └── App.js              # top-level route orchestration
│   ├── android/                # Capacitor Android project
│   ├── capacitor.config.json   # Capacitor runtime configuration
│   └── package.json
├── server/                     # Express API
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # feature APIs
│   ├── middleware/             # auth and authorization middleware
│   ├── utils/                  # email, templates, URL helpers
│   └── index.js                # server bootstrap + middleware + routing
├── docs/
│   ├── ANDROID_APK.md
│   └── SMTP_SETUP.md
├── config.env                  # local env template-style file
└── README.md
```

---

## 4. Core Functional Modules

### 4.1 Authentication & Authorization

**Backend files**
- `server/routes/auth.js`
- `server/middleware/auth.js`
- `server/models/User.js`

**Capabilities**
- Register/login with JWT issue
- Get/update current profile
- Change password
- Forgot password + reset via email token
- Role-aware user listing for teacher workflows

**Access model**
- `protect` middleware verifies bearer token
- `authorize(...roles)` middleware enforces role-level route access

---

### 4.2 QR Attendance Module

**Backend files**
- `server/routes/qr.js`
- `server/routes/attendance.js`
- `server/models/QRCode.js`
- `server/models/Attendance.js`

**Teacher workflow**
- Generate QR with academic context (course/semester/subject)
- Time-bounded validity (default from route logic)
- Optionally computes eligible students by subject/course context

**Student workflow**
- Scan and validate QR
- Mark attendance with status handling (`present`, `late`, etc.)

**Analytics**
- Teacher attendance-by-date endpoint includes stats and subject summaries
- Student attendance history endpoints available via attendance routes

---

### 4.3 Exam Management Module

**Backend files**
- `server/routes/tests.js`
- `server/routes/exam.js`
- `server/routes/results.js`
- `server/models/Test.js`
- `server/models/TestAttempt.js`
- `server/models/Subject.js`

**Teacher side (`tests.js`)**
- Create tests manually
- Import questions from CSV/XLSX
- Activate tests
- Publish results only after completion logic
- Generate exam QR token (`/:id/qr`) with expiry

**Student side (`exam.js`)**
- Start exam only with valid QR token + valid subject access
- Resume active attempt
- Submit attempt and compute score
- Preview exam metadata before attempt
- Retrieve own result once published

**Results (`results.js`)**
- Student result listing and detailed per-test view
- Teacher test summary and per-test student breakdown

---

### 4.4 Academic Master Data

**Backend files**
- `server/routes/academic.js`
- `server/models/Course.js`
- `server/models/Subject.js`

**Capabilities**
- Manage courses
- Manage subjects per course/semester
- Fetch teacher-available subjects for exam/attendance flows

---

### 4.5 Evaluation & Feedback

**Backend files**
- `server/routes/evaluation.js`
- `server/routes/feedback.js`
- `server/routes/evaluationsStats.js`
- `server/models/Evaluation.js`

**Capabilities**
- Students submit structured instructor evaluations (ratings + optional comment)
- Duplicate submission guard for same student/instructor/course
- Teachers view anonymous feedback list
- Teachers view aggregated evaluation stats

---

### 4.6 Frontend Route Layout

**Top-level auth split (`client/src/App.js`)**
- Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
- Authenticated redirect by role:
  - teacher -> `/teacher/*`
  - student -> `/student/*`

**Teacher dashboard routes (`client/src/components/teacher/TeacherDashboard.js`)**
- `/teacher/` dashboard home
- `/teacher/qr-generate`
- `/teacher/attendance`
- `/teacher/evaluation`
- `/teacher/students`
- `/teacher/exams`
- `/teacher/results` and per-test detail

**Student dashboard routes (`client/src/components/student/StudentDashboard.js`)**
- `/student/` dashboard home
- `/student/scan`, `/student/my-attendance`
- `/student/evaluate-instructor`
- Exam flow routes under `/student/exam/*`
- Results routes under `/student/results*`

---

## 5. API Surface Map (by route file)

### `server/index.js` route mounting
- `/api/auth` -> `routes/auth.js`
- `/api/qr` -> `routes/qr.js`
- `/api/attendance` -> `routes/attendance.js`
- `/api/evaluation` -> `routes/evaluation.js`
- `/api/feedback` -> `routes/feedback.js`
- `/api/evaluations` -> `routes/evaluationsStats.js`
- `/api/students` -> `routes/students.js`
- `/api/dashboard` -> `routes/dashboard.js`
- `/api` -> `routes/academic.js`
- `/api/tests` -> `routes/tests.js`
- `/api/exam` -> `routes/exam.js`
- `/api/results` -> `routes/results.js`
- `/api/health` -> health probe endpoint

---

## 6. Data Model Summary

Defined in `server/models/`:
- `User.js` - identity, role, profile, auth/password helpers
- `QRCode.js` - attendance session QR metadata and expiry
- `Attendance.js` - attendance records linked to student/teacher/QR
- `Course.js` - course master data
- `Subject.js` - subject master data
- `Test.js` - exam/test metadata + questions + QR token state
- `TestAttempt.js` - per-student test attempt and scoring
- `Evaluation.js` - instructor evaluation responses

---

## 7. Security & Reliability Controls

Implemented mostly in `server/index.js` and middleware:
- `helmet()` for HTTP hardening
- CORS allowlist with dynamic handling for:
  - local web (`localhost:3000`)
  - deployed origins (`onrender.com`, `vercel.app`)
  - Capacitor/Ionic app origins (`https://localhost`, `capacitor://...`)
- Global rate limiter (15 min window, request cap)
- JWT authentication middleware
- Role-based access restrictions
- API 404 handler for unmatched `/api/*`
- Global error handler
- Process-level fatal error hooks

---

## 8. Configuration & Environment Variables

### 8.1 Backend (`config.env` / deployment env)

Common variables:
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `FRONTEND_URL`

Email variables:
- `SMTP_EMAIL`
- `SMTP_PASSWORD`
- `FROM_NAME`
- `FROM_EMAIL`
- Optional mode control: `SMTP_SERVICE` (`gmail` default, or `smtp/custom`)
- Optional custom smtp host for non-gmail mode: `SMTP_HOST`

### 8.2 Frontend

- `REACT_APP_API_BASE_URL` (used by `client/src/utils/api.js`)

Behavior in `utils/api.js`:
- Dev (`npm start`): uses relative `/api` via CRA proxy
- Native/app shell detection (Capacitor/WebView): uses absolute API origin
- Production web: defaults to same-origin `/api` unless env override is set

---

## 9. Build, Run, and Deployment

### 9.1 Local development

From repo root:
```bash
npm install
cd client && npm install && cd ..
npm run dev
```

### 9.2 Production web build

From repo root:
```bash
npm run build
npm start
```

### 9.3 Android APK (Capacitor)

From `client/`:
```bash
npm run cap:sync
npm run cap:open
```

This builds the React app, syncs web assets into Android project, and opens Android Studio for APK generation.

Detailed APK guide: `docs/ANDROID_APK.md`

---

## 10. Email/Password Reset Flow

Files involved:
- `server/routes/auth.js`
- `server/utils/sendEmail.js`
- `server/utils/publicAppUrl.js`
- `server/utils/emailTemplates.js`

Flow:
1. User requests reset (`POST /api/auth/forgot-password`).
2. API creates token and expiry on user document.
3. API builds reset link using public app base URL (derived from `FRONTEND_URL` or request host).
4. API sends mail through nodemailer transporter.
5. User opens link and submits new password via reset endpoint.

For SMTP-specific setup and troubleshooting, see `docs/SMTP_SETUP.md`.

---

## 11. Known Operational Notes

- Render cold starts may produce temporary latency.
- Source map warnings from some third-party frontend packages may appear during CRA builds; build output still succeeds.
- If Android app cannot hit API, verify:
  - latest APK is rebuilt and reinstalled
  - API base URL in `.env.production` / runtime config
  - backend CORS includes Capacitor/WebView origins

---

## 12. Suggested Future Enhancements

- Add OpenAPI/Swagger specification and generated API docs.
- Add automated tests (unit/integration/e2e) and CI pipeline.
- Introduce refresh tokens or short-lived access token rotation.
- Add admin panel for governance and audit actions.
- Add centralized structured logging and observability (request IDs + metrics).

---

## 13. Quick File Reference

- Backend entry: `server/index.js`
- Auth middleware: `server/middleware/auth.js`
- Main API route files: `server/routes/*.js`
- Data models: `server/models/*.js`
- Frontend route root: `client/src/App.js`
- API client: `client/src/utils/api.js`
- APK config: `client/capacitor.config.json`
- APK guide: `docs/ANDROID_APK.md`
- SMTP guide: `docs/SMTP_SETUP.md`
