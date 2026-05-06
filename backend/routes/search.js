import { Router } from "express";
import db from "../db.js";
import { getEmbedding } from "../ollama.js";

const router = Router();

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function upsertEmbedding(sourceType, sourceId, text, model) {
  const embedding = await getEmbedding(text);
  if (!embedding) return false;

  const existing = db
    .prepare("SELECT id FROM embeddings WHERE source_type = ? AND source_id = ?")
    .get(sourceType, sourceId);

  if (existing) {
    db.prepare(
      "UPDATE embeddings SET embedding = ?, model = ?, created_at = CURRENT_TIMESTAMP WHERE source_type = ? AND source_id = ?"
    ).run(JSON.stringify(embedding), model, sourceType, sourceId);
  } else {
    db.prepare(
      "INSERT INTO embeddings (source_type, source_id, embedding, model) VALUES (?, ?, ?, ?)"
    ).run(sourceType, sourceId, JSON.stringify(embedding), model);
  }
  return true;
}

router.post("/embeddings/generate", async (_req, res) => {
  const embedModel = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
  let generated = 0;
  let failed = 0;

  try {
    // Knowledge items
    const knowledgeItems = db
      .prepare("SELECT id, title, summary FROM knowledge_items")
      .all();
    for (const item of knowledgeItems) {
      const text = [item.title, item.summary].filter(Boolean).join("\n");
      const ok = await upsertEmbedding("knowledge_item", item.id, text, embedModel);
      if (ok) generated++;
      else failed++;
    }

    // Captures
    const captures = db.prepare("SELECT id, raw_text FROM captures").all();
    for (const capture of captures) {
      const ok = await upsertEmbedding("capture", capture.id, capture.raw_text, embedModel);
      if (ok) generated++;
      else failed++;
    }

    res.json({ generated, failed });
  } catch (err) {
    console.error("Embedding generation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/semantic", async (req, res) => {
  const { query, limit = 10 } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "query is required" });
  }

  const queryEmbedding = await getEmbedding(query.trim());
  if (!queryEmbedding) {
    return res.status(500).json({ error: "Failed to generate query embedding" });
  }

  const allEmbeddings = db.prepare("SELECT * FROM embeddings").all();
  const scored = [];

  for (const row of allEmbeddings) {
    try {
      const stored = JSON.parse(row.embedding);
      if (!Array.isArray(stored) || stored.length !== queryEmbedding.length) continue;
      const similarity = cosineSimilarity(queryEmbedding, stored);
      scored.push({ ...row, similarity });
    } catch {
      continue;
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  const top = scored.slice(0, limit);

  const results = [];
  for (const row of top) {
    let source = null;
    if (row.source_type === "knowledge_item") {
      source = db.prepare("SELECT * FROM knowledge_items WHERE id = ?").get(row.source_id);
    } else if (row.source_type === "capture") {
      source = db.prepare("SELECT * FROM captures WHERE id = ?").get(row.source_id);
    }
    if (source) {
      results.push({
        id: source.id,
        title: source.title || source.raw_text || "Untitled",
        summary: source.summary || "",
        source_type: row.source_type,
        source_id: row.source_id,
        similarity: row.similarity,
        tags: source.tags || source.suggested_tags || ""
      });
    }
  }

  res.json(results);
});

export default router;
