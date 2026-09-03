# SpotFix V2 — Citizen ↔ Government Civic Issue Management & Approval System

SpotFix V2 is a complete civic issue reporting and municipal management platform built with **React Native**, **Expo (SDK 54)**, **Expo Router**, and **JavaScript / JSX only**, powered by a **Node.js, Express, MongoDB, and Mongoose** REST backend.

V2 introduces a two-tier **Citizen ↔ Government workflow** featuring role-based authentication, a government triage queue, review notes, mandatory rejection reasons, resolution proof photo uploads, an immutable audit trail (`statusHistory`), an in-app citizen notification center (`Alerts`), and comprehensive municipal analytics.

---

## 1. Core Architecture & Concept

### Roles

1. **Citizen (`role: 'citizen'`)**:
   - Self-registers via the public app registration screen.
   - Submits civic problems with photos or short videos, GPS coordinates, category, and description.
   - Automatically receives a human-readable identifier (e.g., `#SP-10024`).
   - Receives instant in-app alerts whenever their report's review state changes.
   - Inspects the full status timeline and views municipal **Resolution Proof** (after-repair photos and official completion notes).

2. **Government Official (`role: 'government'`)**:
   - Cannot register publicly; accounts are strictly provisioned or initialized via the seed script.
   - Reviews incoming municipal triage queue (`pending` and `under_review`).
   - Assigns priority (`Low`, `Medium`, `High`).
   - Marks reports **Under Review**, **Approve**, or **Reject** (with a mandatory reason).
   - Once approved work is completed, marks reports **Resolved** with resolution proof photographs and summary notes.
   - Explores municipal analytics (resolution rates, volume by category, status, and priority).
   - Reviews reports on an interactive geographic map.

---

## 2. Status Workflow & State Machine

Status transitions are governed by a centralized state machine (`backend/services/reportWorkflowService.js`). Illegal status transitions are rejected with **HTTP 409 Conflict**.

```text
    ┌───────────┐
    │  Pending  │ (Report created by citizen, audit trail initialized)
    └─────┬─────┘
          │
          ▼
   ┌──────────────┐
   │ Under Review │ (Municipal official reviews evidence & assigns priority)
   └──┬────────┬──┘
      │        │
      │        ▼
      │   ┌──────────┐
      │   │ Rejected │ (Mandatory rejection reason required; notification dispatched)
      │   └──────────┘
      ▼
 ┌──────────┐
 │ Approved │ (Verified and queued for field execution)
 └────┬─────┘
      │
      ▼
 ┌──────────┐
 │ Resolved │ (Requires resolution proof photo & note; notification dispatched)
 └──────────┘
```

### Transition Audit Trail
Every status change appends to the `statusHistory` array on the Report document:
- `status`: New status string
- `note`: Officer review note or resolution note
- `changedBy`: ObjectId referencing the responsible user
- `timestamp`: Date and time of the event

---

## 3. Technology Stack

### Mobile Frontend
- **Framework**: React Native 0.81.5 with Expo SDK 54 (~54.0.37)
- **Routing**: Expo Router (~6.0.24) with file-based layout groups
- **Language**: **JavaScript & JSX only** (0 `.ts` or `.tsx` files)
- **Hardware Integrations**:
  - `expo-camera`: Live preview, front/back flip, flash/torch, zoom, tap-to-focus, video recording.
  - `expo-location`: Real-time GPS tracking with `watchPositionAsync` and automatic watcher cleanup.
  - `expo-media-library`: Optional saving of captured photos to device gallery.
  - `react-native-maps`: Dynamic markers, callouts, priority color-coding.
  - `expo-secure-store`: Persistent JWT credential storage.
  - `@react-native-async-storage/async-storage`: Offline reports cache and theme preference.
  - `expo-contacts`: Local contact selection and native Phone, SMS, and Email deep linking.

### Backend REST API
- **Runtime**: Node.js v18+ with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with embedded `{ id, role }`
- **File Uploads**: Multer with file type and 30MB size validation
- **Security**: Password hashing via `bcryptjs`, role-based middleware (`requireRole('government')`), and ownership verification.

---

## 4. Folder Structure

```text
SpotFix/
├── app/
│   ├── _layout.jsx             # Root layout: Providers & dynamic stack
│   ├── index.jsx               # Role-based splash routing
│   ├── login.jsx               # Citizen and Government sign-in
│   ├── register.jsx            # Citizen self-registration
│   │
│   ├── (tabs)/                 # Citizen Bottom Tabs Navigator
│   │   ├── _layout.jsx         # Citizen tabs with dynamic unread badge
│   │   ├── home.jsx            # Infinite-scroll feed, search & category chips
│   │   ├── map.jsx             # Citizen civic issue map
│   │   ├── alerts.jsx          # Real-time notifications & unread tracker
│   │   ├── contacts.jsx        # Device contacts & native issue sharing
│   │   └── profile.jsx         # Citizen profile, stats & dark mode toggle
│   │
│   ├── (government)/           # Government Bottom Tabs Navigator
│   │   ├── _layout.jsx         # Government tabs layout
│   │   ├── queue.jsx           # Triage review queue with status tabs & priority
│   │   ├── map.jsx             # Municipal map with priority pins
│   │   ├── analytics.jsx       # Real-time municipal KPIs & charts
│   │   └── profile.jsx         # Official credentials & theme controls
│   │
│   ├── report/
│   │   ├── camera.jsx          # Camera viewfinder with flash, zoom, focus
│   │   ├── preview.jsx         # Preview, gallery save, video preview
│   │   ├── create.jsx          # Issue creation form with live GPS & draggable pin
│   │   └── [id].jsx            # Citizen detail view with audit timeline & resolution proof
│   │
│   ├── government/
│   │   └── report/
│   │       └── [id].jsx        # Government review screen with ReviewActionBar
│   │
│   └── edit/
│       └── [id].jsx            # Citizen report editing
│
├── components/
│   ├── PriorityBadge.jsx       # High, Medium, Low priority badges
│   ├── StatusBadge.jsx         # Pending, Under Review, Approved, Rejected, Resolved
│   ├── StatusTimeline.jsx      # Audit history timeline component
│   ├── ResolutionProofCard.jsx # Government resolution photo & summary card
│   ├── ReviewActionBar.jsx     # Under review, approve, reject, and resolve actions
│   ├── NotificationCard.jsx    # Notification alert card
│   ├── ReportCard.jsx          # Feed item with image, badges, and details
│   ├── CustomButton.jsx        # Styled interactive button
│   ├── CustomInput.jsx         # Text input with inline validation
│   └── EmptyState.jsx          # Contextual empty state
│
├── context/
│   ├── AuthContext.jsx         # Authentication state, token persistence & role flags
│   ├── NotificationContext.jsx # In-app notification state & unread count badge
│   ├── ReportContext.jsx       # Reports feed, offline caching & pagination
│   └── ToastContext.jsx        # In-app floating toast notifications
│
├── hooks/
│   ├── useAuth.js
│   ├── useNotifications.js
│   ├── useReports.js
│   ├── useLocation.js
│   ├── useContacts.js
│   ├── useTheme.js
│   └── useDebounce.js
│
├── theme/
│   ├── colors.js               # Light & Dark color palettes
│   ├── spacing.js              # Border radii & padding scales
│   └── typography.js           # Font scale
│
└── backend/
    ├── server.js               # Express entrypoint
    ├── config/db.js            # MongoDB connection
    ├── models/
    │   ├── User.js             # User model with role ('citizen' | 'government')
    │   ├── Report.js           # Report model with reportNumber, statusHistory, priority
    │   └── Notification.js     # Citizen notifications model
    ├── services/
    │   └── reportWorkflowService.js # Centralized state machine & reportNumber generator
    ├── middleware/
    │   ├── auth.js             # protect, requireAuth, requireRole
    │   └── upload.js           # Multer configuration
    ├── controllers/
    │   ├── authController.js
    │   ├── reportController.js
    │   ├── notificationController.js
    │   └── analyticsController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── reportRoutes.js
    │   ├── notificationRoutes.js
    │   └── analyticsRoutes.js
    └── scripts/
        └── seedGovernmentUser.js # Government account seeder
```

---

## 5. Setup & Running

### Prerequisites
- Node.js (v18 or v20+ recommended)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/spotfix`) or MongoDB Atlas URI
- Expo Go installed on physical Android / iOS device (or emulator)

### Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` (a template is provided in `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/spotfix
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```
3. **Seed the Government User Account**:
   ```bash
   npm run seed:government
   ```
   **Default Seed Credentials**:
   - **Email**: `gov@spotfix.gov`
   - **Password**: `GovSpotFix@2026`
   - **Role**: `government`
4. Start the backend server:
   ```bash
   npm start
   # Server runs on http://0.0.0.0:5000
   ```

### Frontend Setup
1. From the project root (`fixspot/`):
   ```bash
   npm install --legacy-peer-deps
   ```
2. Configure your local IP in `utils/constants.js`:
   ```javascript
   export const SERVER_HOST = 'http://YOUR_LAN_IP:5000';
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```
4. Scan the generated QR code using the **Expo Go** mobile app.

---

## 6. REST API Reference

### Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register citizen account (`role: 'citizen'`) |
| `POST` | `/api/auth/login` | Public | Login citizen or government official |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile & role |

### Citizen Operations
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reports` | Citizen | Submit new issue report (`status: 'pending'`, generates `#SP-XXXXX`) |
| `GET` | `/api/reports/mine` | Citizen | View authenticated citizen's submitted reports |
| `GET` | `/api/reports/:id` | Private | View report details (ownership enforced for citizens) |
| `GET` | `/api/notifications` | Citizen | Get notification feed |
| `GET` | `/api/notifications/unread-count`| Citizen | Get count of unread notifications |
| `PATCH` | `/api/notifications/:id/read` | Citizen | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Citizen | Mark all notifications as read |

### Government Operations (`requireRole('government')`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports` | Government | Filterable triage queue (status, priority, category, search, pagination) |
| `PATCH` | `/api/reports/:id/review` | Government | Mark report **Under Review** |
| `PATCH` | `/api/reports/:id/approve` | Government | Approve report with review note |
| `PATCH` | `/api/reports/:id/reject` | Government | Reject report (**mandatory** `reviewNote` required) |
| `PATCH` | `/api/reports/:id/priority`| Government | Set priority (`low`, `medium`, `high`) |
| `PATCH` | `/api/reports/:id/resolve` | Government | Mark **Resolved** (upload `resolvedImage` + `note`) |
| `GET` | `/api/analytics/summary` | Government | Municipal resolution metrics & breakdowns |

---

## 7. Role-Based Permission Matrix

| Action | Citizen | Government Official | Server Enforcement |
| :--- | :---: | :---: | :--- |
| Submit New Report | ✅ | ❌ | Server sets `user = req.user._id` |
| View Own Reports | ✅ | ❌ | Scoped to authenticated user |
| View Government Queue | ❌ | ✅ | `403 Forbidden` if citizen |
| Mark Under Review | ❌ | ✅ | `403 Forbidden` if citizen |
| Approve Report | ❌ | ✅ | `403 Forbidden` if citizen |
| Reject Report (with Reason) | ❌ | ✅ | `422` if reason missing; `403` if citizen |
| Change Issue Priority | ❌ | ✅ | `403 Forbidden` if citizen |
| Resolve (with Proof Photo) | ❌ | ✅ | `422` if image missing; `403` if citizen |
| View Alerts & Unread Badge | ✅ | ❌ | Citizen-facing notification center |
| View Municipal Analytics | ❌ | ✅ | `403 Forbidden` if citizen |
| Arbitrary Status Jumping | ❌ | ❌ | State machine returns `409 Conflict` |

---

## 8. Troubleshooting & Common Questions

1. **Mobile device cannot connect to backend**:
   - Ensure your phone and development computer are connected to the same Wi-Fi network.
   - Verify `SERVER_HOST` in `utils/constants.js` points to your computer's local IP (e.g. `http://192.168.1.X:5000`), not `localhost`.
   - Ensure your firewall allows inbound traffic on port 5000.

2. **Government login credentials**:
   - Run `npm run seed:government` in the `backend/` directory.
   - Login with `gov@spotfix.gov` and password `GovSpotFix@2026`.

3. **Dependency validation**:
   - Run `npx expo-doctor` in the root folder. All 18 checks should pass without errors.
