import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { status, project_id } = req.query;
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (project_id) {
    sql += " AND project_id = ?";
    params.push(project_id);
  }

  sql += " ORDER BY due_date IS NULL, due_date ASC, priority DESC, created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post("/", (req, res) => {
  const { title, project_id, due_date, priority, status } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const result = db
    .prepare(
      "INSERT INTO tasks (title, project_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      title.trim(),
      project_id || null,
      due_date || null,
      priority || "medium",
      status || "open"
    );

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = ["title", "project_id", "due_date", "status", "priority", "external_id", "source"];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (key in updates) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(row);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.json({ deleted: true });
});

export default router;
