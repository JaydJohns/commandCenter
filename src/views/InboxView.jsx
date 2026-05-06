import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function InboxView() {
  const [captures, setCaptures] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [classifyingId, setClassifyingId] = useState(null);

  const fetchCaptures = async () => {
    try {
      const res = await fetch(`${API}/captures`);
      const data = await res.json();
      setCaptures(data);
    } catch (err) {
      console.error("Failed to fetch captures", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptures();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/captures/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      await fetchCaptures();
    } catch (err) {
      console.error("Failed to update capture", err);
    }
  };

  const classifyWithAI = async (id) => {
    setClassifyingId(id);
    try {
      await fetch(`${API}/captures/${id}/classify`, { method: "POST" });
      await fetchCaptures();
    } catch (err) {
      console.error("Classification failed", err);
    } finally {
      setClassifyingId(null);
    }
  };

  const createTaskFromCapture = async (capture) => {
    try {
      await fetch(`${API}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: capture.raw_text,
          status: "open",
          priority: "medium"
        })
      });
      await fetch(`${API}/captures/${capture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "routed", destination: "tasks" })
      });
      await fetchCaptures();
    } catch (err) {
      console.error("Failed to create task from capture", err);
    }
  };

  const createObsidianNoteFromCapture = async (capture) => {
    try {
      const res = await fetch(`${API}/captures/${capture.id}/obsidian-note`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        console.error("Failed to create Obsidian note:", errData);
        return;
      }
      await fetchCaptures();
    } catch (err) {
      console.error("Failed to create Obsidian note from capture", err);
    }
  };

  const filtered = captures.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const statusOptions = ["unprocessed", "processed", "routed", "archived"];

  return (
    <section className="view-grid">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Inbox</div>
            <h4>Capture processing</h4>
          </div>
        </div>

        <div className="tag-list" style={{ marginBottom: "1rem" }}>
          {["all", ...statusOptions].map((s) => (
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

        {loading && <p>Loading captures...</p>}

        {!loading && filtered.length === 0 && <p>No captures match this filter.</p>}

        <div className="capture-log">
          {filtered.map((capture) => (
            <div className="capture-log__item" key={capture.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <span>{capture.raw_text}</span>
                  {capture.suggested_type && (
                    <div className="tag-list" style={{ marginTop: "0.5rem" }}>
                      <span className="status-tag neutral">{capture.suggested_type}</span>
                      {capture.suggested_area && <span className="tag">{capture.suggested_area}</span>}
                      {capture.suggested_tags && capture.suggested_tags.split(", ").map((t) => (
                        <span className="tag" key={t}>{t}</span>
                      ))}
                      {capture.confidence !== null && (
                        <span className="meta-note">{Math.round(capture.confidence * 100)}% confidence</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="tag-list" style={{ flexShrink: 0 }}>
                  <span className="status-tag neutral">{capture.status}</span>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => classifyWithAI(capture.id)}
                    disabled={classifyingId === capture.id}
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    {classifyingId === capture.id ? "Classifying..." : "AI Classify"}
                  </button>
                  {capture.status === "unprocessed" && (
                    <>
                      <button
                        className="tag"
                        type="button"
                        onClick={() => createTaskFromCapture(capture)}
                        style={{ cursor: "pointer" }}
                      >
                        Create Task
                      </button>
                      <button
                        className="tag"
                        type="button"
                        onClick={() => createObsidianNoteFromCapture(capture)}
                        style={{ cursor: "pointer" }}
                      >
                        Create Note
                      </button>
                    </>
                  )}
                  {statusOptions
                    .filter((s) => s !== capture.status)
                    .map((s) => (
                      <button
                        key={s}
                        className="tag"
                        type="button"
                        onClick={() => updateStatus(capture.id, s)}
                        style={{ cursor: "pointer" }}
                      >
                        {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
