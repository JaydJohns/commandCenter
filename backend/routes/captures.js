import { Router } from "express";
import db from "../db.js";
import { classifyCapture } from "../ollama.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM captures ORDER BY created_at DESC").all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { raw_text } = req.body;
  if (!raw_text || !raw_text.trim()) {
    return res.status(400).json({ error: "raw_text is required" });
  }

  const result = db
    .prepare("INSERT INTO captures (raw_text) VALUES (?)")
    .run(raw_text.trim());

  const row = db.prepare("SELECT * FROM captures WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = [
    "raw_text",
    "status",
    "suggested_type",
    "suggested_area",
    "suggested_project_id",
    "suggested_tags",
    "destination",
    "confidence",
    "processed_at"
  ];

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
  db.prepare(`UPDATE captures SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const row = db.prepare("SELECT * FROM captures WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: "Capture not found" });
  }

  res.json(row);
});

router.post("/:id/classify", async (req, res) => {
  const { id } = req.params;
  const capture = db.prepare("SELECT * FROM captures WHERE id = ?").get(id);
  if (!capture) {
    return res.status(404).json({ error: "Capture not found" });
  }

  const classification = await classifyCapture(capture.raw_text);

  db.prepare(
    `UPDATE captures
     SET suggested_type = ?,
         suggested_area = ?,
         suggested_tags = ?,
         destination = ?,
         confidence = ?,
         status = 'processed',
         processed_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    classification.suggested_type,
    classification.suggested_area,
    classification.suggested_tags,
    classification.destination,
    classification.confidence,
    id
  );

  const row = db.prepare("SELECT * FROM captures WHERE id = ?").get(id);
  res.json({ capture: row, classification });
});

export default router;
