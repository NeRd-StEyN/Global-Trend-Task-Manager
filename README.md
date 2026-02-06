# Task Management Web Application

A full-stack task management system built for the **Global Trend Internship Skill Assessment**.

## 🚀 Features
- **Responsive UI**: Modern, dark-themed dashboard.
- **Full CRUD**: Create, Read, Update, and Delete tasks.
- **Real-time Status Filters**: Filter tasks by Pending, In Progress, or Completed.
- **Persistent Storage**: Uses a local JSON-based database (`db.json`) for zero-configuration setup.
- **RESTful API**: Clean Express.js backend.

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+).
- **Backend**: Node.js, Express.js.
- **Database**: LowDB (Local JSON persistence) - No external database installation required!

## 💻 Setup Instructions

### 1. Prerequisites
- Node.js installed on your machine.

### 2. Backend Setup
1. Open a terminal in the `server` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:5000` and creates a `db.json` automatically.*

### 3. Frontend Setup
1. Simply open `client/index.html` in your browser.
2. *Note: Ensure the backend is running first so the API can fetch data.*

## 📋 API Endpoints
- `GET /api/tasks`: Fetch all tasks.
- `POST /api/tasks`: Create a new task.
- `PUT /api/tasks/:id`: Update an existing task.
- `DELETE /api/tasks/:id`: Remove a task.

## 👤 Evaluation Criteria Addressed
- **Code Quality**: Modular structure, descriptive naming, and clean logic.
- **Fundamentals**: Proper use of REST principles and Semantic HTML.
- **Problem Solving**: Implementation of status filtering and dynamic UI updates.
- **Portability**: Uses an embedded database so recruiters can run the app instantly without any setup.
