import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchTasks = async () => {
    try {
      const url = filter === "all" ? `${API}/tasks` : `${API}/tasks?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API}/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchProjects()]).finally(() => setLoading(false));
  }, [filter]);

  const createTask = async () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    try {
      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          project_id: newTaskProject || null,
          priority: newTaskPriority,
          due_date: newTaskDue || null,
          status: "open"
        })
      });
      setNewTaskTitle("");
      setNewTaskProject("");
      setNewTaskPriority("medium");
      setNewTaskDue("");
      await fetchTasks();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === "completed" ? "open" : "completed";
    try {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchTasks();
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
      await fetchTasks();
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const projectName = (id) => projects.find((p) => p.id === id)?.name || "";

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      project_id: task.project_id || "",
      priority: task.priority,
      due_date: task.due_date || "",
      status: task.status
    });
  };

  const saveEdit = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          project_id: editForm.project_id || null,
          priority: editForm.priority,
          due_date: editForm.due_date || null,
          status: editForm.status
        })
      });
      setEditingId(null);
      await fetchTasks();
    } catch (err) {
      console.error("Failed to save task", err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const statusOptions = ["all", "open", "completed", "waiting", "deferred"];

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--outline)",
    background: "var(--surface-2)",
    color: "var(--text)"
  };

  return (
    <section className="view-grid">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Tasks</div>
            <h4>Task Manager</h4>
          </div>
        </div>

        {/* Create new task */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task..."
            onKeyDown={(e) => { if (e.key === "Enter") createTask(); }}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--outline)",
              background: "var(--surface-2)",
              color: "var(--text)",
              flex: 1,
              minWidth: "200px"
            }}
          />
          <select
            value={newTaskProject}
            onChange={(e) => setNewTaskProject(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--outline)",
              background: "var(--surface-2)",
              color: "var(--text)"
            }}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--outline)",
              background: "var(--surface-2)",
              color: "var(--text)"
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            value={newTaskDue}
            onChange={(e) => setNewTaskDue(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--outline)",
              background: "var(--surface-2)",
              color: "var(--text)"
            }}
          />
          <button className="button button--primary" type="button" onClick={createTask}>
            Add
          </button>
        </div>

        {/* Filters */}
        <div className="tag-list" style={{ marginBottom: "1rem" }}>
          {statusOptions.map((s) => (
            <button
              key={s}
              className={`tag ${filter === s ? "status-tag" : ""}`}
              type="button"
              onClick={() => setFilter(s)}
              style={{ cursor: "pointer" }}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && <p>Loading tasks...</p>}
        {!loading && tasks.length === 0 && <p>No tasks found.</p>}

        <div className="capture-log">
          {tasks.map((task) => (
            <div className="capture-log__item" key={task.id}>
              {editingId === task.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
                    />
                    <select
                      value={editForm.project_id}
                      onChange={(e) => setEditForm((f) => ({ ...f, project_id: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input
                      type="date"
                      value={editForm.due_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                      style={inputStyle}
                    />
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="open">open</option>
                      <option value="completed">completed</option>
                      <option value="waiting">waiting</option>
                      <option value="deferred">deferred</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="button button--primary" type="button" onClick={() => saveEdit(task.id)}>
                      Save
                    </button>
                    <button className="button" type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => toggleComplete(task)}
                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                    />
                    <span style={{
                      textDecoration: task.status === "completed" ? "line-through" : "none",
                      opacity: task.status === "completed" ? 0.6 : 1
                    }}>
                      {task.title}
                    </span>
                  </div>
                  <div className="tag-list" style={{ flexShrink: 0 }}>
                    {task.project_id && (
                      <span className="tag">{projectName(task.project_id)}</span>
                    )}
                    <span className={`status-tag ${task.priority}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className="meta-note">Due {task.due_date}</span>
                    )}
                    <span className={`status-tag ${task.status}`}>{task.status}</span>
                    <button
                      className="tag"
                      type="button"
                      onClick={() => startEdit(task)}
                      style={{ cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      className="tag"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      style={{ cursor: "pointer", color: "var(--danger, #ef4444)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
