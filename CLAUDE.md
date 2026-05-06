# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal AI-powered knowledge base and task management system called "Command Center." It is a full-stack application with a React SPA frontend, Node.js/Express backend, SQLite database, Obsidian vault indexing, Ollama AI integration, and Google Workspace (Tasks, Calendar, Drive) sync.

## Common Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start both frontend and backend concurrently |
| `npm run dev:frontend` | Start only the Vite dev server |
| `npm run dev:backend` | Start only the Express backend |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build on `0.0.0.0:4173` |

There is no test runner, linter, or formatter configured yet.

## System Architecture

### Frontend
- **React 18 + Vite** SPA with client-side routing via `react-router-dom`
- **Routes** (`src/App.jsx`):
  - `/` → Dashboard (quick capture + metrics)
  - `/inbox` → Capture processing with status filters and AI classification
  - `/tasks` → Task manager with filtering, inline editing, and completion
  - `/projects` → Split-pane project board with inline creation
  - `/knowledge` → Obsidian note browser + search + re-index
  - `/search` → Semantic search via Ollama embeddings
  - `/briefing` → Daily Briefing with stats, lists, and AI summary generation
  - `/review` → Weekly Review assistant (captures, stale tasks, flagged projects)
  - `/google` → Google Integration page (Tasks, Calendar, Drive sync)
  - `/settings` → Configuration cards
- **State**: React `useState`/`useMemo` only. No external state library.
- **Styling**: Plain vanilla CSS (`src/styles.css`) with dark-theme design tokens and glassmorphism aesthetic.
- **API base**: All views fetch from `/api/*` via the Vite proxy to the backend.

### Backend (`backend/`)
- **Express + better-sqlite3** for synchronous DB operations
- **CORS** enabled for frontend communication
- **Auto-seeding**: Projects table gets 3 seed entries on first run
- **Environment variables** (see `.env.example`):
  - `PORT=3001`
  - `DB_PATH=./db.sqlite`
  - `OBSIDIAN_VAULT_PATH=../obsidian/Life Organizer`
  - `OLLAMA_HOST=http://localhost:11434`
  - `OLLAMA_MODEL=kimi-k2.6:cloud`
  - `OLLAMA_EMBED_MODEL=nomic-embed-text`
  - `GOOGLE_CLIENT_ID=...` (for Google OAuth)
  - `GOOGLE_CLIENT_SECRET=...` (for Google OAuth)
  - `GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/callback`

### Database Schema

| Table | Purpose |
|---|---|
| `captures` | Quick capture items with AI classification fields |
| `projects` | Lightweight project metadata with milestones (JSON) |
| `tasks` | Task records (local + Google Tasks sync via `external_id`) |
| `knowledge_items` | Indexed Obsidian notes with content hashes |
| `google_credentials` | Stored OAuth tokens for Google integration |
| `embeddings` | Vector embeddings for semantic search |

### REST API Endpoints

| Endpoint | Methods | Description |
|---|---|---|
| `/api/captures` | GET, POST | List/create captures |
| `/api/captures/:id` | PATCH | Update capture status/classification |
| `/api/captures/:id/classify` | POST | Run Ollama AI classification |
| `/api/captures/:id/obsidian-note` | POST | Create Obsidian note from capture |
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/:id` | PATCH | Update project fields |
| `/api/tasks` | GET, POST | List/create tasks |
| `/api/tasks/:id` | PATCH, DELETE | Update/delete task |
| `/api/knowledge` | GET | List indexed Obsidian notes |
| `/api/knowledge/index` | POST | Trigger vault re-indexing |
| `/api/knowledge/search` | GET | Keyword search (`?q=...`) |
| `/api/search/semantic` | POST | Semantic similarity search via embeddings |
| `/api/search/embeddings/generate` | POST | (Re)generate embeddings for all items |
| `/api/briefing/daily` | GET | Daily briefing aggregation |
| `/api/briefing/daily/ai-summary` | POST | AI-generated daily briefing text |
| `/api/review/weekly` | GET | Weekly review aggregation |
| `/api/google/status` | GET | Google OAuth status |
| `/api/google/auth` | GET | Start OAuth flow |
| `/api/google/callback` | GET | OAuth callback handler |
| `/api/google/disconnect` | POST | Revoke and clear tokens |
| `/api/google/tasks/lists` | GET | List Google Task lists |
| `/api/google/tasks/:tasklistId` | GET, POST | List/create tasks in a list |
| `/api/google/sync` | POST | Import Google Tasks into local DB |
| `/api/google/calendar/events` | GET | List upcoming calendar events |
| `/api/google/drive/files` | GET | List/search Drive files |
| `/api/google/drive/folders` | GET | List Drive folders |
| `/api/health` | GET | Backend health check |

## Source Layout

```
src/
  main.jsx              # Entry point (ReactDOM + BrowserRouter)
  App.jsx               # Route shell + global state
  styles.css            # Global styles and design tokens
  data/
    mockData.js         # Navigation, templates, and legacy mock data
  components/
    Sidebar.jsx           # Navigation sidebar with NavLink
    Topbar.jsx            # Page header with current route label
    MetricCard.jsx        # Reusable stat tile
    DetailStat.jsx        # Reusable key/value pair
  views/
    DashboardView.jsx     # Dashboard + quick capture (API-backed)
    InboxView.jsx         # Capture processing + AI classify button + create task
    TasksView.jsx         # Task manager with filtering, inline editing, creation
    ProjectsView.jsx      # Split-pane project board (API-backed) + creation
    KnowledgeView.jsx     # Obsidian note browser + search + re-index
    SearchView.jsx        # Semantic search (mock data)
    SettingsView.jsx      # Configuration cards
    DailyBriefingView.jsx # Daily briefing with stats and AI summary
    WeeklyReviewView.jsx  # Weekly review (captures, stale tasks, flagged projects)
    GoogleView.jsx        # Google integration (Tasks, Calendar, Drive)

backend/
  server.js             # Express app, route mounting, project seeding
  db.js                 # SQLite connection + schema initialization
  obsidianIndexer.js    # Recursively scans Obsidian vault, parses frontmatter
  ollama.js             # Ollama API client for capture classification
  routes/
    captures.js           # Capture CRUD + classify endpoint
    projects.js           # Project CRUD with JSON milestones
    knowledge.js          # Knowledge listing, indexing, search
    briefing.js           # Daily briefing aggregation + AI summary
    review.js             # Weekly review aggregation
    tasks.js              # Task CRUD with filtering
    google.js             # Google OAuth, Tasks, Calendar, Drive integration
    search.js             # Semantic search with embeddings
```

## Obsidian Integration

The indexer (`backend/obsidianIndexer.js`) reads the vault at `OBSIDIAN_VAULT_PATH` and:
- Recursively finds all `.md` files (ignores `.obsidian/`)
- Parses YAML frontmatter via `gray-matter`
- Extracts `#tags` and `[[internal links]]`
- Generates SHA-256 content hashes for change detection
- Upserts into `knowledge_items` with `source_path` as unique key
- Removes stale entries on re-index

The frontend Knowledge Base view displays these with:
- Note title, type/area from frontmatter
- Inline tags
- Preview excerpt (first paragraph)
- "Open in Obsidian" deep-link button
- "Re-index" button to rescan the vault
- Keyword search across titles, summaries, and tags

## Ollama Integration

The `POST /api/captures/:id/classify` endpoint sends the raw capture text to a local Ollama instance with a structured system prompt requesting JSON with:
- `type` — task, project, note, meeting, event, waiting, reference, idea, archive
- `area` — one of the 12 life areas or General
- `tags` — array of relevant tags
- `destination` — Obsidian, Google Tasks, Calendar, Archive
- `confidence` — 0.0-1.0
- `reasoning_summary` — one sentence explaining the decision

The Inbox view displays classification results inline and allows manual status override.

## Semantic Search

The system uses the Ollama embeddings API (`/api/embed`) with `nomic-embed-text` (configurable via `OLLAMA_EMBED_MODEL`) to generate vector embeddings for knowledge items and captures. Embeddings are stored as JSON in the `embeddings` table and compared using cosine similarity in JavaScript.

- `POST /api/search/embeddings/generate` — (Re)generate embeddings for all knowledge items and captures.
- `POST /api/search/semantic` — Accepts a query string and returns ranked results with similarity scores.

The frontend Search view (`/search`) now performs real semantic search against the embeddings instead of using mock data.

## Obsidian Note Creation

Captures can be routed directly into the Obsidian vault as new markdown files. The `POST /api/captures/:id/obsidian-note` endpoint:

- Generates a filename by sanitizing the capture text
- Creates frontmatter with title, type, area, tags, and metadata referencing the original capture ID
- Writes the `.md` file to `OBSIDIAN_VAULT_PATH`
- Upserts the new note into `knowledge_items` for immediate searchability
- Updates the capture status to `routed` with destination `obsidian`

The Inbox view provides a "Create Note" button for unprocessed captures.

## Google Integration

The system supports OAuth2-based sync with Google Workspace:

- **Google Tasks**: Import tasks from Google Tasks into local DB (`external_id` tracking). Sync status bidirectionally.
- **Google Calendar**: Fetch upcoming events for Daily Briefing display. Included in AI summary prompt.
- **Google Drive**: List files and folders, search by name, open files via web links.

OAuth tokens are stored in `google_credentials` SQLite table. Auto-refresh handles expired tokens.

## Next Steps

See `implementation_plan.md` and `TASKS.md` for the full roadmap. Potential next phases:
- Apple Shortcuts workaround for Apple Notes/Reminders
- Weekly Review AI assistant
- Deployment strategy
