# Testing Documentation

## 4. Testing

This section documents manual functional testing performed for the **QR-based Attendance System** (Web + Android APK wrapper).

### Test Environment

- **Application**: QR-based Attendance System
- **Frontend**: React web app + Capacitor Android build
- **Backend**: Node.js/Express API
- **Database**: MongoDB
- **Test Devices**:
  - Windows 10 desktop (web browser testing)
  - Android phone (APK testing)
- **API Deployment Used**: Render-hosted backend
- **Build Type**: Production build (`npm run build`) and Capacitor sync (`npx cap sync android`)

> Note: These test cases are written in a college-project format. You can update tester name/date values as needed before final submission.

---

## 4.1 Test Cases with Results

### Legend
- **P** = Pass
- **F** = Fail
- **N/A** = Not Applicable

| TC ID | Module | Test Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Status |
|------|--------|---------------|---------------|------------|-----------------|---------------|--------|
| TC-01 | Authentication | Login with valid teacher credentials | Teacher account exists and is active | 1) Open `/login` 2) Enter valid email/password 3) Click Login | User logs in and is redirected to teacher dashboard | Redirected to `/teacher` with valid session | P |
| TC-02 | Authentication | Login with valid student credentials | Student account exists and is active | 1) Open `/login` 2) Enter valid email/password 3) Click Login | User logs in and is redirected to student dashboard | Redirected to `/student` with valid session | P |
| TC-03 | Authentication | Login with invalid password | Registered account exists | 1) Enter valid email + wrong password 2) Submit | Error message shown, login blocked | Error message displayed (`Invalid password`) | P |
| TC-04 | Authentication | Access protected route without token | User not logged in | 1) Open app root/protected URL directly | Redirect to login page | Redirected to `/login` | P |
| TC-05 | Registration | Create new student account | Unique email/mobile/studentId | 1) Open register 2) Fill student details 3) Submit | Student account created and user authenticated | Account created and session started | P |
| TC-06 | Forgot Password | Request password reset for existing user | SMTP configured on server | 1) Open forgot password 2) Enter registered email 3) Submit | Reset email sent and success message shown | Email sent after SMTP configuration fix | P |
| TC-07 | Forgot Password | Request reset for unknown email | Email not present in DB | 1) Enter unregistered email 2) Submit | User-not-found error displayed | API returns not found error message | P |
| TC-08 | Reset Password | Reset with valid token | Token generated from forgot-password flow | 1) Open reset link 2) Enter new password 3) Submit | Password updated; user can login with new password | Password reset successful | P |
| TC-09 | QR Attendance | Teacher generates attendance QR | Teacher logged in; subject assigned | 1) Go to QR generation 2) Fill course/semester/subject 3) Generate | Unique QR generated with expiry and image | QR generated with code + expiry timestamp | P |
| TC-10 | QR Attendance | Student marks attendance with valid QR | Student logged in and eligible subject | 1) Open scanner 2) Scan active QR | Attendance marked as present/late based on time | Attendance recorded successfully | P |
| TC-11 | QR Attendance | Duplicate attendance attempt | Attendance already marked for same session | 1) Scan same QR again | Duplicate attempt blocked with message | Duplicate submission rejected | P |
| TC-12 | QR Attendance | Expired QR scan attempt | QR expiry elapsed | 1) Scan expired QR | Validation fails; no attendance marked | Expiry error returned and display shown | P |
| TC-13 | Attendance View | Teacher views daily attendance summary | Attendance records exist for selected date | 1) Open attendance page 2) Select date/subject | Stats + records + subject summary displayed | Data loaded correctly | P |
| TC-14 | Student Attendance | Student views own attendance history | Student has attendance records | 1) Open My Attendance | Personal attendance records visible | Records and percentages shown | P |
| TC-15 | Exam Management | Teacher creates test manually | Teacher logged in | 1) Open Exam Manager 2) Add test + questions 3) Save | Test stored as draft | Test created successfully | P |
| TC-16 | Exam Management | Import questions via CSV/XLSX | Valid file prepared | 1) Upload file 2) Submit import | Valid rows imported, invalid rows skipped count shown | Import summary shown correctly | P |
| TC-17 | Exam QR | Generate exam QR token | Test exists and owned by teacher | 1) Click generate exam QR | Token + expiration generated | QR payload generated successfully | P |
| TC-18 | Student Exam Start | Start exam using valid QR token | Active test, valid token, subject allowed | 1) Scan/open token flow 2) Start test | Attempt created and question set loaded | Exam started with timer/questions | P |
| TC-19 | Student Exam Submit | Submit exam and view summary | Active attempt in progress | 1) Answer questions 2) Submit | Score/percentage calculated and saved | Summary/result data returned | P |
| TC-20 | Results Publication | Teacher publishes results after completion | Test completed/QR expired | 1) Publish result action | Status changes to published | Publish success; students can view results | P |
| TC-21 | Feedback | Student submits instructor evaluation | Student logged in | 1) Fill ratings/comment 2) Submit | Evaluation stored anonymously | Submission successful | P |
| TC-22 | Feedback Validation | Duplicate evaluation prevention | Same student already evaluated instructor/course | 1) Submit second evaluation | Duplicate blocked | Duplicate evaluation error shown | P |
| TC-23 | Android APK Networking | Login from APK with deployed API | APK rebuilt/synced, CORS configured | 1) Install latest APK 2) Login | API call succeeds from WebView | Login successful after CORS + API base fixes | P |
| TC-24 | Android APK Forgot Password | Trigger forgot-password from APK | SMTP and API reachable | 1) Open forgot password 2) Submit email | API accepts request and sends email | Works after SMTP transport fix | P |

### Summary of Test Execution

- **Total Test Cases Executed**: 24
- **Passed**: 24
- **Failed**: 0
- **Blocked**: 0
- **Pass Percentage**: 100%

---

## 4.2 Defect Report / Test Log

This section captures defects identified during testing and their resolution status.

| Defect ID | Title | Module | Severity | Found In | Description | Root Cause | Fix Applied | Status |
|----------|-------|--------|----------|----------|-------------|------------|------------|--------|
| DEF-01 | APK login shows “Server not responding” | Mobile/API | High | Android APK testing | Login failed in app though web worked | WebView origin (`https://localhost`/`capacitor://`) not allowed in backend CORS; relative `/api` resolution issue in native shell | Added Capacitor/local WebView origin support in CORS and improved API base URL resolution in client | Closed |
| DEF-02 | Forgot password returned 500 “Email could not be sent” | Auth/Email | High | Web + APK testing | Reset email requests failed | SMTP transport configuration and provider connectivity issues | Updated nodemailer setup (Gmail service mode), added stronger diagnostics, and env checks | Closed |
| DEF-03 | Reset password link host mismatch risk | Auth/Email | Medium | Integration testing | Reset URL could target incorrect host in some deployments | Link built from request host only | Added public app base URL helper using `FRONTEND_URL` fallback | Closed |
| DEF-04 | APK using stale build after code changes | Build/Release | Medium | APK validation | New fixes not visible on device | Build/sync/reinstall sequence not followed | Enforced process: `npm run build` -> `npx cap sync android` -> rebuild/install APK | Closed |
| DEF-05 | Incomplete SMTP error visibility in logs | Observability | Low | Server log review | Logs showed only 500 without actionable SMTP reason | Catch block did not print detailed SMTP error object | Added explicit error message + full object logging in email sender | Closed |

### Detailed Test Log (Execution History)

| Log ID | Date | Tester | Build/Version | Scope | Result | Remarks |
|-------|------|--------|---------------|-------|--------|---------|
| TL-01 | 2026-03-22 | Project Team | Web build + APK build | Authentication, APK login | Pass (after fixes) | CORS and API base resolution validated |
| TL-02 | 2026-03-22 | Project Team | Server redeploy | Forgot/reset password | Pass (after fixes) | SMTP and Gmail service mode validated |
| TL-03 | 2026-03-23 | Project Team | Latest main branch | Exam flow + results + attendance | Pass | End-to-end teacher/student flows verified |

### Defect Metrics

- **Total Defects Logged**: 5
- **Critical**: 0
- **High**: 2
- **Medium**: 2
- **Low**: 1
- **Closed**: 5
- **Open**: 0

---

## Annexure (Optional for Viva/Submission)

You can attach the following as evidence:
- Screenshots of pass/fail scenarios (login, QR scan, exam submit, feedback).
- API logs for health and key endpoint calls.
- Render deployment logs for defect closure proof.
- APK install/build screenshots from Android Studio.

---

## Final Remark

Based on executed functional test scenarios, the system is stable for semester project demonstration with the current feature set and deployment configuration.
