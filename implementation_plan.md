
# Command Center AI System - Implementation Plan

## Context

The user wants to evolve the existing `commandCenter` React prototype into a personal AI-powered knowledge base and task management system. The existing app is a single-file React SPA (`src/App.jsx`, ~550 lines) with 5 views, all mock data hardcoded, no backend, no persistence, no routing library. The vision (from `/Users/jdjohns4/CommandCenter/05-05-2026_command_center_ai_system_implementation_plan.md`) is a 12-phase plan culminating in a hybrid architecture: Obsidian for knowledge, Google Drive for files, Google Tasks/Calendar for commitments, Apple Notes for quick capture, and Command Center as the unified dashboard.

## Scope of This Plan

We will implement **Phase 1 (Stabilize the Prototype)** and **Phase 2 (Add Persistence)**. This gives us a clean frontend foundation plus a working backend with real database storage. The MVP target from the plan is: React dashboard, real quick capture storage, inbox view, manual classification, project list, Obsidian note index, keyword search, basic AI classification. Phase 1+2 gets us to "real quick capture storage + project list + clean architecture."

## Phase 1: Stabilize the Existing Prototype

### Goal
Turn the monolithic `App.jsx` into a maintainable, multi-file React app with routing and separated concerns.

### Approach
- Add `react-router-dom` for client-side routing (replace `useState("dashboard")` view switching).
- Extract each view into its own component file under `src/views/`.
- Extract reusable UI components (`MetricCard`, `DetailStat`) into `src/components/`.
- Extract all mock data into `src/data/mockData.js`.
- Extract the sidebar and topbar into `src/components/Sidebar.jsx` and `src/components/Topbar.jsx`.
- Keep `App.jsx` as the route shell and global state coordinator.
- Add `.env` support via `vite` (create `.env.example`).
- Update `CLAUDE.md` with the new structure.

### Files to Create/Modify
- `package.json` — add `react-router-dom` dependency
- `src/App.jsx` — strip out views/data, keep routing shell
- `src/main.jsx` — wrap with `BrowserRouter`
- `src/data/mockData.js` — all mock data constants
- `src/components/Sidebar.jsx` — sidebar navigation
- `src/components/Topbar.jsx` — top bar
- `src/components/MetricCard.jsx` — reusable metric card
- `src/components/DetailStat.jsx` — reusable detail stat
- `src/views/DashboardView.jsx` — dashboard view
- `src/views/ProjectsView.jsx` — projects view
- `src/views/KnowledgeView.jsx` — knowledge view
- `src/views/SearchView.jsx` — search view
- `src/views/SettingsView.jsx` — settings view
- `.env.example` — environment variable template
- `CLAUDE.md` — update to reflect new structure

## Phase 2: Add Persistence (Backend + SQLite)

### Goal
Add a Node.js/Express backend with SQLite so that Quick Capture and Projects can store and retrieve real data.

### Approach
- Create a `backend/` directory at the project root.
- Initialize a separate `package.json` for the backend with `express`, `better-sqlite3`, and `cors`.
- Create the SQLite database schema matching the plan's `captures`, `projects`, `tasks`, and `knowledge_items` tables.
- Create REST API endpoints:
  - `POST /captures` — create a capture
  - `GET /captures` — list captures
  - `PATCH /captures/:id` — update capture status/classification
  - `GET /projects` — list projects
  - `POST /projects` — create a project
  - `PATCH /projects/:id` — update a project
- Update the frontend to fetch real data from the backend instead of using mock data.
- Add a proxy config in `vite.config.js` so `npm run dev` forwards `/api` to the backend.
- Provide a single `npm run dev` command that starts both frontend and backend concurrently (using `concurrently`).

### Files to Create/Modify
- `backend/package.json` — backend dependencies and scripts
- `backend/server.js` — Express server setup
- `backend/db.js` — SQLite database connection and schema initialization
- `backend/routes/captures.js` — capture CRUD routes
- `backend/routes/projects.js` — project CRUD routes
- `backend/.env.example` — backend env template (PORT, DB_PATH)
- `vite.config.js` — add proxy for `/api`
- `package.json` (root) — add `concurrently` and a combined `dev` script
- `src/App.jsx` — integrate real data fetching
- `src/views/DashboardView.jsx` — connect quick capture to backend
- `src/views/ProjectsView.jsx` — connect projects to backend
- `src/views/InboxView.jsx` — **new view** for processing captures (Phase 3 preview)

### Database Schema

```sql
-- captures
CREATE TABLE captures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  status TEXT DEFAULT 'unprocessed',
  suggested_type TEXT,
  suggested_area TEXT,
  suggested_project_id INTEGER,
  suggested_tags TEXT,
  destination TEXT,
  confidence REAL
);

-- projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  area TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  source_url TEXT,
  summary TEXT,
  last_reviewed DATETIME,
  next_action TEXT
);

-- tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source TEXT DEFAULT 'local',
  external_id TEXT,
  project_id INTEGER,
  due_date DATE,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- knowledge_items
CREATE TABLE knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  source TEXT,
  source_path TEXT,
  content_hash TEXT,
  summary TEXT,
  tags TEXT,
  related_project_id INTEGER,
  last_indexed DATETIME
);
```

## Verification

1. Run `npm install` in both root and `backend/`.
2. Run `npm run dev` from root — both frontend (localhost:5173) and backend (localhost:3001) should start.
3. Open the frontend. The sidebar should show all views and routing should work.
4. Quick capture should save to the SQLite database (verify with `sqlite3 backend/db.sqlite "SELECT * FROM captures;"`).
5. Projects should load from the database.
6. The new Inbox view should show captures with their status.
