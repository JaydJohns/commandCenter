import { Router } from "express";
import fs from "fs";
import path from "path";
import db from "../db.js";
import { VAULT_PATH, indexVault } from "../obsidianIndexer.js";

const router = Router();

function ensureObsidianArea(areaName) {
  if (!areaName || areaName === "General") return;
  
  const safeAreaName = areaName.replace(/[/\\?%*:|"<>]/g, "");
  const areaDir = path.join(VAULT_PATH, "🎯 12 Life Areas", safeAreaName);
  
  if (!fs.existsSync(areaDir)) {
    // Create the directory
    fs.mkdirSync(areaDir, { recursive: true });
    
    // Create the index markdown file
    const indexFilePath = path.join(areaDir, `_${safeAreaName}.md`);
    const content = `---
type: area
area: ${safeAreaName}
status: active
---

# 🎯 ${safeAreaName}

---

## Active Workflows

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "Project",
  status as "Status"
FROM "🎯 12 Life Areas/${safeAreaName}"
WHERE type = "project"
SORT priority DESC
\`\`\`

---

## Current Tasks

\`\`\`dataview
TASK
WHERE contains(file.path, "${safeAreaName}")
AND !completed
SORT due ASC
\`\`\`

---

## Quick Links

- [[🛠️ Resources/Templates/project|Create Project]]
- [[🛠️ Resources/Templates/task|Create Task]]
- [[🛠️ Resources/Templates/learning_notes|Document Learnings]]

---

> **Track initiatives and tasks for ${safeAreaName} here.**
`;
    fs.writeFileSync(indexFilePath, content, "utf8");
    
    // Re-index so the new area appears in the knowledge base
    indexVault();
  }
}

function ensureObsidianProject(project) {
  const areaName = project.area && project.area !== "General" ? project.area : "General";
  const safeAreaName = areaName.replace(/[/\\?%*:|"<>]/g, "");
  const safeProjectName = project.name.replace(/[/\\?%*:|"<>]/g, "");
  
  const areaDir = path.join(VAULT_PATH, "🎯 12 Life Areas", safeAreaName);
  
  if (!fs.existsSync(areaDir)) {
    ensureObsidianArea(areaName);
  }
  
  const projectFilePath = path.join(areaDir, `${safeProjectName}.md`);
  
  if (!fs.existsSync(projectFilePath)) {
    const content = `---
type: project
area: ${safeAreaName}
status: ${project.status || 'active'}
priority: ${project.priority || 'medium'}
due: ${project.due || ''}
---

# ${project.name}

**Summary:** ${project.summary || 'No summary provided.'}

## Notes
- 

`;
    fs.writeFileSync(projectFilePath, content, "utf8");
    indexVault();
  }
}

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

  if (area && area !== "General") {
    try {
      ensureObsidianArea(area);
    } catch (err) {
      console.error("Failed to create Obsidian area:", err);
    }
  }

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
  
  try {
    ensureObsidianProject(row);
  } catch (err) {
    console.error("Failed to create Obsidian project file:", err);
  }

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

  if (updates.area && updates.area !== "General") {
    try {
      ensureObsidianArea(updates.area);
    } catch (err) {
      console.error("Failed to ensure Obsidian area:", err);
    }
  }

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
