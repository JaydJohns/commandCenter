import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM projects ORDER BY id").all();
  for (const row of rows) {
    if (row.milestones) {
      try { row.milestones = JSON.parse(row.milestones); } catch { /* keep as string */ }
    }
  }
  res.json(rows);
});

router.post("/", (req, res) => {
  const { name, owner, status, health, progress, due, summary, milestones, area, priority, source_url, next_action } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const result = db
    .prepare(
      "INSERT INTO projects (name, owner, status, health, progress, due, summary, milestones, area, priority, source_url, next_action) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      name.trim(),
      owner || null,
      status || "active",
      health || null,
      progress ?? 0,
      due || null,
      summary || null,
      milestones ? JSON.stringify(milestones) : null,
      area || null,
      priority || "medium",
      source_url || null,
      next_action || null
    );

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
  if (row.milestones) {
    try { row.milestones = JSON.parse(row.milestones); } catch { /* keep as string */ }
  }
  res.status(201).json(row);
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = [
    "name",
    "owner",
    "status",
    "health",
    "progress",
    "due",
    "summary",
    "milestones",
    "area",
    "priority",
    "source_url",
    "last_reviewed",
    "next_action"
  ];

  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (key in updates) {
      fields.push(`${key} = ?`);
      let value = updates[key];
      if (key === "milestones" && typeof value !== "string") {
        value = JSON.stringify(value);
      }
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  values.push(id);
  db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: "Project not found" });
  }
  if (row.milestones) {
    try { row.milestones = JSON.parse(row.milestones); } catch { /* keep as string */ }
  }

  res.json(row);
});

export default router;
