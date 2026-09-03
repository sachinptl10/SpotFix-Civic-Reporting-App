# SpotFix — Civic Issue Reporting Mobile Application

SpotFix is a mobile application built with **React Native**, **Expo (SDK 54)**, and **Expo Router**, backed by a **Node.js, Express, and MongoDB** REST API. It empowers citizens to report local infrastructure and civic issues—such as potholes, overflowing garbage, broken streetlights, water leaks, and damaged roads—directly to authorities and neighbors with photographs, real-time GPS coordinates, and contact alerts.

---

## 1. Project Overview

Civic issues often go unaddressed due to friction in reporting. SpotFix bridges the gap between citizens and local governance:
* **Capture on the Spot**: Snap photos using the camera or gallery.
* **Pinpoint Accuracy**: Auto-detects GPS coordinates and reverse geocodes them to human-readable street addresses.
* **Interactive Civic Map**: View all submitted issues geographically with category-specific pins and callout details.
* **Direct Notifications**: Select device contacts (councilors, neighbors, municipality) and trigger native phone calls, SMS alerts, or emails.
* **Full CRUD Management**: View, update status/details, and delete submitted reports.

---

## 2. Key Features

- **Authentication & Security**:
  - Full registration & login flow with client and server validations.
  - Passwords hashed using `bcryptjs`.
  - Secure JWT authentication stored using `expo-secure-store`.
  - Global 401 Unauthorized interceptor automatically clearing credentials and navigating to login.

- **Theme System**:
  - Full Light, Dark, and System appearance modes persisted via AsyncStorage.
  - Profile screen appearance switcher with immediate global reactivity.

- **Camera & Media Enhancements**:
  - `expo-camera` (CameraView) with live preview, front/back flip, and photo capture.
  - Flash / Torch control (Off, On, Auto).
  - Quick-zoom control (`1x`, `2x`, `3x`).
  - Tap-to-focus with animated reticle square.
  - Optional short video recording support (up to 30s).
  - Save photo/video directly to device gallery via `expo-media-library`.

- **Location & Map Enhancements**:
  - Live GPS tracking via `Location.watchPositionAsync` with automatic unmount cleanup.
  - Manual location selection & address search.
  - Draggable pin on map to fine-tune incident positions.
  - Recenter map button (`◎`) with smooth animation.
  - Category-based color pins with callout previews and bottom sheet peek.

- **Civic Issue Management**:
  - 8 categories with status tracking: *Pending, In Progress, Resolved, Rejected*.
  - Full CRUD with ownership validation on update and delete.
  - Infinite scroll pagination (`onEndReached`) and pull-to-refresh.
  - Offline report caching with offline status banner.

- **Device Contacts & Native Linking**:
  - `expo-contacts` with real-time search filtering.
  - Obvious selected contact state (`✓ Name`).
  - Native Phone (`tel:`), SMS (`sms:`), and Email (`mailto:`) deep links with formatted issue report text.

- **Profile & Analytics**:
  - Summary stats: Total reports, Resolved count, In Progress count.
  - Secure logout with stored credential purge.

---

## 3. Tech Stack

### Mobile Frontend
- **Framework**: React Native (v0.81.5), Expo (SDK 54)
- **Routing**: Expo Router (v6.0.24, file-based routing)
- **Language**: JavaScript & JSX only (Strictly No TypeScript)
- **State Management**: React Context API (`AuthContext`, `ReportContext`)
- **Native Modules**:
  - `expo-camera`
  - `expo-location`
  - `expo-contacts`
  - `expo-image-picker`
  - `expo-secure-store`
  - `expo-linking`
  - `expo-status-bar`
  - `react-native-maps`
  - `@expo/vector-icons`

### Backend Server
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Uploads**: Multer (Multipart/form-data)
- **Middleware**: CORS, Dotenv, Centralized Error Handling

---

## 4. Folder Structure

```text
fixspot/
├── app/                            # Expo Router screens (file-based)
│   ├── _layout.jsx                 # Root layout & providers
│   ├── index.jsx                   # Auth guard & entry redirect
│   ├── login.jsx                   # Login screen
│   ├── register.jsx                # Registration screen
│   ├── (tabs)/                     # Bottom Tab Navigator
│   │   ├── _layout.jsx             # Tabs configuration & icons
│   │   ├── home.jsx                # Dashboard & report list
│   │   ├── map.jsx                 # Geographic map with pins
│   │   ├── contacts.jsx            # Device contacts & alert actions
│   │   └── profile.jsx             # Stats & profile management
│   ├── report/
│   │   ├── camera.jsx              # Camera viewfinder & capture
│   │   ├── preview.jsx             # Full-screen photo review
│   │   ├── create.jsx              # Location + issue details form
│   │   └── [id].jsx                # Comprehensive report details
│   └── edit/
│       └── [id].jsx                # Edit title, description, category, photo
│
├── components/                     # Reusable UI components
│   ├── CustomButton.jsx            # Button with variants (primary/secondary/danger)
│   ├── CustomInput.jsx             # Input with validation, eye toggle, icons
│   ├── ReportCard.jsx              # Dashboard issue summary card
│   ├── StatusBadge.jsx             # Color-coded status chip
│   ├── CategoryPicker.jsx          # Scrollable category selector
│   ├── LoadingState.jsx            # ActivityIndicator container
│   ├── EmptyState.jsx              # Friendly empty illustration
│   ├── ErrorState.jsx              # Error banner with retry
│   ├── PermissionCard.jsx          # Permission explanation & grant button
│   └── MapMarker.jsx               # Custom colored map pin
│
├── context/
│   ├── AuthContext.jsx             # Auth state, login, register, logout
│   └── ReportContext.jsx           # Global reports cache & statistics
│
├── services/
│   ├── api.js                      # Fetch client with auto JWT attachment
│   ├── authService.js              # Auth API calls & SecureStore tokens
│   ├── reportService.js            # Report CRUD & FormData uploads
│   ├── locationService.js          # GPS coordinates & reverse geocoding
│   └── contactService.js           # Expo Contacts & Linking (Call/SMS/Email)
│
├── utils/
│   ├── constants.js                # Server host, categories, statuses, theme
│   ├── validation.js               # Form validation rules
│   └── helpers.js                  # Date formatting, image URLs, initials
│
├── backend/                        # Node.js & Express REST API
│   ├── server.js                   # Server entry point
│   ├── .env                        # Server environment variables
│   ├── package.json
│   ├── config/
│   │   └── db.js                   # Mongoose connection logic
│   ├── controllers/
│   │   ├── authController.js       # Register, login, profile
│   │   └── reportController.js     # CRUD & analytics for reports
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   └── upload.js               # Multer disk storage configuration
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt hooks
│   │   └── Report.js               # Report schema with coordinates & status
│   ├── routes/
│   │   ├── authRoutes.js           # Auth route definitions
│   │   └── reportRoutes.js         # Report route definitions
│   ├── uploads/                    # Local image storage folder
│   └── utils/
│       └── errorHandler.js         # Centralized error handler
│
├── app.json                        # Expo permissions & bundle configuration
├── babel.config.js                 # Babel preset configuration
├── metro.config.js                 # Metro bundler configuration
└── package.json                    # Root dependencies
```

---

## 5. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create or verify `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/spotfix
   JWT_SECRET=spotfix_super_secret_jwt_key_2024_secure_change_in_production
   NODE_ENV=development
   ```

4. **Start MongoDB**:
   Ensure your local MongoDB daemon is running:
   ```bash
   mongod
   ```
   *(Or provide your MongoDB Atlas URI in `MONGO_URI`)*.

5. **Start the API server**:
   ```bash
   npm run dev    # For nodemon auto-reloading
   # or
   npm start      # For production start
   ```

   You can verify it by opening `http://localhost:5000/api/health` in your browser.

---

## 6. Frontend Setup

1. **Navigate to the root directory**:
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Server Host**:
   Open `utils/constants.js`. The default configuration automatically routes based on platform:
   ```javascript
   export const SERVER_HOST = Platform.select({
     android: 'http://10.0.2.2:5000', // Android Emulator host alias
     ios: 'http://localhost:5000',     // iOS Simulator localhost
     default: 'http://localhost:5000',
   });
   ```

   > **Note for Physical Devices**: If you are running the app on a physical Android or iPhone via Expo Go, replace the host with your computer's local Wi-Fi IP address (e.g. `http://192.168.1.105:5000`).

4. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```

---

## 7. MongoDB Setup

- **Local MongoDB**:
  - Download and install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community).
  - Start the service:
    - Windows: `net start MongoDB` or run `mongod`
    - macOS: `brew services start mongodb-community`
    - Linux: `sudo systemctl start mongod`
- **MongoDB Atlas (Cloud)**:
  - Create a free M0 cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
  - Whitelist your current IP address (or `0.0.0.0/0` for development).
  - Obtain your connection string and paste it into `backend/.env`:
    ```env
    MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/spotfix?retryWrites=true&w=majority
    ```

---

## 8. Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port the Express API server listens on | `5000` |
| `MONGO_URI` | MongoDB database connection URI | `mongodb://127.0.0.1:27017/spotfix` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | *(Secret string)* |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |

---

## 9. Expo Permissions Configuration

The app defines native permission strings in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "SpotFix requires access to your camera so you can photograph civic issues like potholes and damaged infrastructure.",
        "NSLocationWhenInUseUsageDescription": "SpotFix uses your location to tag the exact physical position of reported civic problems.",
        "NSContactsUsageDescription": "SpotFix allows you to access device contacts to alert municipal officers, local representatives, or neighbors about an issue."
      }
    },
    "android": {
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.READ_CONTACTS"
      ]
    }
  }
}
```

If permission is denied at runtime, the app displays a clear `PermissionCard` with a button to retry or jump directly to the device's system settings via `Linking.openSettings()`.

---

## 10. Platform Setup

### Android Emulator
1. Launch your Android Virtual Device (AVD) from Android Studio.
2. In `utils/constants.js`, the app uses `http://10.0.2.2:5000` which maps to your host machine.
3. Start the app:
   ```bash
   npx expo start --android
   ```

### iOS Simulator (macOS)
1. Launch the iOS Simulator from Xcode.
2. The app communicates with `http://localhost:5000`.
3. Start the app:
   ```bash
   npx expo start --ios
   ```

### Physical Devices (Expo Go)
1. Connect your phone and computer to the **same Wi-Fi network**.
2. Find your computer's local IP address:
   - Windows: `ipconfig` (Look for IPv4 address, e.g. `192.168.1.50`)
   - macOS / Linux: `ifconfig` or `ip a`
3. Update `SERVER_HOST` in `utils/constants.js`:
   ```javascript
   export const SERVER_HOST = 'http://192.168.1.50:5000';
   ```
4. Start Expo:
   ```bash
   npx expo start
   ```
5. Scan the QR code using the **Expo Go** app (Android) or the default **Camera** app (iOS).

---

## 11. API Endpoint Documentation

All endpoints (except health and public auth) require the `Authorization: Bearer <JWT>` header.

### Health Check
- `GET /api/health` — Verifies API server status and timestamp.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Creates a new citizen account.
  - Body: `{ name, email, password, confirmPassword }`
- `POST /api/auth/login` — Authenticates user and returns JWT token.
  - Body: `{ email, password }`
- `GET /api/auth/profile` — Retrieves the authenticated citizen's profile.

### Reports (`/api/reports`)
- `POST /api/reports` — Creates a new report with photo attachment.
  - Request type: `multipart/form-data`
  - Fields: `title`, `description`, `category`, `latitude`, `longitude`, `address`, `image` (file)
- `GET /api/reports` — Retrieves list of reports.
  - Query params: `scope=all` (all public reports) or default (current user's reports), `category`, `status`
- `GET /api/reports/stats` — Returns count of total, resolved, and pending reports.
- `GET /api/reports/:id` — Retrieves full details of a specific report.
- `PUT /api/reports/:id` — Updates report title, description, category, or replacement image (ownership checked).
- `DELETE /api/reports/:id` — Deletes a report and removes its image from the disk (ownership checked).

---

## 12. Complete User Journey

```text
[Register / Sign In]
        │
        ▼
   [Home Screen] ────────► [Interactive Civic Map]
        │
        ▼ (+ Report an Issue)
  [Step 1: Camera View] ──► [Take Photo]
        │
        ▼
 [Step 2: Photo Preview] ──► [Retake] OR [Use This Photo]
        │
        ▼
 [Step 3: Location & Details Form]
   - Auto-fetches GPS coordinates
   - Auto reverse-geocodes street address
   - Interactive mini map pin
   - Category picker & description
        │
        ▼ [Submit Report (Multipart/Form-Data)]
  [Backend API] ──► [Multer File Storage] ──► [MongoDB Record]
        │
        ▼
   [Success Alert] ──► Returns to Home Screen with updated feed
        │
        ├────────► [Report Details Screen] ──► [Edit / Delete Report]
        │
        ├────────► [Device Contacts Tab] ──► [Search Contacts] ──► [Call / SMS / Email]
        │
        └────────► [Profile Tab] ──► [View Stats: Total/Resolved/Pending] ──► [Logout]
```

---

## 13. Troubleshooting

- **"Cannot connect to server at http://..."**:
  - Verify that your Express server is running on port 5000 (`npm run dev`).
  - If using an Android Emulator, ensure `10.0.2.2:5000` is used.
  - If using a physical phone, check that both devices are on the same Wi-Fi and use your local LAN IP (not `localhost`).
  - Ensure your machine's firewall allows incoming connections on port 5000.

- **MongoDB connection refused**:
  - Verify your MongoDB daemon is active (`mongod` or check Windows Services).
  - Verify the URI in `backend/.env` is `mongodb://127.0.0.1:27017/spotfix`.

- **Camera or Location permissions not asking**:
  - In Android/iOS settings, check that permissions haven't been permanently set to "Never Ask Again". Tap the "Open Device Settings" button provided by SpotFix to toggle permissions manually.
