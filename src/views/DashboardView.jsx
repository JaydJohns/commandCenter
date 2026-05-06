import { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function DashboardView({
  captureValue,
  onCaptureChange,
  onOpenProjects,
  projects
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  const fetchCaptures = async () => {
    try {
      const res = await fetch(`${API}/captures`);
      const data = await res.json();
      setEntries(data.slice(0, 6));
    } catch (err) {
      console.error("Failed to fetch captures", err);
    }
  };

  useEffect(() => {
    fetchCaptures();
  }, []);

  const saveCapture = async () => {
    const trimmed = captureValue.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await fetch(`${API}/captures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: trimmed })
      });
      onCaptureChange("");
      await fetchCaptures();
    } catch (err) {
      console.error("Failed to save capture", err);
    } finally {
      setLoading(false);
    }
  };

  const exportBrief = async () => {
    try {
      const res = await fetch(`${API}/briefing/daily`);
      const data = await res.json();

      const lines = [
        `# Command Center Brief — ${data.date}`,
        "",
        "## Stats",
        `- Active projects: ${data.stats.activeProjects} / ${data.stats.totalProjects}`,
        `- Unprocessed captures: ${data.stats.unprocessedCaptures} / ${data.stats.totalCaptures}`,
        `- Waiting / routed: ${data.stats.waitingCaptures}`,
        `- Open tasks: ${data.stats.openTasks} (${data.stats.overdueTasks} overdue, ${data.stats.tasksDueToday} due today)`,
        `- Recent notes: ${data.stats.recentNotes} / ${data.stats.totalNotes}`,
        "",
        "## Active Projects",
        ...(data.activeProjects?.map((p) => `- ${p.name} (${p.status}, ${p.progress}%): ${p.summary}`) || ["None"]),
        "",
        "## Captures Needing Review",
        ...(data.unprocessedCaptures?.map((c) => `- ${c.raw_text}`) || ["None"]),
        "",
        "## Tasks Due Today",
        ...(data.tasksDueToday?.map((t) => `- ${t.title} (priority: ${t.priority})`) || ["None"]),
        "",
        "## Overdue Tasks",
        ...(data.overdueTasks?.map((t) => `- ${t.title} (priority: ${t.priority}, due: ${t.due_date})`) || ["None"]),
        ""
      ];

      const markdown = lines.join("\n");
      await navigator.clipboard.writeText(markdown);
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <section className="view-grid">
      <div className="hero-card card">
        <div>
          <div className="eyebrow">Command Layer</div>
          <h3>Move from stitched concepts to an MVP we can actually test.</h3>
          <p>
            This prototype focuses on the four strongest workflows in the export: quick capture,
            project visibility, knowledge retrieval, and system configuration.
          </p>
        </div>
        <div className="hero-card__actions">
          <button className="button button--primary" type="button" onClick={onOpenProjects}>
            Review projects
          </button>
          <button className="button" type="button" onClick={exportBrief}>
            {exported ? "Copied to clipboard!" : "Export brief"}
          </button>
        </div>
      </div>

      <div className="capture-card card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Quick Capture</div>
            <h4>Drop the next thought into the system</h4>
          </div>
          <button className="button" type="button" onClick={saveCapture} disabled={loading}>
            {loading ? "Saving..." : "Save entry"}
          </button>
        </div>
        <textarea
          className="capture-input"
          value={captureValue}
          onChange={(event) => onCaptureChange(event.target.value)}
          placeholder="What should this system remember, route, or follow up on?"
        />
        <div className="capture-log">
          {entries.map((entry) => (
            <div className="capture-log__item" key={entry.id}>
              {entry.raw_text}
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <MetricCard label="Active initiatives" value="03" detail="1 blocked, 1 queued" />
        <MetricCard label="Knowledge documents" value="148" detail="12 updated this week" />
        <MetricCard label="Search readiness" value="84%" detail="mock ranking configured" />
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Delivery snapshot</div>
            <h4>Current initiatives</h4>
          </div>
        </div>
        <div className="project-row-list">
          {projects.map((project) => (
            <div className="project-row" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.summary}</p>
              </div>
              <div className={`status-tag ${project.status.toLowerCase()}`}>{project.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
