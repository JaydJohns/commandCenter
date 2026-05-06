import { useEffect, useState } from "react";
import DetailStat from "../components/DetailStat";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function ProjectsView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", owner: "", status: "Active", due: "", summary: "" });

  useEffect(() => {
    fetch(`${API}/projects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch projects", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetch(`${API}/tasks?project_id=${selectedProjectId}`)
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Failed to fetch tasks", err));
  }, [selectedProjectId]);

  const createProject = async () => {
    const trimmed = newProject.name.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          owner: newProject.owner || null,
          status: newProject.status || "Active",
          due: newProject.due || null,
          summary: newProject.summary || null
        })
      });
      const data = await res.json();
      setProjects((prev) => [...prev, data]);
      setSelectedProjectId(data.id);
      setNewProject({ name: "", owner: "", status: "Active", due: "", summary: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--outline)",
    background: "var(--surface-2)",
    color: "var(--text)"
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  if (loading) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Loading projects...</p>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>No projects yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="split-layout">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Program board</div>
            <h4>Projects</h4>
          </div>
          <button className="button button--primary" type="button" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "New Project"}
          </button>
        </div>

        {showForm && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Project name"
              value={newProject.name}
              onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Owner"
                value={newProject.owner}
                onChange={(e) => setNewProject((p) => ({ ...p, owner: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
              <select
                value={newProject.status}
                onChange={(e) => setNewProject((p) => ({ ...p, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
              <input
                type="text"
                placeholder="Due date"
                value={newProject.due}
                onChange={(e) => setNewProject((p) => ({ ...p, due: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
            </div>
            <textarea
              placeholder="Summary"
              value={newProject.summary}
              onChange={(e) => setNewProject((p) => ({ ...p, summary: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <button className="button button--primary" type="button" onClick={createProject}>
              Create Project
            </button>
          </div>
        )}

        <div className="project-stack">
          {projects.map((project) => (
            <button
              key={project.id}
              className={`project-list-card ${project.id === selectedProject?.id ? "selected" : ""}`}
              type="button"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <div className="project-list-card__top">
                <strong>{project.name}</strong>
                <span className={`status-tag ${project.status?.toLowerCase()}`}>{project.status}</span>
              </div>
              <p>{project.summary}</p>
              <div className="progress-bar">
                <span style={{ width: `${project.progress}%` }} />
              </div>
              <div className="project-list-card__meta">
                <span>{project.progress}% complete</span>
                <span>Due {project.due}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card detail-card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Selected initiative</div>
            <h4>{selectedProject?.name}</h4>
          </div>
          <div className={`status-tag ${selectedProject?.status?.toLowerCase()}`}>{selectedProject?.status}</div>
        </div>

        <div className="detail-grid">
          <DetailStat label="Owner" value={selectedProject?.owner} />
          <DetailStat label="Health" value={selectedProject?.health} />
          <DetailStat label="Due date" value={selectedProject?.due} />
          <DetailStat label="Progress" value={`${selectedProject?.progress}%`} />
        </div>

        <p className="detail-summary">{selectedProject?.summary}</p>

        <div className="milestone-list">
          {selectedProject?.milestones?.map((milestone) => (
            <div className="milestone-item" key={milestone.name}>
              <span className={`milestone-dot ${milestone.done ? "done" : ""}`} />
              <div>
                <strong>{milestone.name}</strong>
                <p>{milestone.done ? "Completed in the current prototype flow." : "Still needs implementation or a product decision."}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div style={{ marginTop: "1.5rem" }}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">Tasks</div>
              <h4>Open Tasks</h4>
            </div>
          </div>
          {tasks.length === 0 && <p>No tasks for this project.</p>}
          <div className="capture-log">
            {tasks.map((task) => (
              <div className="capture-log__item" key={task.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{
                    textDecoration: task.status === "completed" ? "line-through" : "none",
                    opacity: task.status === "completed" ? 0.6 : 1
                  }}>
                    {task.title}
                  </span>
                  <div className="tag-list">
                    {task.due_date && <span className="meta-note">Due {task.due_date}</span>}
                    <span className={`status-tag ${task.priority}`}>{task.priority}</span>
                    <span className="status-tag neutral">{task.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
