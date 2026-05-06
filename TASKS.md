# Command Center Implementation Tasks

## Phase 1: Stabilize the Prototype (Frontend)

- [x] **Add react-router-dom and set up client-side routing**
  Install react-router-dom as a dependency and set up BrowserRouter in src/main.jsx. Configure route definitions in App.jsx to replace the current useState-based view switching. Add navigation links that work with the router.

- [x] **Extract mock data into src/data/mockData.js**
  Move all mock data constants (navigation, quickTemplates, projects, knowledgeItems, searchResults, settingsGroups) from App.jsx into a dedicated src/data/mockData.js file. Update all imports in App.jsx and views.

- [x] **Extract reusable UI components (MetricCard, DetailStat)**
  Move MetricCard and DetailStat components from App.jsx into separate files under src/components/. Ensure they remain pure, reusable components with no state.

- [x] **Extract layout components (Sidebar, Topbar)**
  Move the sidebar navigation and topbar from App.jsx into src/components/Sidebar.jsx and src/components/Topbar.jsx. The sidebar should handle active route highlighting via react-router-dom. The topbar should display the current view label based on the route.

- [x] **Extract all views into src/views/ directory**
  Move each view (DashboardView, ProjectsView, KnowledgeView, SearchView, SettingsView) from App.jsx into separate files under src/views/. Each view should receive necessary props and maintain its current UI and local state logic.

- [x] **Refactor App.jsx as routing shell**
  Refactor App.jsx to be a lightweight route shell that renders Sidebar, Topbar, and route-based views. Remove all inline component definitions, mock data, and view logic. Keep only routing configuration and any truly global state.

- [x] **Add frontend environment configuration (.env.example)**
  Create a .env.example file at the project root documenting any environment variables the frontend uses (e.g., VITE_API_BASE_URL). Ensure Vite's env loading works correctly.

- [x] **Update CLAUDE.md with new architecture**
  Update CLAUDE.md to reflect the new multi-file architecture: routing, component directories, data directory, and build commands. Remove references to the monolithic single-file structure.

## Phase 2: Add Persistence (Backend + SQLite)

- [x] **Create backend directory and package.json**
  Create a backend/ directory at the project root. Initialize a separate package.json with express, better-sqlite3, and cors as dependencies. Add a dev script to start the server.

- [x] **Set up SQLite database and schema**
  Create backend/db.js to initialize a SQLite database with the schema for captures, projects, tasks, and knowledge_items tables. Use better-sqlite3 for synchronous, simple operations. Auto-create the DB file on first run.

- [x] **Create Express server and REST API routes**
  Create backend/server.js with Express. Mount capture routes at /api/captures and project routes at /api/projects. Enable CORS. Use JSON body parsing. Create backend/routes/captures.js with POST /, GET /, and PATCH /:id. Create backend/routes/projects.js with GET /, POST /, and PATCH /:id.

- [x] **Configure Vite proxy and concurrent dev script**
  Add a Vite dev server proxy configuration in vite.config.js to forward /api requests to the backend (e.g., localhost:3001). Install and configure concurrently in the root package.json so npm run dev starts both frontend and backend.

- [x] **Connect Quick Capture to backend API**
  Replace the mock capture entries state in DashboardView with real API calls. When the user submits quick capture, POST to /api/captures. On mount, GET /api/captures to display the list. Show loading and error states.

- [x] **Connect Projects view to backend API**
  Replace the mock projects data in ProjectsView with real API calls. On mount, GET /api/projects. Update selected project details from the real API. Add a simple form to create a new project via POST /api/projects.

- [x] **Create Inbox view for capture processing**
  Create a new InboxView component at src/views/InboxView.jsx. Display captures fetched from /api/captures with status badges (unprocessed, processed, routed, archived). Add filter buttons for each status. Add a 'Process' button to manually update status via PATCH /api/captures/:id. Register the route in App.jsx and add it to the sidebar navigation.

- [x] **End-to-end verification and testing**
  Run npm install in both root and backend/. Start npm run dev. Verify: (1) frontend loads at localhost:5173, (2) backend responds at localhost:3001/api/projects, (3) quick capture persists to SQLite, (4) inbox shows real captures, (5) projects load from DB. Fix any integration issues.

## Phase 3: Obsidian Integration + Ollama AI

- [x] **Create Obsidian vault indexer**
  Install gray-matter for YAML frontmatter parsing. Create backend/obsidianIndexer.js that recursively scans the Obsidian vault, parses frontmatter, extracts internal links [[...]] and tags, computes content hashes, and upserts records into the knowledge_items table.

- [x] **Add knowledge items REST API routes**
  Create backend/routes/knowledge.js with GET / (list all knowledge items), POST /index (trigger Obsidian vault re-indexing), and GET /search?q=... (keyword search across titles and content). Mount the router at /api/knowledge in server.js.

- [x] **Integrate Ollama for capture classification**
  Add backend/ollama.js to interface with a local Ollama instance. Add POST /api/captures/:id/classify that sends the capture text to Ollama with a structured system prompt, parses the JSON response, and updates the capture with suggested_type, area, tags, destination, confidence, and reasoning_summary.

- [x] **Connect Knowledge Base view to real Obsidian data**
  Update src/views/KnowledgeView.jsx to fetch real data from /api/knowledge instead of using mock data. Display Obsidian note titles, their area/type from frontmatter, tags, a preview excerpt, and a link to open the original file. Add a 'Re-index' button and a search field.

- [x] **Update Inbox view with AI classification**
  Add an "AI Classify" button to each capture in the Inbox view that calls POST /api/captures/:id/classify. Display the classification results (type, area, tags, confidence) inline after processing.

## Phase 4: Daily Briefing

- [x] **Create Daily Briefing view and API endpoint**
  Create GET /api/briefing/daily endpoint that aggregates active projects, unprocessed captures, waiting/routed items, and recently indexed Obsidian notes. Create src/views/DailyBriefingView.jsx to display stats cards, project list, capture lists, and recent notes. Add POST /api/briefing/daily/ai-summary that sends the briefing data to Ollama for a natural-language summary. Add route and sidebar navigation.

## Phase 5: Task Manager Integration

- [x] **Create tasks REST API routes**
  Create backend/routes/tasks.js with GET /, POST /, PATCH /:id, and DELETE /:id for task CRUD. Update backend/server.js to mount at /api/tasks. Add status and project_id query filters.

- [x] **Create Tasks view frontend**
  Create src/views/TasksView.jsx with task creation form, status filtering, inline editing, completion toggle, and delete. Fetch from /api/tasks and /api/projects. Add route and sidebar navigation.

- [x] **Add tasks to Daily Briefing**
  Update GET /api/briefing/daily to include overdue tasks, tasks due today, and open tasks. Update frontend to display these sections. Update AI summary prompt to include tasks.

- [x] **Add create-task-from-capture in Inbox**
  Add createTaskFromCapture function in InboxView that POSTs to /api/tasks and PATCHes the capture to "routed" status. Add "Create Task" button for unprocessed captures.

- [x] **Show tasks in Projects view**
  Update ProjectsView to fetch tasks for the selected project and display them in the detail pane with title, due date, priority, and status.

- [x] **Add project creation to ProjectsView**
  Add inline project creation form with name, owner, status, due date, and summary. POST to /api/projects. Auto-select new project after creation.

- [x] **Add task inline editing to TasksView**
  Add "Edit" button per task that reveals inline inputs for title, project, priority, due date, and status. PATCH to /api/tasks/:id. Save and Cancel buttons.

- [x] **Wire up Export brief button on Dashboard**
  Fetch /api/briefing/daily and format a Markdown summary. Copy to clipboard via navigator.clipboard.writeText().

## Phase 6: Weekly Review Assistant

- [x] **Create weekly review backend endpoint**
  Create backend/routes/review.js with GET /weekly that aggregates captures from past 7 days, stale/overdue tasks, blocked/active projects needing review, and recently processed captures. Mount at /api/review.

- [x] **Create weekly review frontend view**
  Create src/views/WeeklyReviewView.jsx with stats cards, recent captures, stale tasks, flagged projects, and recently processed captures. Add route and sidebar navigation.

## Phase 7: Google Integration

- [x] **Google Tasks integration**
  Add OAuth2 flow, Google Tasks API routes (/api/google/tasks/*), bidirectional sync, and frontend Google Integration page. Store credentials in SQLite.

- [x] **Google Calendar integration**
  Add Google Calendar API read-only access. Fetch upcoming events for Daily Briefing display. Include calendar events in AI summary prompt.

- [x] **Google Drive integration**
  Add Google Drive API read-only access. List files and folders, search by name, open files via web links. Display in Google Integration page.

## Next Phases (Pending)

- [ ] **Semantic search with local embeddings** (OB1)
  Use Ollama embeddings API (nomic-embed-text) to generate vector embeddings for knowledge items and captures. Store in SQLite. Add vector similarity search endpoint.

- [ ] **Obsidian note creation from captures**
  Route a capture directly into a new Obsidian markdown file with AI-generated frontmatter.

- [ ] **Apple Shortcuts workaround**
  Draft Apple Shortcut automation to export Apple Notes to a monitored folder for ingestion.

- [ ] **Deployment strategy**
  Dockerize the application, set up production build process, and define hosting strategy.

