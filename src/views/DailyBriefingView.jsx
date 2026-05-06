import { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function DailyBriefingView() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const fetchBriefing = async () => {
    try {
      const res = await fetch(`${API}/briefing/daily`);
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      console.error("Failed to fetch briefing", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiSummary = async () => {
    if (!briefing) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch(`${API}/briefing/daily/ai-summary`, { method: "POST" });
      const data = await res.json();
      setAiSummary(data.summary || "No summary generated.");
    } catch (err) {
      console.error("AI summary failed", err);
      setAiSummary("AI summary generation failed. Check that Ollama is running.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  if (loading) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Loading daily briefing...</p>
        </div>
      </section>
    );
  }

  if (!briefing) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Failed to load briefing.</p>
        </div>
      </section>
    );
  }

  const openObsidian = (path) => {
    const vaultName = "Life%20Organizer";
    const encodedPath = encodeURIComponent(path);
    window.open(`obsidian://open?vault=${vaultName}&file=${encodedPath}`, "_blank");
  };

  return (
    <section className="view-grid">
      {/* Header */}
      <div className="hero-card card">
        <div>
          <div className="eyebrow">Daily Briefing</div>
          <h3>{briefing.date}</h3>
          <p>Your daily overview of projects, captures, and knowledge.</p>
        </div>
        <div className="hero-card__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={generateAiSummary}
            disabled={generatingSummary}
          >
            {generatingSummary ? "Generating..." : "Generate AI Summary"}
          </button>
          <button className="button" type="button" onClick={fetchBriefing}>
            Refresh
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">AI Summary</div>
              <h4>Generated Briefing</h4>
            </div>
          </div>
          <p style={{ lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{aiSummary}</p>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <MetricCard
          label="Active projects"
          value={String(briefing.stats.activeProjects).padStart(2, "0")}
          detail={`${briefing.stats.totalProjects} total`}
        />
        <MetricCard
          label="Unprocessed captures"
          value={String(briefing.stats.unprocessedCaptures).padStart(2, "0")}
          detail={`${briefing.stats.totalCaptures} total`}
        />
        <MetricCard
          label="Waiting / routed"
          value={String(briefing.stats.waitingCaptures).padStart(2, "0")}
          detail="needs follow-up"
        />
        <MetricCard
          label="Recent notes"
          value={String(briefing.stats.recentNotes).padStart(2, "0")}
          detail={`${briefing.stats.totalNotes} total indexed`}
        />
        <MetricCard
          label="Open tasks"
          value={String(briefing.stats.openTasks).padStart(2, "0")}
          detail={`${briefing.stats.overdueTasks} overdue`}
        />
        <MetricCard
          label="Due today"
          value={String(briefing.stats.tasksDueToday).padStart(2, "0")}
          detail="tasks"
        />
      </div>

      {/* Active Projects */}
      {briefing.activeProjects.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Projects</div>
              <h4>Active Projects</h4>
            </div>
          </div>
          <div className="project-row-list">
            {briefing.activeProjects.map((project) => (
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
      )}

      {/* Calendar Events */}
      {briefing.calendarEvents?.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Calendar</div>
              <h4>Upcoming Events</h4>
            </div>
          </div>
          <div className="capture-log">
            {briefing.calendarEvents.map((event) => (
              <div className="capture-log__item" key={event.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <strong>{event.summary}</strong>
                    {event.location && <p style={{ marginTop: "0.25rem", opacity: 0.7 }}>📍 {event.location}</p>}
                  </div>
                  <div className="tag-list">
                    <span className="meta-note">
                      {new Date(event.start).toLocaleDateString()} {" "}
                      {event.start.includes("T") && new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {event.htmlLink && (
                      <button
                        className="button"
                        type="button"
                        onClick={() => window.open(event.htmlLink, "_blank")}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unprocessed Captures */}
      {briefing.unprocessedCaptures.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Inbox</div>
              <h4>Captures Needing Review</h4>
            </div>
          </div>
          <div className="capture-log">
            {briefing.unprocessedCaptures.map((capture) => (
              <div className="capture-log__item" key={capture.id}>
                {capture.raw_text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Due Today */}
      {briefing.tasksDueToday?.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Tasks</div>
              <h4>Due Today</h4>
            </div>
          </div>
          <div className="capture-log">
            {briefing.tasksDueToday.map((task) => (
              <div className="capture-log__item" key={task.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{task.title}</span>
                  <div className="tag-list">
                    <span className={`status-tag ${task.priority}`}>{task.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      {briefing.overdueTasks?.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Tasks</div>
              <h4>Overdue</h4>
            </div>
          </div>
          <div className="capture-log">
            {briefing.overdueTasks.map((task) => (
              <div className="capture-log__item" key={task.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{task.title}</span>
                  <div className="tag-list">
                    <span className="meta-note">Due {task.due_date}</span>
                    <span className={`status-tag ${task.priority}`}>{task.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting / Routed */}
      {briefing.waitingCaptures.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Follow-ups</div>
              <h4>Waiting / Routed</h4>
            </div>
          </div>
          <div className="capture-log">
            {briefing.waitingCaptures.map((capture) => (
              <div className="capture-log__item" key={capture.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{capture.raw_text}</span>
                  <span className="status-tag neutral">{capture.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Obsidian Notes */}
      {briefing.recentNotes.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Knowledge</div>
              <h4>Recently Indexed Notes</h4>
            </div>
          </div>
          <div className="project-row-list">
            {briefing.recentNotes.map((note) => (
              <div className="project-row" key={note.id}>
                <div>
                  <strong>{note.title}</strong>
                  <p>{note.summary || "No preview available."}</p>
                </div>
                <button
                  className="button"
                  type="button"
                  onClick={() => openObsidian(note.source_path)}
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
