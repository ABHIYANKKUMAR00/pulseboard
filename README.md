# PulseBoard — Smart Team Task Manager

A full-stack SaaS-style team task management app built with React, Node.js, Express, and MongoDB. Supports two user roles (Admin and Member) with strict permission enforcement at both the API and UI layers.

---

## Features

**Task Management**
- Kanban board with drag-and-drop (move tasks between To Do / In Progress / Done)
- Create, edit, delete tasks with title, description, priority, due date, assignee, and tags
- Auto overdue detection — tasks past their due date are flagged automatically
- Grouped task list view: Overdue → High Priority → Active → Completed

**Project Management**
- Create projects with name, description, color, due date, and status (Active / On Hold / Completed)
- Invite team members to projects
- Per-project progress bar, task stats, and overdue count
- Activity feed per project showing all team actions

**Role-Based Access Control (RBAC)**
- **Admin**: full create/edit/delete on tasks and projects
- **Member**: can only update task status (drag-and-drop or modal); all other fields are read-only
- Two-layer enforcement: route middleware + controller double-check

**Dashboard**
- Stats: total tasks, completed, in-progress, overdue, high priority
- Bar chart: tasks per team member
- Pie chart: tasks by priority
- Completion rate percentage
- Recent activity feed

**Other**
- JWT authentication (7-day tokens) with bcrypt password hashing
- Dark mode with Zustand persistence
- Productivity scores per user (completed / total, penalised for overdue)
- Responsive layout for all screen sizes
- Search and filter on every task view

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| State | Zustand (UI), React Context (auth) |
| Routing | React Router v6 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| HTTP | Axios |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas or local), Mongoose |
| Auth | JWT, bcryptjs (12 rounds) |
| Validation | express-validator |

---

## Project Structure

```
EtnraProject/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── activityController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   ├── roleCheck.js           # General role guards
│   │   └── taskPermission.js      # adminOnly / memberStatusOnly
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── ActivityLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── activities.js
│   ├── utils/
│   │   └── activityLogger.js
│   ├── .env
│   ├── .env.example
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   └── LoadingScreen.jsx
    │   │   ├── dashboard/
    │   │   │   └── ActivityFeed.jsx
    │   │   └── tasks/
    │   │       ├── KanbanBoard.jsx
    │   │       ├── TaskCard.jsx
    │   │       └── TaskModal.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   ├── TasksPage.jsx
    │   │   └── Profile.jsx
    │   ├── store/
    │   │   └── useStore.js
    │   ├── utils/
    │   │   └── helpers.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB — local install or a free [MongoDB Atlas](https://cloud.mongodb.com) cluster

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd EtnraProject
```

---

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/pulseboard?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_at_least_32_characters
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> If your MongoDB password contains special characters (e.g. `@`), URL-encode them (`@` → `%40`).

Start the server:

```bash
npm run dev
```

Server runs at `http://localhost:5000`.

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current authenticated user |

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/projects` | All | List projects the user belongs to |
| POST | `/api/projects` | Admin | Create a new project |
| GET | `/api/projects/:id` | All | Get project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add a member |
| DELETE | `/api/projects/:id/members/:uid` | Admin | Remove a member |

### Tasks

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/tasks` | All | All tasks visible to the user |
| GET | `/api/tasks/project/:id` | All | Tasks for a specific project |
| GET | `/api/tasks/stats/dashboard` | All | Dashboard statistics |
| POST | `/api/tasks` | Admin | Create a task |
| PUT | `/api/tasks/:id` | Admin / Member* | Update a task |
| DELETE | `/api/tasks/:id` | Admin | Delete a task |
| PUT | `/api/tasks/reorder` | All | Reorder tasks |

> *Members may only send `{ status }` — any other fields return `403 STATUS_ONLY`.

### Users & Activity

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users (admin) |
| GET | `/api/users/productivity` | Productivity scores |
| GET | `/api/activities` | Activity log (filterable by project) |

---

## Role Permissions

| Action | Admin | Member |
|---|---|---|
| Create task | Yes | No |
| Edit task (all fields) | Yes | No |
| Update task status | Yes | Yes |
| Delete task | Yes | No |
| Drag task to new column | Yes | Yes |
| Create project | Yes | No |
| Edit project | Yes | No |
| Add / remove members | Yes | No |
| View all tasks | Yes | No — only own projects + assigned |

Permission is enforced at two layers:
1. **Route middleware** (`taskPermission.js`) — strips/blocks before the controller runs
2. **Controller** — re-checks role and rejects even if middleware is bypassed

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_URL` | Yes | Frontend origin for CORS |

---

## Scripts

### Backend

```bash
npm run dev      # nodemon — auto-restart on changes
npm start        # node server.js
```

### Frontend

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build to dist/
npm run preview  # Preview the production build locally
```
