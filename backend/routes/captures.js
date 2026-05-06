import { Router } from "express";
import fs from "fs";
import path from "path";
import db from "../db.js";
import { classifyCapture } from "../ollama.js";
import { VAULT_PATH } from "../obsidianIndexer.js";

const router = Router();

function sanitizeFilename(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function generateFrontmatter(capture) {
  const tags = capture.suggested_tags
    ? capture.suggested_tags.split(", ").map((t) => t.trim())
    : ["capture"];
  const frontmatter = {
    title: capture.raw_text.slice(0, 120),
    type: capture.suggested_type || "note",
    area: capture.suggested_area || "General",
    tags,
    created_from_capture: capture.id,
    created_at: new Date().toISOString()
  };
  const lines = Object.entries(frontmatter).map(([key, val]) => {
    if (Array.isArray(val)) return `${key}: [${val.join(", ")}]`;
    return `${key}: ${val}`;
  });
  return `---\n${lines.join("\n")}\n---\n\n${capture.raw_text}\n`;
}

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

router.post("/:id/obsidian-note", async (req, res) => {
  const { id } = req.params;
  const capture = db.prepare("SELECT * FROM captures WHERE id = ?").get(id);
  if (!capture) {
    return res.status(404).json({ error: "Capture not found" });
  }

  const baseName = sanitizeFilename(capture.raw_text) || `capture-${id}`;
  const fileName = `${baseName}.md`;
  const filePath = path.join(VAULT_PATH, fileName);

  // Avoid overwriting existing files
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: "Obsidian note already exists", path: fileName });
  }

  try {
    fs.writeFileSync(filePath, generateFrontmatter(capture), "utf8");
  } catch (err) {
    console.error("Failed to write Obsidian note:", err);
    return res.status(500).json({ error: "Failed to write note", details: err.message });
  }

  // Update capture status
  db.prepare(
    `UPDATE captures SET status = ?, destination = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run("routed", "obsidian", id);

  // Also upsert into knowledge_items so it appears in search immediately
  const existing = db.prepare("SELECT id FROM knowledge_items WHERE source_path = ?").get(fileName);
  if (!existing) {
    db.prepare(
      `INSERT INTO knowledge_items (title, source, source_path, content_hash, summary, tags, last_indexed)
       VALUES (?, 'obsidian', ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      capture.raw_text.slice(0, 120),
      fileName,
      "pending",
      capture.raw_text.slice(0, 200),
      capture.suggested_tags ? JSON.stringify(capture.suggested_tags.split(", ")) : "[]"
    );
  }

  const updated = db.prepare("SELECT * FROM captures WHERE id = ?").get(id);
  res.json({ capture: updated, notePath: fileName });
});

export default router;
