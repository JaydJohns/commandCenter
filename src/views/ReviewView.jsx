import { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const PERIODS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" }
];

export default function ReviewView() {
  const [period, setPeriod] = useState("weekly");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchReview = async (p) => {
    setLoading(true);
    setInsights("");
    try {
      const res = await fetch(`${API}/review/${p}`);
      const data = await res.json();
      setReview(data);
    } catch (err) {
      console.error("Failed to fetch review", err);
      setReview(null);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`${API}/review/${period}/ai-insights`, { method: "POST" });
      const data = await res.json();
      setInsights(data.insights || "No insights generated.");
    } catch (err) {
      console.error("Failed to generate insights", err);
      setInsights("Failed to generate insights.");
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchReview(period);
  }, [period]);

  const captureStatusColor = (status) => {
    switch (status) {
      case "unprocessed": return "neutral";
      case "processed": return "active";
      case "routed": return "waiting";
      case "archived": return "completed";
      default: return "neutral";
    }
  };

  if (loading) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Loading {PERIODS.find((p) => p.key === period)?.label.toLowerCase()} review...</p>
        </div>
      </section>
    );
  }

  if (!review) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Failed to load review.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="view-grid">
      {/* Header */}
      <div className="hero-card card">
        <div>
          <div className="eyebrow">{review.periodLabel} Review</div>
          <h3>{review.date}</h3>
          <p>Reviewing activity from {review.since} to today.</p>
        </div>
        <div className="hero-card__actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`button ${period === p.key ? "button--primary" : ""}`}
              type="button"
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
          <button className="button button--primary" type="button" onClick={() => fetchReview(period)}>
            Refresh
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">AI Assistant</div>
            <h4>{review.periodLabel} Insights</h4>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={generateInsights}
            disabled={insightsLoading}
          >
            {insightsLoading ? "Generating..." : "Generate Insights"}
          </button>
        </div>
        {insights && (
          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "8px",
              background: "var(--surface-2)",
              border: "1px solid var(--outline)"
            }}
          >
            {insights}
          </div>
        )}
        {!insights && !insightsLoading && (
          <p className="meta-note">Click "Generate Insights" to get AI-powered analysis of your {review.periodLabel.toLowerCase()}.</p>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <MetricCard
          label={`Captures this ${review.periodLabel.toLowerCase()}`}
          value={String(review.stats.totalCapturesPeriod).padStart(2, "0")}
          detail={`${review.stats.unprocessedCaptures} unprocessed`}
        />
        <MetricCard
          label="Open tasks"
          value={String(review.stats.totalOpenTasks).padStart(2, "0")}
          detail={`${review.stats.staleTasks} need attention`}
        />
        <MetricCard
          label="Completed tasks"
          value={String(review.stats.completedTasks).padStart(2, "0")}
          detail={`this ${review.periodLabel.toLowerCase()}`}
        />
        <MetricCard
          label="Active projects"
          value={String(review.stats.activeProjects).padStart(2, "0")}
          detail={`${review.stats.blockedProjects} blocked`}
        />
        <MetricCard
          label="Need review"
          value={String(review.stats.projectsNeedingReview).padStart(2, "0")}
          detail="projects flagged"
        />
        <MetricCard
          label="Notes indexed"
          value={String(review.stats.recentNotes).padStart(2, "0")}
          detail={`of ${review.stats.totalNotes} total`}
        />
      </div>

      {/* Recent Captures */}
      {review.recentCaptures.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Inbox</div>
              <h4>Captures This {review.periodLabel}</h4>
            </div>
          </div>
          <div className="capture-log">
            {review.recentCaptures.map((capture) => (
              <div className="capture-log__item" key={capture.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <span style={{ flex: 1 }}>{capture.raw_text}</span>
                  <span className={`status-tag ${captureStatusColor(capture.status)}`}>{capture.status}</span>
                </div>
                {capture.suggested_type && (
                  <div className="tag-list" style={{ marginTop: "0.5rem" }}>
                    <span className="status-tag neutral">{capture.suggested_type}</span>
                    {capture.suggested_area && <span className="tag">{capture.suggested_area}</span>}
                    {capture.suggested_tags && capture.suggested_tags.split(", ").map((t) => (
                      <span className="tag" key={t}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {review.completedTasks.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Wins</div>
              <h4>Completed Tasks</h4>
            </div>
          </div>
          <div className="capture-log">
            {review.completedTasks.map((task) => (
              <div className="capture-log__item" key={task.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{task.title}</span>
                  <div className="tag-list">
                    <span className="status-tag completed">completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stale Tasks */}
      {review.staleTasks.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Tasks</div>
              <h4>Stale / Overdue Tasks</h4>
            </div>
          </div>
          <div className="capture-log">
            {review.staleTasks.map((task) => (
              <div className="capture-log__item" key={task.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{task.title}</span>
                  <div className="tag-list">
                    {task.due_date && (
                      <span className="meta-note">Due {task.due_date}</span>
                    )}
                    {!task.due_date && (
                      <span className="meta-note">No due date</span>
                    )}
                    <span className={`status-tag ${task.priority}`}>{task.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Needing Review */}
      {review.projectsNeedingReview.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Projects</div>
              <h4>Projects Needing Review</h4>
            </div>
          </div>
          <div className="project-row-list">
            {review.projectsNeedingReview.map((project) => (
              <div className="project-row" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <p>{project.summary || "No summary available."}</p>
                  <div className="tag-list" style={{ marginTop: "0.25rem" }}>
                    <span className="meta-note">{project.progress}% complete</span>
                    {project.due && <span className="meta-note">Due {project.due}</span>}
                    <span className={`status-tag ${project.status?.toLowerCase()}`}>{project.status}</span>
                  </div>
                </div>
                <div className="progress-bar" style={{ width: "120px", flexShrink: 0 }}>
                  <span style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Processed */}
      {review.recentlyProcessed.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Processed</div>
              <h4>Recently Processed Captures</h4>
            </div>
          </div>
          <div className="capture-log">
            {review.recentlyProcessed.map((capture) => (
              <div className="capture-log__item" key={capture.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{capture.raw_text}</span>
                  <span className={`status-tag ${captureStatusColor(capture.status)}`}>{capture.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notes */}
      {review.recentNotes.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Knowledge</div>
              <h4>Recently Indexed Notes</h4>
            </div>
          </div>
          <div className="mini-list">
            {review.recentNotes.map((note) => (
              <div className="mini-list__item" key={note.id}>
                <strong>{note.title}</strong>
                <p>{note.summary || "No preview available."}</p>
                <div className="tag-list" style={{ marginTop: "0.25rem" }}>
                  {Array.isArray(note.tags) && note.tags.map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
