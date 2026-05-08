import { Router } from "express";
import db from "../db.js";

const router = Router();

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getPeriodDays(period) {
  switch (period) {
    case "weekly": return 7;
    case "monthly": return 30;
    case "quarterly": return 90;
    case "annual": return 365;
    default: return 7;
  }
}

function getPeriodLabel(period) {
  switch (period) {
    case "weekly": return "Week";
    case "monthly": return "Month";
    case "quarterly": return "Quarter";
    case "annual": return "Year";
    default: return "Period";
  }
}

function buildReview(period, days) {
  const since = getDaysAgo(days);
  const today = getTodayDate();

  const recentCaptures = db
    .prepare("SELECT * FROM captures WHERE created_at > ? ORDER BY created_at DESC")
    .all(since);

  const staleTasks = db
    .prepare("SELECT * FROM tasks WHERE status = 'open' AND (due_date < ? OR due_date IS NULL) ORDER BY due_date IS NULL, due_date ASC, priority DESC, created_at ASC")
    .all(today);

  const projectsNeedingReview = db
    .prepare("SELECT * FROM projects WHERE (LOWER(status) = 'active' AND progress < 50) OR LOWER(status) = 'blocked' ORDER BY priority DESC, progress ASC")
    .all();

  for (const p of projectsNeedingReview) {
    if (p.milestones) {
      try { p.milestones = JSON.parse(p.milestones); } catch { /* keep string */ }
    }
  }

  const recentlyProcessed = db
    .prepare("SELECT * FROM captures WHERE status != 'unprocessed' AND processed_at > ? ORDER BY processed_at DESC")
    .all(since);

  const completedTasks = db
    .prepare("SELECT * FROM tasks WHERE status = 'completed' AND updated_at > ? ORDER BY updated_at DESC LIMIT 20")
    .all(since);

  const recentNotes = db
    .prepare("SELECT * FROM knowledge_items WHERE last_indexed > ? ORDER BY last_indexed DESC LIMIT 20")
    .all(since);

  for (const n of recentNotes) {
    if (n.tags) {
      try { n.tags = JSON.parse(n.tags); } catch { /* keep string */ }
    }
  }

  const stats = {
    totalCapturesPeriod: db.prepare("SELECT COUNT(*) as count FROM captures WHERE created_at > ?").get(since).count,
    unprocessedCaptures: db.prepare("SELECT COUNT(*) as count FROM captures WHERE status = 'unprocessed'").get().count,
    totalOpenTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open'").get().count,
    staleTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open' AND (due_date < ? OR due_date IS NULL)").get(today).count,
    completedTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND updated_at > ?").get(since).count,
    activeProjects: db.prepare("SELECT COUNT(*) as count FROM projects WHERE LOWER(status) = 'active'").get().count,
    blockedProjects: db.prepare("SELECT COUNT(*) as count FROM projects WHERE LOWER(status) = 'blocked'").get().count,
    projectsNeedingReview: projectsNeedingReview.length,
    totalProjects: db.prepare("SELECT COUNT(*) as count FROM projects").get().count,
    recentNotes: db.prepare("SELECT COUNT(*) as count FROM knowledge_items WHERE last_indexed > ?").get(since).count,
    totalNotes: db.prepare("SELECT COUNT(*) as count FROM knowledge_items").get().count
  };

  return {
    period,
    periodLabel: getPeriodLabel(period),
    since: since.split("T")[0],
    date: today,
    stats,
    recentCaptures,
    recentlyProcessed,
    staleTasks,
    completedTasks,
    projectsNeedingReview,
    recentNotes
  };
}

router.get("/:period", (req, res) => {
  const { period } = req.params;
  const valid = ["weekly", "monthly", "quarterly", "annual"];
  if (!valid.includes(period)) {
    return res.status(400).json({ error: `Invalid period. Use one of: ${valid.join(", ")}` });
  }
  const days = getPeriodDays(period);
  res.json(buildReview(period, days));
});

function buildPrompt(period, review) {
  const label = getPeriodLabel(period);
  const since = review.since;

  let scopeText = "";
  switch (period) {
    case "weekly":
      scopeText = `Focus on immediate actions and short-term trends. Highlight urgent tasks and quick wins.`;
      break;
    case "monthly":
      scopeText = `Focus on patterns and momentum over the month. What improved, what stagnated, and what needs attention next month.`;
      break;
    case "quarterly":
      scopeText = `Take a strategic perspective. Evaluate project health, major milestones reached, and whether goals are on track for the quarter.`;
      break;
    case "annual":
      scopeText = `Take a big-picture retrospective. Celebrate wins, identify major themes, and suggest focus areas for the coming year.`;
      break;
  }

  return `You are a personal productivity assistant generating a ${label.toLowerCase()} review for the user, covering activity since ${since}.

${scopeText}

Here is the user's current data:

CAPTURES (${review.stats.totalCapturesPeriod} in this ${label.toLowerCase()}):
${review.recentCaptures.slice(0, 10).map((c) => `- [${c.status}] ${c.raw_text.slice(0, 120)}`).join("\n") || "None"}

STALE / OVERDUE TASKS (${review.stats.staleTasks} total):
${review.staleTasks.slice(0, 10).map((t) => `- ${t.title} (priority: ${t.priority}, due: ${t.due_date || "no date"})`).join("\n") || "None"}

COMPLETED TASKS (${review.stats.completedTasks} in this ${label.toLowerCase()}):
${review.completedTasks.slice(0, 10).map((t) => `- ${t.title}`).join("\n") || "None"}

PROJECTS NEEDING REVIEW (${review.stats.projectsNeedingReview}):
${review.projectsNeedingReview.slice(0, 10).map((p) => `- ${p.name} (${p.status}, ${p.progress}%): ${p.summary || "No summary"}`).join("\n") || "None"}

RECENT KNOWLEDGE NOTES (${review.stats.recentNotes} in this ${label.toLowerCase()}):
${review.recentNotes.slice(0, 10).map((n) => `- ${n.title}: ${n.summary || "No summary"}`).join("\n") || "None"}

Write a concise, insightful ${label.toLowerCase()} review (3-6 paragraphs) that:
1. Summarizes overall activity and momentum
2. Highlights captures that still need attention
3. Notes any projects that are stalled or blocked
4. Celebrates completed work
5. Suggests 2-3 top priorities or themes for the next ${label.toLowerCase()}

Respond with only the review text. No JSON. No markdown headers.`;
}

router.post("/:period/ai-insights", async (req, res) => {
  const { period } = req.params;
  const valid = ["weekly", "monthly", "quarterly", "annual"];
  if (!valid.includes(period)) {
    return res.status(400).json({ error: `Invalid period. Use one of: ${valid.join(", ")}` });
  }

  const days = getPeriodDays(period);
  const review = buildReview(period, days);
  const prompt = buildPrompt(period, review);

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
    const insights = data.response?.trim() || "No insights generated.";
    res.json({ period, insights });
  } catch (err) {
    console.error(`AI ${period} review generation failed:`, err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
