# TLFQ Platform - Teaching-Learning Feedback Questionnaire

A comprehensive, full-stack feedback management system designed for educational institutions to streamline the collection and analysis of student feedback on courses and faculty performance.

![TLFQ Banner](https://img.shields.io/badge/Status-Operational-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

## 🚀 Overview

The **TLFQ Platform** is a robust solution for managing the Teaching-Learning Feedback Questionnaire process. It provides a seamless interface for students to evaluate their courses and instructors, while offering administrators powerful analytical tools to visualize performance metrics and manage academic entities.

### Key Highlights
- **Dual Portal System**: Tailored experiences for both Administrators and Students.
- **Dynamic Analytics**: Real-time visualization of feedback data using interactive charts.
- **Hybrid Data Strategy**: Primary storage on MongoDB Atlas with an automatic in-memory fallback for offline/demo reliability.
- **Responsive Design**: Fully optimized for both desktop and mobile viewing.

---

## ✨ Features

### 👨‍💼 Administrator Dashboard
- **Entity Management**: Create and manage Courses, Faculty, and Student enrollments.
- **Questionnaire Control**: Design and deploy course-specific feedback forms.
- **Data Analytics**: View class averages, faculty rankings, and comment sentiment.
- **Reporting**: Detailed breakdown of responses per course and question.

### 🎓 Student Portal
- **Dashboard**: View a personalized list of courses requiring feedback.
- **Feedback Forms**: Intuitive rating systems (1-7 scale) and qualitative comment sections.
- **Submission History**: Track completed evaluations.

> [!WARNING]
> **Database Reset Behavior**: In the current development configuration, the `server/db.js` file is set to clear and re-seed the database every time the server starts. This is intended for demonstration purposes. To persist data, modify the `initDb` function in `server/db.js`.

### 🛡️ Core Capabilities
- **Secure Authentication**: Role-based access control (RBAC) powered by JWT.
- **Sync System**: Backend routes for cross-platform data synchronization.
- **Environment Aware**: Seamlessly switches between development and production configurations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Environment**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
- **Security**: [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) & [JWT](https://jwt.io/)

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd tlfq-platform
   ```

2. **Install Dependencies**:
   The project uses a root-level script to install everything at once:
   ```bash
   npm run build
   ```
   *Note: This will install frontend/backend dependencies and build the frontend.*

### Configuration

Create a `.env` file in the `server` directory based on the example:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
MONGO_URI=your_mongodb_connection_string_here
```

### Running Locally

To start the full system:

1. **Start the Backend**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

The app will be available at `http://localhost:5173` (Vite) and the API at `http://localhost:5000`.

---

## 📂 Project Structure

```text
tlfq-platform/
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Dashboard, Login, Feedback forms
│   │   ├── services/     # API integration (Axios)
│   │   └── context/      # Global state (Auth)
├── server/               # Node.js backend
│   ├── controllers/      # Route logic
│   ├── routes/           # API endpoints
│   ├── db.js             # Mongoose configuration & Fallback store
│   └── server.js         # Entry point
└── package.json          # Root orchestration scripts
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ for Academic Excellence.**
