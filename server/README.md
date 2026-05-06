# TLFQ Server

This directory contains the Node.js/Express backend for the TLFQ Platform.

## 🚀 Quick Start

1. Install dependencies: `npm install`
2. Configure `.env` (see `.env.example`)
3. Start server: `npm run dev`

## ⚙️ Key Modules
- **db.js**: Handles MongoDB connection via Mongoose and provides an in-memory fallback store if the database is unreachable.
- **routes/**: API endpoint definitions for Auth, TLFQ management, and Response handling.
- **controllers/**: Business logic for handling requests.

## 📡 API Endpoints
- `/api/auth`: Login and authentication.
- `/api/tlfq`: Management of courses, faculty, and questionnaires.
- `/api/responses`: Handling student feedback submissions.
- `/api/sync`: Data synchronization utilities.

---

> [!NOTE]
> For full project documentation and setup instructions, please refer to the [Root README](../README.md).
