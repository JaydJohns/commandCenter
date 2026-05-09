import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";
import capturesRouter from "./routes/captures.js";
import projectsRouter from "./routes/projects.js";
import knowledgeRouter from "./routes/knowledge.js";
import briefingRouter from "./routes/briefing.js";
import tasksRouter from "./routes/tasks.js";
import reviewRouter from "./routes/review.js";
import googleRouter from "./routes/google.js";
import searchRouter from "./routes/search.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

function seed() {
  const count = db.prepare("SELECT COUNT(*) as count FROM projects").get().count;
  if (count === 0) {
    const stmt = db.prepare(
      "INSERT INTO projects (name, owner, status, health, progress, due, summary, milestones, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run(
      "Command Center MVP",
      "Jordan",
      "Active",
      "On track",
      72,
      "Apr 12",
      "Convert Stitch concepts into a navigable internal prototype.",
      JSON.stringify([
        { name: "Prototype shell", done: true },
        { name: "Mock data flows", done: true },
        { name: "Search interactions", done: false }
      ]),
      "LLM Experiments"
    );
    stmt.run(
      "Knowledge Ingestion Pipeline",
      "Rae",
      "Blocked",
      "Needs decision",
      46,
      "Apr 19",
      "Normalize source metadata and prepare document summaries for search.",
      JSON.stringify([
        { name: "Source schema review", done: true },
        { name: "Chunking strategy", done: false },
        { name: "Embeddings experiment", done: false }
      ]),
      "UX Research Lab"
    );
    stmt.run(
      "Course Builder Alpha",
      "Sam",
      "Planned",
      "Queued",
      18,
      "May 02",
      "Package curriculum authoring into a guided production workflow.",
      JSON.stringify([
        { name: "Template inventory", done: true },
        { name: "Assessment flow", done: false },
        { name: "Analytics surface", done: false }
      ]),
      "PFW Teaching"
    );
    console.log("Seeded initial projects");
  }
}

seed();

app.use(cors());
app.use(express.json());

app.use("/api/captures", capturesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/briefing", briefingRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/review", reviewRouter);
app.use("/api/google", googleRouter);
app.use("/api/search", searchRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend in production
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    res.status(404).json({ error: "API endpoint not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
