import { useEffect, useState } from "react";
import DetailStat from "../components/DetailStat";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const LIFE_AREAS = [
  "Home & DIY",
  "Relationships",
  "Olde Oak Tree",
  "Finance",
  "PFW Campus Service",
  "Learning & Development",
  "UX Research Lab",
  "LLM Experiments",
  "PFW Teaching",
  "Bellon Branch",
  "General"
];

export default function ProjectsView() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", owner: "", status: "Active", due: "", summary: "", area: "General", customArea: "" });
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ name: "", owner: "", status: "Active", due: "", summary: "", area: "General", customArea: "", progress: 0, health: "" });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({});
  const [addingSubtaskTo, setAddingSubtaskTo] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

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

  const fetchTasks = async (projectId) => {
    try {
      const res = await fetch(`${API}/tasks?project_id=${projectId}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchTasks(selectedProjectId);
  }, [selectedProjectId]);

  const createProject = async () => {
    const trimmed = newProject.name.trim();
    if (!trimmed) return;
    
    const finalArea = (newProject.area === "custom" ? newProject.customArea?.trim() : newProject.area) || "General";
    
    try {
      const res = await fetch(`${API}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          owner: newProject.owner || null,
          status: newProject.status || "Active",
          due: newProject.due || null,
          summary: newProject.summary || null,
          area: finalArea
        })
      });
      const data = await res.json();
      setProjects((prev) => [...prev, data]);
      setSelectedProjectId(data.id);
      setNewProject({ name: "", owner: "", status: "Active", due: "", summary: "", area: "General", customArea: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const startEditProject = (project) => {
    setEditingProjectId(project.id);
    setEditProjectForm({
      name: project.name || "",
      owner: project.owner || "",
      status: project.status || "Active",
      due: project.due || "",
      summary: project.summary || "",
      area: project.area || "General",
      customArea: "",
      progress: project.progress || 0,
      health: project.health || ""
    });
  };

  const cancelEditProject = () => {
    setEditingProjectId(null);
  };

  const createTask = async () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed || !selectedProjectId) return;

    try {
      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          project_id: selectedProjectId,
          priority: "medium",
          status: "open"
        })
      });
      setNewTaskTitle("");
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const toggleCompleteTask = async (task) => {
    const newStatus = task.status === "completed" ? "open" : "completed";
    try {
      await fetch(`${API}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTaskForm({
      title: task.title,
      project_id: task.project_id || "",
      priority: task.priority,
      due_date: task.due_date || "",
      status: task.status,
      notes: task.notes || ""
    });
  };

  const saveEditTask = async (id) => {
    try {
      await fetch(`${API}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTaskForm.title.trim(),
          project_id: editTaskForm.project_id || null,
          priority: editTaskForm.priority,
          due_date: editTaskForm.due_date || null,
          status: editTaskForm.status,
          notes: editTaskForm.notes || null
        })
      });
      setEditingTaskId(null);
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error("Failed to save task", err);
    }
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskForm({});
  };

  const createSubtask = async (parentId, projectId) => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    try {
      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          project_id: projectId || null,
          parent_id: parentId,
          priority: "medium",
          due_date: null,
          status: "open"
        })
      });
      setNewSubtaskTitle("");
      setAddingSubtaskTo(null);
      fetchTasks(selectedProjectId);
    } catch (err) {
      console.error("Failed to create subtask", err);
    }
  };

  const saveEditProject = async (id) => {
    const trimmed = editProjectForm.name.trim();
    if (!trimmed) return;
    
    const finalArea = (editProjectForm.area === "custom" ? editProjectForm.customArea?.trim() : editProjectForm.area) || "General";
    
    try {
      const res = await fetch(`${API}/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          owner: editProjectForm.owner || null,
          status: editProjectForm.status || "Active",
          due: editProjectForm.due || null,
          summary: editProjectForm.summary || null,
          area: finalArea,
          progress: parseInt(editProjectForm.progress, 10) || 0,
          health: editProjectForm.health || null
        })
      });
      const updatedProject = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)));
      setEditingProjectId(null);
    } catch (err) {
      console.error("Failed to update project", err);
    }
  };

  const inputStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--outline)",
    background: "var(--surface-2)",
    color: "var(--text)"
  };

  const getSubtasks = (parentId) => tasks.filter(t => t.parent_id === parentId);

  const renderTask = (task, depth = 0) => {
    const subtasks = getSubtasks(task.id);
    
    return (
      <div className="capture-log__item" key={task.id} style={{ marginLeft: depth > 0 ? "2rem" : "0", borderLeft: depth > 0 ? "2px solid var(--outline)" : "none", paddingLeft: depth > 0 ? "1rem" : "1.25rem" }}>
        {editingTaskId === task.id ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                value={editTaskForm.title}
                onChange={(e) => setEditTaskForm((f) => ({ ...f, title: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
              />
              <select
                value={editTaskForm.project_id}
                onChange={(e) => setEditTaskForm((f) => ({ ...f, project_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={editTaskForm.priority}
                onChange={(e) => setEditTaskForm((f) => ({ ...f, priority: e.target.value }))}
                style={inputStyle}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                value={editTaskForm.due_date}
                onChange={(e) => setEditTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                style={inputStyle}
              />
              <select
                value={editTaskForm.status}
                onChange={(e) => setEditTaskForm((f) => ({ ...f, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="open">open</option>
                <option value="completed">completed</option>
                <option value="waiting">waiting</option>
                <option value="deferred">deferred</option>
              </select>
            </div>
            <textarea
              placeholder="Notes..."
              value={editTaskForm.notes || ""}
              onChange={(e) => setEditTaskForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: "vertical", width: "100%" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="button button--primary" type="button" onClick={() => saveEditTask(task.id)}>
                Save
              </button>
              <button className="button" type="button" onClick={cancelEditTask}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => toggleCompleteTask(task)}
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
                <span className={`status-tag ${task.priority}`}>{task.priority}</span>
                {task.due_date && (
                  <span className="meta-note">Due {task.due_date}</span>
                )}
                <span className={`status-tag ${task.status}`}>{task.status}</span>
                <button
                  className="tag"
                  type="button"
                  onClick={() => setAddingSubtaskTo(task.id)}
                  style={{ cursor: "pointer" }}
                >
                  + Sub-task
                </button>
                <button
                  className="tag"
                  type="button"
                  onClick={() => startEditTask(task)}
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
            {task.notes && (
              <div style={{ paddingLeft: "1.75rem", color: "var(--text-muted)", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                {task.notes}
              </div>
            )}
          </div>
        )}

        {/* Render subtasks */}
        {subtasks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            {subtasks.map(st => renderTask(st, depth + 1))}
          </div>
        )}

        {/* Add subtask form */}
        {addingSubtaskTo === task.id && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", marginLeft: "2rem" }}>
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="New sub-task..."
              onKeyDown={(e) => { if (e.key === "Enter") createSubtask(task.id, task.project_id); }}
              style={{ ...inputStyle, flex: 1 }}
              autoFocus
            />
            <button className="button button--primary" type="button" onClick={() => createSubtask(task.id, task.project_id)}>
              Add
            </button>
            <button className="button" type="button" onClick={() => { setAddingSubtaskTo(null); setNewSubtaskTitle(""); }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const allAreas = Array.from(new Set([
    ...LIFE_AREAS,
    ...projects.map(p => p.area).filter(Boolean)
  ]));

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
              <select
                value={newProject.area}
                onChange={(e) => setNewProject((p) => ({ ...p, area: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              >
                {allAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
                <option value="custom">+ Add new area...</option>
              </select>
              {newProject.area === "custom" && (
                <input
                  type="text"
                  placeholder="New area name"
                  value={newProject.customArea}
                  onChange={(e) => setNewProject((p) => ({ ...p, customArea: e.target.value }))}
                  style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
                />
              )}
              <input
                type="date"
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
          {allAreas.map(area => {
            const areaProjects = projects.filter(p => (p.area || "General") === area);
            if (areaProjects.length === 0) return null;

            return (
              <div key={area} style={{ marginBottom: "1.5rem" }}>
                <div style={{ padding: "0 0.5rem", marginBottom: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {area}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {areaProjects.map((project) => (
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
            );
          })}
        </div>
      </div>

      <div className="card detail-card">
        {editingProjectId === selectedProject?.id ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="section-heading">
              <div className="eyebrow">Edit Project</div>
            </div>
            <input
              type="text"
              placeholder="Project name"
              value={editProjectForm.name}
              onChange={(e) => setEditProjectForm((p) => ({ ...p, name: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Owner"
                value={editProjectForm.owner}
                onChange={(e) => setEditProjectForm((p) => ({ ...p, owner: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
              <select
                value={editProjectForm.status}
                onChange={(e) => setEditProjectForm((p) => ({ ...p, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
              <select
                value={editProjectForm.area}
                onChange={(e) => setEditProjectForm((p) => ({ ...p, area: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              >
                {allAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
                <option value="custom">+ Add new area...</option>
              </select>
              {editProjectForm.area === "custom" && (
                <input
                  type="text"
                  placeholder="New area name"
                  value={editProjectForm.customArea}
                  onChange={(e) => setEditProjectForm((p) => ({ ...p, customArea: e.target.value }))}
                  style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
                />
              )}
              <input
                type="date"
                placeholder="Due date"
                value={editProjectForm.due}
                onChange={(e) => setEditProjectForm((p) => ({ ...p, due: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Health (e.g. On track)"
                value={editProjectForm.health}
                onChange={(e) => setEditProjectForm((p) => ({ ...p, health: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: "120px" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "120px", background: "var(--surface-2)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--outline)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Progress %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editProjectForm.progress}
                  onChange={(e) => setEditProjectForm((p) => ({ ...p, progress: e.target.value }))}
                  style={{ background: "transparent", border: "none", color: "var(--text)", width: "100%", outline: "none" }}
                />
              </div>
            </div>
            <textarea
              placeholder="Summary"
              value={editProjectForm.summary}
              onChange={(e) => setEditProjectForm((p) => ({ ...p, summary: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button className="button button--primary" type="button" onClick={() => saveEditProject(selectedProject.id)}>
                Save Changes
              </button>
              <button className="button" type="button" onClick={cancelEditProject}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <div className="eyebrow">Selected initiative</div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <h4>{selectedProject?.name}</h4>
                  <button className="tag" type="button" onClick={() => startEditProject(selectedProject)} style={{ cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
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
          </>
        )}

        {/* Tasks */}
        <div style={{ marginTop: "1.5rem" }}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">Tasks</div>
              <h4>Open Tasks</h4>
            </div>
          </div>
          
          {/* Create new task */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New task for this project..."
              onKeyDown={(e) => { if (e.key === "Enter") createTask(); }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button className="button button--primary" type="button" onClick={createTask}>
              Add Task
            </button>
          </div>

          {tasks.length === 0 && <p>No tasks for this project.</p>}
          <div className="capture-log">
            {tasks.filter(t => !t.parent_id).map((task) => renderTask(task))}
          </div>
        </div>
      </div>
    </section>
  );
}
