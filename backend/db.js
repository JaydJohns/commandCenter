import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), "db.sqlite");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS captures (
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

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner TEXT,
    status TEXT DEFAULT 'active',
    health TEXT,
    progress INTEGER DEFAULT 0,
    due TEXT,
    summary TEXT,
    milestones TEXT,
    area TEXT,
    priority TEXT DEFAULT 'medium',
    source_url TEXT,
    last_reviewed DATETIME,
    next_action TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
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

  CREATE TABLE IF NOT EXISTS knowledge_items (
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

  CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_source_path ON knowledge_items(source_path);

  CREATE TABLE IF NOT EXISTS google_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT,
    refresh_token TEXT,
    expiry_date INTEGER,
    scope TEXT
  );
`);

export default db;
