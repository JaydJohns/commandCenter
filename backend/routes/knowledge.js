import { Router } from "express";
import db from "../db.js";
import { indexVault } from "../obsidianIndexer.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM knowledge_items ORDER BY last_indexed DESC").all();
  for (const row of rows) {
    if (row.tags) {
      try { row.tags = JSON.parse(row.tags); } catch { /* keep as string */ }
    }
  }
  res.json(rows);
});

router.post("/index", (_req, res) => {
  try {
    const result = indexVault();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Indexing failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", (req, res) => {
  const q = req.query.q?.trim().toLowerCase();
  if (!q) {
    return res.status(400).json({ error: "Missing query parameter q" });
  }

  const rows = db
    .prepare(
      `SELECT * FROM knowledge_items
       WHERE LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags) LIKE ?
       ORDER BY last_indexed DESC`
    )
    .all(`%${q}%`, `%${q}%`, `%${q}%`);

  for (const row of rows) {
    if (row.tags) {
      try { row.tags = JSON.parse(row.tags); } catch { /* keep as string */ }
    }
  }

  res.json(rows);
});

export default router;
