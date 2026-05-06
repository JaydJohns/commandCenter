import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import db from "./db.js";

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH ||
  path.resolve(process.cwd(), "..", "obsidian", "Life Organizer");

function getAllMarkdownFiles(dir) {
  const entries = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== ".obsidian") {
      entries.push(...getAllMarkdownFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith(".md")) {
      entries.push(fullPath);
    }
  }

  return entries;
}

function extractInternalLinks(content) {
  const links = [];
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

function extractTags(content) {
  const tags = [];
  const regex = /#([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  return [...new Set(tags)];
}

function hashContent(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function indexVault() {
  const files = getAllMarkdownFiles(VAULT_PATH);
  const results = [];

  const upsert = db.prepare(`
    INSERT INTO knowledge_items (title, source, source_path, content_hash, summary, tags, last_indexed)
    VALUES (?, 'obsidian', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(source_path) DO UPDATE SET
      title = excluded.title,
      content_hash = excluded.content_hash,
      summary = excluded.summary,
      tags = excluded.tags,
      last_indexed = CURRENT_TIMESTAMP
  `);

  const deleteStmt = db.prepare("DELETE FROM knowledge_items WHERE source = 'obsidian' AND source_path = ?");
  const existingPaths = new Set(
    db.prepare("SELECT source_path FROM knowledge_items WHERE source = 'obsidian'").all().map((r) => r.source_path)
  );

  for (const filePath of files) {
    const relPath = path.relative(VAULT_PATH, filePath);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const content = parsed.content;
    const title = parsed.data.title || path.basename(filePath, ".md");
    const frontmatterTags = Array.isArray(parsed.data.tags) ? parsed.data.tags : [];
    const inlineTags = extractTags(content);
    const allTags = [...new Set([...frontmatterTags, ...inlineTags])];
    const links = extractInternalLinks(content);
    const contentHash = hashContent(raw);

    // Summary = first non-empty paragraph, max 200 chars
    const firstPara = content.split("\n").find((line) => line.trim().length > 0 && !line.startsWith("#"));
    const summary = firstPara ? firstPara.trim().slice(0, 200) : "";

    const tagsJson = JSON.stringify(allTags);

    upsert.run(title, relPath, contentHash, summary, tagsJson);

    results.push({
      title,
      path: relPath,
      tags: allTags,
      links,
      type: parsed.data.type || null,
      area: parsed.data.area || null,
      status: parsed.data.status || null
    });

    existingPaths.delete(relPath);
  }

  // Remove stale entries
  for (const stalePath of existingPaths) {
    deleteStmt.run(stalePath);
  }

  return {
    indexed: results.length,
    removed: existingPaths.size,
    files: results
  };
}

export { VAULT_PATH };
