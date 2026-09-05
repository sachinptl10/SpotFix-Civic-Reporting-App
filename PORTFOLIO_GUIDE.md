# SPOTFIX V2 — PORTFOLIO & RESUME ADDENDUM

> **Frontend constraint:** SpotFix V2 is built with **React Native + Expo + Expo Router + JSX**. The same React Native codebase targets **Android, iOS, and Web** where supported. No TypeScript is required.

This document explains how to present SpotFix V2 as a serious portfolio project, how to describe its engineering decisions, and how to prepare for technical interviews.

---

# 1. Elevator Pitch

## Full Version

> "SpotFix is a full-stack civic-issue reporting platform built with React Native, Expo, Node.js, Express.js, and MongoDB. Citizens can photograph and geotag problems such as potholes, garbage, and broken streetlights, while municipal officials get a dedicated dashboard to review, approve, reject, prioritize, and resolve reports. The system uses role-based authorization, server-enforced status transitions, an audit trail, geospatial queries, secure media uploads, and analytics."

## Short Version

> "SpotFix is a cross-platform civic-tech application built with React Native and Expo, backed by a Node/Express/MongoDB API, with role-based workflows, geospatial issue discovery, secure uploads, and an auditable report lifecycle."

## One-Line GitHub / LinkedIn Version

> **"Cross-platform civic-tech platform built with React Native + Expo, Node.js, Express.js, and MongoDB with role-based workflows, geospatial search, secure uploads, and an auditable state-driven review system."**

---

# 2. Technology Stack

## Frontend

* React Native
* Expo (SDK 57)
* Expo Router
* JSX
* React Hooks
* Context API / state management
* React Native Web
* Expo Camera
* Expo Location
* Expo Image Picker
* Fetch / Axios for API communication
* Responsive layouts for mobile and web

### Important

The frontend remains **`.jsx` files only** (Strictly NO `.ts` or `.tsx`).

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* Express middleware
* Multer
* Helmet
* CORS
* Rate limiting
* MongoDB geospatial indexing

---

# 3. Resume Bullet Points

Pick **3–4 bullets** depending on the target role.

## Full-Stack / Mobile Developer

* Built a cross-platform civic issue reporting application using **React Native, Expo, Expo Router, and JSX**, enabling citizens and municipal officials to use a shared mobile/web codebase.
* Designed a role-based report workflow where citizens submit geotagged issues while officials review, approve, reject, prioritize, and resolve reports through a dedicated dashboard.
* Implemented server-enforced report state transitions and audit logging to prevent unauthorized workflow changes and maintain a traceable history of report actions.
* Implemented MongoDB geospatial indexing and nearby-issue queries to efficiently discover civic problems based on geographic location.

## Backend-Focused Resume

* Developed a REST API using **Node.js and Express.js** with JWT authentication, role-based authorization, security middleware, rate limiting, CORS validation, and request sanitization.
* Implemented secure image upload and deletion handling using Multer, randomized filenames, MIME validation, and controlled file paths.
* Designed a centralized report workflow service that validates allowed status transitions and prevents clients from directly manipulating report states.
* Added MongoDB geospatial queries using GeoJSON and `2dsphere` indexes for location-based issue discovery.

## Security-Focused Resume

* Hardened REST endpoints against common API risks using authentication middleware, rate limiting, Helmet, CORS restrictions, NoSQL-injection sanitization, and server-side authorization.
* Prevented unauthorized report-state manipulation by enforcing workflow transitions on the backend rather than trusting client-provided status values.
* Implemented controlled media upload and deletion workflows to reduce unrestricted-upload and path-traversal risks.
* Separated citizen and government-official permissions using JWT-based role authorization.

---

# 4. What Makes SpotFix Different

Do **not** present SpotFix as:

> "A CRUD app where users can create reports."

Present it as:

> **A role-based civic workflow system with geospatial functionality and security-focused backend architecture.**

The important engineering features are:

### 1. State-Driven Workflow

A report follows a controlled lifecycle:

```text
PENDING ──► UNDER_REVIEW ──► APPROVED ──► RESOLVED
                 │
                 └──► REJECTED
```

The client cannot simply send `{"status": "resolved"}` directly. The backend enforces transitions and returns `409 Conflict` on unauthorized jumps.

---

# 5. Why Server-Side State Enforcement?

If the frontend contains:

```javascript
if (user.role === "official") {
  // show approve button
}
```

That only controls the UI. It does **not** provide security.

A malicious client could still send a request directly to the API.

```text
React Native UI ──► API Request ──► Authentication ──► Authorization ──► State Machine ──► Database
```

The backend remains the final authority.

---

# 6. Hard Technical Problems & Interview Stories

### Problem 1 — Unauthorized Status Changes
* **Problem**: Clients could potentially bypass UI controls and send arbitrary status mutations.
* **Solution**: Centralized workflow validation in `reportWorkflowService.js`.
* **Result**: Unauthorized jumps return `409 Conflict`, with mandatory notes enforced for rejections and photo proofs for resolutions.

### Problem 2 — Nearby Reports at Scale
* **Problem**: Checking distance against every report in memory creates an O(N) bottleneck.
* **Solution**: GeoJSON Point coordinates with MongoDB `2dsphere` spatial indexing and `$near` operator.
* **Result**: High-speed proximity searches within a bounded meter radius using database indexes.

### Problem 3 — Universal Mobile + Web
* **Problem**: Native modules like `react-native-maps` and `expo-media-library` fail on web due to missing native code (`codegenNativeComponent`).
* **Solution**: Custom Metro resolvers in `metro.config.js` aliasing native modules to web implementations (`WebMap.jsx` and `WebMediaLibrary.js`).
* **Result**: A single JSX codebase runs simultaneously on Android, iOS, and Web browsers.

---

# 7. Real Measured Benchmarks & Automated Testing

### Automated Test Suite (`npm test`)
* Built with Node's native test runner (`node --test test/**/*.test.js`).
* **16 out of 16 tests passing (100%) in 288ms**, validating:
  * System health & diagnostics ping latency
  * Citizen registration & duplicate email conflict (409)
  * Role authorization (citizens blocked from official review with 403)
  * Server-side state machine (`pending` ➔ `under_review` ➔ `approved` ➔ `resolved`)
  * Illegal status jumps (`pending` ➔ `approved`) rejected with 409
  * Terminal state protection (`resolved` ➔ `under_review`) rejected with 409
  * Mandatory rejection reason validation (422)
  * Geospatial 2dsphere nearby queries ($near within radius)
  * Citizen notification dispatch and unread count tracking

### Geospatial 2dsphere Benchmark (`npm run benchmark`)
Load-tested over **500 seeded records** across a metropolitan radius with **200 concurrent geospatial queries**:
* **Throughput**: `97.0 req/sec`
* **Average Latency**: `84.99 ms`
* **Median (p50) Latency**: `82.34 ms`
* **p90 Latency**: `111.72 ms`
* **p95 Latency**: `126.99 ms`
* **p99 Latency**: `171.14 ms`

> **Resume Bullet Statement (Direct Copy-Paste)**:
> *"Benchmarked MongoDB 2dsphere geospatial queries over 500 seeded records, achieving a p95 response latency of 126.99ms and average latency of 84.99ms at 97.0 req/sec under concurrent load."*

