import { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function WeeklyReviewView() {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReview = async () => {
    try {
      const res = await fetch(`${API}/review/weekly`);
      const data = await res.json();
      setReview(data);
    } catch (err) {
      console.error("Failed to fetch weekly review", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, []);

  if (loading) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Loading weekly review...</p>
        </div>
      </section>
    );
  }

  if (!review) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Failed to load weekly review.</p>
        </div>
      </section>
    );
  }

  const captureStatusColor = (status) => {
    switch (status) {
      case "unprocessed": return "neutral";
      case "processed": return "active";
      case "routed": return "waiting";
      case "archived": return "completed";
      default: return "neutral";
    }
  };

  return (
    <section className="view-grid">
      {/* Header */}
      <div className="hero-card card">
        <div>
          <div className="eyebrow">Weekly Review</div>
          <h3>{review.date}</h3>
          <p>Review captures, tasks, and projects from {review.weekStart} to today.</p>
        </div>
        <div className="hero-card__actions">
          <button className="button button--primary" type="button" onClick={fetchReview}>
            Refresh Review
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <MetricCard
          label="Captures this week"
          value={String(review.stats.totalCapturesWeek).padStart(2, "0")}
          detail={`${review.stats.unprocessedCaptures} unprocessed`}
        />
        <MetricCard
          label="Open tasks"
          value={String(review.stats.totalOpenTasks).padStart(2, "0")}
          detail={`${review.stats.staleTasks} need attention`}
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
      </div>

      {/* Recent Captures */}
      {review.recentCaptures.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Inbox</div>
              <h4>Captures This Week</h4>
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
    </section>
  );
}
