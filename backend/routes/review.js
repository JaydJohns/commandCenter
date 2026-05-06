import { Router } from "express";
import db from "../db.js";

const router = Router();

function getSevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

router.get("/weekly", (_req, res) => {
  const sevenDaysAgo = getSevenDaysAgo();
  const today = getTodayDate();

  // Captures from the past 7 days
  const recentCaptures = db
    .prepare("SELECT * FROM captures WHERE created_at > ? ORDER BY created_at DESC")
    .all(sevenDaysAgo);

  // Stale tasks: open tasks that are overdue OR have no due date
  const staleTasks = db
    .prepare("SELECT * FROM tasks WHERE status = 'open' AND (due_date < ? OR due_date IS NULL) ORDER BY due_date IS NULL, due_date ASC, priority DESC, created_at ASC")
    .all(today);

  // Projects needing review: active with low progress OR blocked
  const projectsNeedingReview = db
    .prepare("SELECT * FROM projects WHERE (LOWER(status) = 'active' AND progress < 50) OR LOWER(status) = 'blocked' ORDER BY priority DESC, progress ASC")
    .all();

  for (const p of projectsNeedingReview) {
    if (p.milestones) {
      try { p.milestones = JSON.parse(p.milestones); } catch { /* keep string */ }
    }
  }

  // Recently processed captures (last 7 days)
  const recentlyProcessed = db
    .prepare("SELECT * FROM captures WHERE status != 'unprocessed' AND processed_at > ? ORDER BY processed_at DESC")
    .all(sevenDaysAgo);

  // Stats
  const stats = {
    totalCapturesWeek: db.prepare("SELECT COUNT(*) as count FROM captures WHERE created_at > ?").get(sevenDaysAgo).count,
    unprocessedCaptures: db.prepare("SELECT COUNT(*) as count FROM captures WHERE status = 'unprocessed'").get().count,
    totalOpenTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open'").get().count,
    staleTasks: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open' AND (due_date < ? OR due_date IS NULL)").get(today).count,
    activeProjects: db.prepare("SELECT COUNT(*) as count FROM projects WHERE LOWER(status) = 'active'").get().count,
    blockedProjects: db.prepare("SELECT COUNT(*) as count FROM projects WHERE LOWER(status) = 'blocked'").get().count,
    projectsNeedingReview: projectsNeedingReview.length
  };

  res.json({
    weekStart: sevenDaysAgo.split("T")[0],
    date: today,
    stats,
    recentCaptures,
    recentlyProcessed,
    staleTasks,
    projectsNeedingReview
  });
});

export default router;
