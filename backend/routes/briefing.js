import { Router } from "express";
import db from "../db.js";
import { classifyCapture } from "../ollama.js";
import { google } from "googleapis";
import { getAuthenticatedClient } from "./google.js";

const router = Router();

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getSevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

router.get("/daily", async (_req, res) => {
  const today = getTodayDate();
  const sevenDaysAgo = getSevenDaysAgo();

  // Active projects
  const activeProjects = db
    .prepare("SELECT * FROM projects WHERE LOWER(status) = 'active' ORDER BY priority DESC, id LIMIT 10")
    .all();

  for (const p of activeProjects) {
    if (p.milestones) {
      try { p.milestones = JSON.parse(p.milestones); } catch { /* keep string */ }
    }
  }

  // Unprocessed captures (recent)
  const unprocessedCaptures = db
    .prepare("SELECT * FROM captures WHERE status = 'unprocessed' ORDER BY created_at DESC LIMIT 10")
    .all();

  // Recently processed captures
  const recentlyProcessed = db
    .prepare("SELECT * FROM captures WHERE status = 'processed' AND processed_at > ? ORDER BY processed_at DESC LIMIT 5")
    .all(sevenDaysAgo);

  // Waiting-on / routed captures
  const waitingCaptures = db
    .prepare("SELECT * FROM captures WHERE status IN ('waiting', 'routed') ORDER BY created_at DESC LIMIT 10")
    .all();

  // Tasks
  const overdueTasks = db
    .prepare("SELECT * FROM tasks WHERE status = 'open' AND due_date < ? ORDER BY due_date ASC LIMIT 5")
    .all(today);

  const tasksDueToday = db
    .prepare("SELECT * FROM tasks WHERE status = 'open' AND due_date = ? ORDER BY priority DESC LIMIT 5")
    .all(today);

  const openTasks = db
    .prepare("SELECT * FROM tasks WHERE status = 'open' ORDER BY due_date IS NULL, due_date ASC, priority DESC LIMIT 10")
    .all();

  // Recently indexed Obsidian notes
  const recentNotes = db
    .prepare("SELECT * FROM knowledge_items WHERE last_indexed > ? ORDER BY last_indexed DESC LIMIT 10")
    .all(sevenDaysAgo);

  for (const n of recentNotes) {
    if (n.tags) {
      try { n.tags = JSON.parse(n.tags); } catch { /* keep string */ }
    }
  }

  // Upcoming calendar events
  let calendarEvents = [];
  try {
    const auth = await getAuthenticatedClient();
    if (auth) {
      const calendar = google.calendar({ version: "v3", auth });
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 86400000).toISOString();
      const calResult = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        maxResults: 20,
        singleEvents: true,
        orderBy: "startTime"
      });
      calendarEvents = (calResult.data.items || []).map((e) => ({
        id: e.id,
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        description: e.description || "",
        location: e.location || "",
        htmlLink: e.htmlLink
      }));
    }
  } catch (err) {
    console.error("Calendar fetch failed in briefing:", err);
  }

  // Stats
  const stats = {
    activeProjects: db.prepare("SELECT COUNT(*) as count FROM projects WHERE LOWER(status) = 'active'").get().count,
    totalProjects: db.prepare("SELECT COUNT(*) as count FROM projects").get().count,
    unprocessedCaptures: db.prepare("SELECT COUNT(*) as count FROM captures WHERE status = 'unprocessed'").get().count,
    totalCaptures: db.prepare("SELECT COUNT(*) as count FROM captures").get().count,
    waitingCaptures: db.prepare("SELECT COUNT(*) as count FROM captures WHERE status IN ('waiting', 'routed')").get().count,
    recentNotes: db.prepare("SELECT COUNT(*) as count FROM knowledge_items WHERE last_indexed > ?").get(sevenDaysAgo).count,
    totalNotes: db.prepare("SELECT COUNT(*) as count FROM knowledge_items").get().count,
    openTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open'").get().count,
    overdueTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open' AND due_date < ?").get(today).count,
    tasksDueToday: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open' AND due_date = ?").get(today).count
  };

  const briefing = {
    date: today,
    stats,
    activeProjects,
    unprocessedCaptures,
    recentlyProcessed,
    waitingCaptures,
    recentNotes,
    overdueTasks,
    tasksDueToday,
    openTasks,
    calendarEvents
  };

  res.json(briefing);
});

router.post("/daily/ai-summary", async (_req, res) => {
  const today = getTodayDate();
  const sevenDaysAgo = getSevenDaysAgo();

  const activeProjects = db
    .prepare("SELECT name, summary, status, health, progress FROM projects WHERE LOWER(status) = 'active' ORDER BY priority DESC, id LIMIT 5")
    .all();

  const unprocessedCaptures = db
    .prepare("SELECT raw_text FROM captures WHERE status = 'unprocessed' ORDER BY created_at DESC LIMIT 5")
    .all();

  const waitingCaptures = db
    .prepare("SELECT raw_text, status FROM captures WHERE status IN ('waiting', 'routed') ORDER BY created_at DESC LIMIT 5")
    .all();

  const recentNotes = db
    .prepare("SELECT title, summary FROM knowledge_items WHERE last_indexed > ? ORDER BY last_indexed DESC LIMIT 5")
    .all(sevenDaysAgo);

  const openTasksBrief = db
    .prepare("SELECT title, due_date, priority FROM tasks WHERE status = 'open' ORDER BY due_date IS NULL, due_date ASC, priority DESC LIMIT 5")
    .all();

  let calendarEventsBrief = [];
  try {
    const auth = await getAuthenticatedClient();
    if (auth) {
      const calendar = google.calendar({ version: "v3", auth });
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 86400000).toISOString();
      const calResult = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime"
      });
      calendarEventsBrief = (calResult.data.items || []).map((e) => ({
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date
      }));
    }
  } catch (err) {
    console.error("Calendar fetch failed in AI summary:", err);
  }

  const prompt = `You are a personal assistant generating a daily briefing for ${today}.

Here is the user's current data:

ACTIVE PROJECTS:
${activeProjects.map((p) => `- ${p.name} (${p.status}, ${p.health}, ${p.progress}%): ${p.summary}`).join("\n") || "None"}

UNPROCESSED CAPTURES (need review):
${unprocessedCaptures.map((c) => `- ${c.raw_text}`).join("\n") || "None"}

WAITING / ROUTED ITEMS:
${waitingCaptures.map((c) => `- [${c.status}] ${c.raw_text}`).join("\n") || "None"}

OPEN TASKS:
${openTasksBrief.map((t) => `- ${t.title} (priority: ${t.priority}, due: ${t.due_date || "no date"})`).join("\n") || "None"}

UPCOMING CALENDAR EVENTS:
${calendarEventsBrief.map((e) => `- ${e.summary} at ${e.start}`).join("\n") || "None"}

RECENT OBSIDIAN NOTES:
${recentNotes.map((n) => `- ${n.title}: ${n.summary || "No summary"}`).join("\n") || "None"}

Write a concise, friendly daily briefing (3-5 paragraphs) that:
1. Summarizes the active project landscape
2. Highlights unprocessed captures that need attention
3. Notes any waiting items that may need follow-up
4. Mentions upcoming calendar events
5. Mentions interesting recent notes
6. Suggests a top priority for the day

Respond with only the briefing text. No JSON. No markdown headers.`;

  try {
    const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "kimi-k2.6:cloud";

    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      })
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama HTTP ${ollamaRes.status}`);
    }

    const data = await ollamaRes.json();
    const summary = data.response?.trim() || "No summary generated.";
    res.json({ summary });
  } catch (err) {
    console.error("AI briefing generation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
