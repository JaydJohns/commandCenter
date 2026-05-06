import { Router } from "express";
import { google } from "googleapis";
import db from "../db.js";

const router = Router();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.readonly"
];

function getOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function getStoredCredentials() {
  const row = db.prepare("SELECT * FROM google_credentials WHERE id = 1").get();
  return row || null;
}

function saveCredentials(tokens) {
  const stmt = db.prepare(
    "INSERT INTO google_credentials (id, access_token, refresh_token, expiry_date, scope) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET access_token=excluded.access_token, refresh_token=excluded.refresh_token, expiry_date=excluded.expiry_date, scope=excluded.scope"
  );
  stmt.run(
    tokens.access_token || null,
    tokens.refresh_token || null,
    tokens.expiry_date || null,
    Array.isArray(tokens.scope) ? tokens.scope.join(" ") : tokens.scope || null
  );
}

async function getAuthenticatedClient() {
  const creds = getStoredCredentials();
  if (!creds || !creds.access_token) {
    return null;
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: creds.access_token,
    refresh_token: creds.refresh_token,
    expiry_date: creds.expiry_date
  });

  // Auto-refresh if expired
  if (creds.expiry_date && Date.now() > creds.expiry_date) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      saveCredentials(credentials);
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error("Failed to refresh Google token:", err);
      return null;
    }
  }

  return oauth2Client;
}

export { getAuthenticatedClient, getStoredCredentials };

// Check auth status
router.get("/status", (_req, res) => {
  const creds = getStoredCredentials();
  res.json({
    configured: !!(CLIENT_ID && CLIENT_SECRET),
    authenticated: !!(creds && creds.access_token)
  });
});

// Start OAuth flow
router.get("/auth", (_req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env" });
  }

  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });
  res.redirect(url);
});

// OAuth callback
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" });
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    saveCredentials(tokens);
    res.json({ success: true, message: "Google account connected successfully. You can close this window." });
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Disconnect / revoke
router.post("/disconnect", async (_req, res) => {
  const creds = getStoredCredentials();
  if (creds?.access_token) {
    try {
      const oauth2Client = getOAuthClient();
      await oauth2Client.revokeToken(creds.access_token);
    } catch (err) {
      console.error("Token revoke failed:", err);
    }
  }
  db.prepare("DELETE FROM google_credentials WHERE id = 1").run();
  res.json({ disconnected: true });
});

// --- Google Tasks API ---

// List task lists
router.get("/tasks/lists", async (_req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google. Visit /api/google/auth to connect." });
  }

  try {
    const tasks = google.tasks({ version: "v1", auth });
    const result = await tasks.tasklists.list({ maxResults: 10 });
    res.json(result.data.items || []);
  } catch (err) {
    console.error("Failed to list task lists:", err);
    res.status(500).json({ error: err.message });
  }
});

// List tasks in a task list
router.get("/tasks/:tasklistId", async (req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tasks = google.tasks({ version: "v1", auth });
    const result = await tasks.tasks.list({ tasklist: req.params.tasklistId });
    res.json(result.data.items || []);
  } catch (err) {
    console.error("Failed to list tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create a task in Google Tasks
router.post("/tasks/:tasklistId", async (req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  const { title, notes, due } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const tasks = google.tasks({ version: "v1", auth });
    const result = await tasks.tasks.insert({
      tasklist: req.params.tasklistId,
      requestBody: {
        title,
        notes,
        due: due ? new Date(due).toISOString() : undefined
      }
    });
    res.status(201).json(result.data);
  } catch (err) {
    console.error("Failed to create Google task:", err);
    res.status(500).json({ error: err.message });
  }
});

// Sync: import Google Tasks into local DB
router.post("/sync", async (_req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tasks = google.tasks({ version: "v1", auth });
    const listsResult = await tasks.tasklists.list({ maxResults: 10 });
    const lists = listsResult.data.items || [];

    const imported = [];

    for (const list of lists) {
      const tasksResult = await tasks.tasks.list({ tasklist: list.id });
      const items = tasksResult.data.items || [];

      for (const item of items) {
        // Skip if already synced (by external_id)
        const existing = db.prepare("SELECT id FROM tasks WHERE external_id = ?").get(item.id);
        if (existing) {
          // Update status if changed
          const newStatus = item.status === "completed" ? "completed" : "open";
          db.prepare("UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE external_id = ?")
            .run(newStatus, item.id);
          continue;
        }

        const result = db.prepare(
          "INSERT INTO tasks (title, source, external_id, due_date, status, priority) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(
          item.title,
          "google_tasks",
          item.id,
          item.due ? item.due.split("T")[0] : null,
          item.status === "completed" ? "completed" : "open",
          "medium"
        );

        imported.push({ id: result.lastInsertRowid, title: item.title });
      }
    }

    res.json({ imported: imported.length, tasks: imported });
  } catch (err) {
    console.error("Google sync failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Google Calendar API ---

router.get("/calendar/events", async (req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  const days = parseInt(req.query.days || "7", 10);
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 86400000).toISOString();

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime"
    });
    res.json(result.data.items || []);
  } catch (err) {
    console.error("Failed to fetch calendar events:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Google Drive API ---

router.get("/drive/files", async (req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  const pageSize = parseInt(req.query.limit || "50", 10);
  const query = req.query.q || "";

  try {
    const drive = google.drive({ version: "v3", auth });
    const q = query ? `name contains '${query.replace(/'/g, "\\'")}' and trashed = false` : "trashed = false";
    const result = await drive.files.list({
      pageSize,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, parents, size)",
      q
    });
    res.json(result.data.files || []);
  } catch (err) {
    console.error("Failed to list Drive files:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/drive/folders", async (_req, res) => {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const drive = google.drive({ version: "v3", auth });
    const result = await drive.files.list({
      pageSize: 100,
      fields: "files(id, name, modifiedTime, webViewLink)",
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    });
    res.json(result.data.files || []);
  } catch (err) {
    console.error("Failed to list Drive folders:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
