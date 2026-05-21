# Task Manager

A full-stack project management app built with Node.js, Express, MongoDB, and Vanilla JS. Users can register as admins or members — admins manage projects and tasks, members update the status of work assigned to them.

I built this as part of a web development assessment. It's not meant to be production-ready but it covers the main ideas: JWT authentication, role-based access, REST APIs, and a multi-page frontend without any framework.

## What it does

- Register and log in with JWT-based auth
- Two roles: admin and member
- Admins can create projects, add members, create tasks, and delete them
- Members can see their assigned tasks and update status
- Dashboard with task stats (total, done, pending, overdue) and recent activity

## Folder layout

```
project/
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── common.js
│   │   ├── config.js
│   │   ├── dashboard.js
│   │   ├── login.js
│   │   ├── project-details.js
│   │   ├── projects.js
│   │   └── signup.js
│   ├── pages/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── project-details.html
│   │   ├── projects.html
│   │   └── signup.html
│   └── index.html
└── backend/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── projectController.js
    │   ├── taskController.js
    │   └── userController.js
    ├── middleware/
    │   ├── asyncHandler.js
    │   ├── authMiddleware.js
    │   ├── errorMiddleware.js
    │   └── roleMiddleware.js
    ├── models/
    │   ├── Project.js
    │   ├── Task.js
    │   └── User.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── projectRoutes.js
    │   ├── taskRoutes.js
    │   └── userRoutes.js
    ├── .env.example
    ├── package.json
    ├── Procfile
    └── server.js
```

## Tech used

- **Frontend**: HTML, CSS, Vanilla JS, Axios
- **Backend**: Node.js + Express
- **Database**: MongoDB via Mongoose
- **Auth**: JWT + bcrypt

## Running it locally

### Backend

Copy the example env file and fill in your values:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:5000` by default.

### Frontend

Use Live Server in VS Code or any static file server:

```bash
npx serve frontend
```

Then open `http://localhost:3000/pages/login.html`.

## API overview

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Log in and get a token |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List accessible projects |
| POST | `/api/projects` | Create a project (admin only) |
| GET | `/api/projects/:id` | Get a specific project |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a task (admin only) |
| GET | `/api/tasks/project/:projectId` | Get tasks for a project |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task (admin only) |
| GET | `/api/tasks/dashboard/stats` | Get dashboard stats |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (admin only) |

All protected routes need `Authorization: Bearer <token>` in the request header.

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task-manager
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://127.0.0.1:5500,http://localhost:5500
NODE_ENV=development
```

For MongoDB Atlas just swap in your connection string.

## Deploying

I tested deployment on Railway (backend) + Vercel (frontend).

**Backend on Railway:**
1. Push to GitHub
2. Create a new Railway project from the repo, set root to `backend`
3. Add your env variables in Railway settings
4. Set `CLIENT_URL` to your Vercel frontend URL so CORS works

**Frontend on Vercel:**
1. Import repo, set root to `frontend`, framework preset = Other, no build command
2. Update `frontend/js/config.js` with your Railway backend URL

## A few notes

- Tokens are stored in `localStorage` — fine for a project like this, wouldn't do it in production
- Admins can do pretty much everything; members are limited to their own tasks
- The dashboard stats are scoped by role too — admins see totals, members see their own numbers
