import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function GoogleView() {
  const [status, setStatus] = useState({ configured: false, authenticated: false });
  const [taskLists, setTaskLists] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveFolders, setDriveFolders] = useState([]);
  const [driveSearch, setDriveSearch] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/google/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch Google status", err);
    }
  };

  const fetchTaskLists = async () => {
    try {
      const res = await fetch(`${API}/google/tasks/lists`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTaskLists(data);
      if (data.length > 0 && !selectedList) {
        setSelectedList(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch task lists", err);
    }
  };

  const fetchTasks = async () => {
    if (!selectedList) return;
    try {
      const res = await fetch(`${API}/google/tasks/${selectedList}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  useEffect(() => {
    fetchStatus().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status.authenticated) {
      fetchTaskLists();
      fetchDriveFiles();
      fetchDriveFolders();
    }
  }, [status.authenticated]);

  useEffect(() => {
    fetchTasks();
  }, [selectedList]);

  const connectGoogle = () => {
    window.location.href = `${API}/google/auth`;
  };

  const disconnectGoogle = async () => {
    try {
      await fetch(`${API}/google/disconnect`, { method: "POST" });
      setStatus({ ...status, authenticated: false });
      setTaskLists([]);
      setTasks([]);
      setSelectedList("");
    } catch (err) {
      console.error("Disconnect failed", err);
    }
  };

  const syncTasks = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${API}/google/sync`, { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
    } catch (err) {
      console.error("Sync failed", err);
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const fetchDriveFiles = async (q = "") => {
    try {
      const res = await fetch(`${API}/google/drive/files${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDriveFiles(data);
    } catch (err) {
      console.error("Failed to fetch Drive files", err);
    }
  };

  const fetchDriveFolders = async () => {
    try {
      const res = await fetch(`${API}/google/drive/folders`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDriveFolders(data);
    } catch (err) {
      console.error("Failed to fetch Drive folders", err);
    }
  };

  if (loading) {
    return (
      <section className="view-grid">
        <div className="card">
          <p>Loading Google integration...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="view-grid">
      {/* Header */}
      <div className="hero-card card">
        <div>
          <div className="eyebrow">Integration</div>
          <h3>Google Tasks & Calendar</h3>
          <p>Sync your Google Tasks and view upcoming Calendar events.</p>
        </div>
        <div className="hero-card__actions">
          {!status.configured && (
            <span className="meta-note">Google OAuth not configured</span>
          )}
          {status.configured && !status.authenticated && (
            <button className="button button--primary" type="button" onClick={connectGoogle}>
              Connect Google Account
            </button>
          )}
          {status.configured && status.authenticated && (
            <>
              <button className="button button--primary" type="button" onClick={syncTasks} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync Tasks to Command Center"}
              </button>
              <button className="button" type="button" onClick={disconnectGoogle}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sync result */}
      {syncResult && !syncResult.error && (
        <div className="card">
          <p>
            <strong>Sync complete:</strong>{" "}
            {syncResult.imported} task{syncResult.imported === 1 ? "" : "s"} imported into Command Center.
          </p>
        </div>
      )}
      {syncResult?.error && (
        <div className="card">
          <p style={{ color: "var(--danger, #ef4444)" }}>Sync failed: {syncResult.error}</p>
        </div>
      )}

      {/* Not configured */}
      {!status.configured && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Setup</div>
              <h4>Google OAuth Required</h4>
            </div>
          </div>
          <p>To connect Google Tasks and Calendar, you need to create OAuth credentials:</p>
          <ol style={{ lineHeight: "1.8", marginTop: "1rem" }}>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">Google Cloud Console</a></li>
            <li>Create a new project (or use existing)</li>
            <li>Enable <strong>Tasks API</strong>, <strong>Calendar API</strong>, and <strong>Drive API</strong></li>
            <li>Create OAuth 2.0 credentials (Desktop app or Web application)</li>
            <li>Add <code>http://localhost:3001/api/google/callback</code> as an authorized redirect URI</li>
            <li>Copy Client ID and Client Secret to <code>backend/.env</code></li>
          </ol>
        </div>
      )}

      {/* Task Lists */}
      {status.authenticated && taskLists.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Google Tasks</div>
              <h4>Task Lists</h4>
            </div>
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid var(--outline)",
                background: "var(--surface-2)",
                color: "var(--text)"
              }}
            >
              {taskLists.map((list) => (
                <option key={list.id} value={list.id}>{list.title}</option>
              ))}
            </select>
          </div>

          {tasks.length === 0 && <p>No tasks in this list.</p>}

          <div className="capture-log">
            {tasks.map((task) => (
              <div className="capture-log__item" key={task.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <span style={{
                    textDecoration: task.status === "completed" ? "line-through" : "none",
                    opacity: task.status === "completed" ? 0.6 : 1
                  }}>
                    {task.title}
                  </span>
                  <div className="tag-list">
                    {task.due && <span className="meta-note">Due {new Date(task.due).toLocaleDateString()}</span>}
                    <span className={`status-tag ${task.status === "completed" ? "completed" : "open"}`}>{task.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google Drive */}
      {status.authenticated && (
        <div className="card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Google Drive</div>
              <h4>Files & Folders</h4>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder="Search Drive..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDriveFiles(driveSearch);
                }}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--outline)",
                  background: "var(--surface-2)",
                  color: "var(--text)"
                }}
              />
              <button className="button" type="button" onClick={() => fetchDriveFiles(driveSearch)}>
                Search
              </button>
            </div>
          </div>

          {driveFolders.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div className="eyebrow" style={{ marginBottom: "0.5rem" }}>Folders</div>
              <div className="tag-list">
                {driveFolders.slice(0, 10).map((folder) => (
                  <span className="tag" key={folder.id}>
                    📁 {folder.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {driveFiles.length === 0 && <p>No files found.</p>}

          <div className="capture-log">
            {driveFiles.map((file) => (
              <div className="capture-log__item" key={file.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <strong>{file.name}</strong>
                    <div className="tag-list" style={{ marginTop: "0.25rem" }}>
                      <span className="meta-note">{file.mimeType?.replace("application/vnd.google-apps.", "") || file.mimeType}</span>
                      {file.modifiedTime && <span className="meta-note">Modified {new Date(file.modifiedTime).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {file.webViewLink && (
                    <button
                      className="button"
                      type="button"
                      onClick={() => window.open(file.webViewLink, "_blank")}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
