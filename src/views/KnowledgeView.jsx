import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function KnowledgeView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [indexing, setIndexing] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/knowledge`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch knowledge items", err);
    } finally {
      setLoading(false);
    }
  };

  const searchItems = async () => {
    if (!query.trim()) {
      await fetchItems();
      return;
    }
    try {
      const res = await fetch(`${API}/knowledge/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const reindex = async () => {
    setIndexing(true);
    try {
      await fetch(`${API}/knowledge/index`, { method: "POST" });
      await fetchItems();
    } catch (err) {
      console.error("Indexing failed", err);
    } finally {
      setIndexing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openObsidian = (path) => {
    const vaultName = "Life%20Organizer";
    const encodedPath = encodeURIComponent(path);
    window.open(`obsidian://open?vault=${vaultName}&file=${encodedPath}`, "_blank");
  };

  return (
    <section className="view-grid">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Knowledge Base</div>
            <h4>Indexed Obsidian Notes</h4>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              onKeyDown={(e) => {
                if (e.key === "Enter") searchItems();
              }}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--outline)",
                background: "var(--surface-2)",
                color: "var(--text)"
              }}
            />
            <button className="button" type="button" onClick={searchItems}>
              Search
            </button>
            <button className="button" type="button" onClick={reindex} disabled={indexing}>
              {indexing ? "Indexing..." : "Re-index"}
            </button>
          </div>
        </div>

        {loading && <p>Loading knowledge base...</p>}

        {!loading && items.length === 0 && (
          <p>No notes indexed yet. Click Re-index to scan your Obsidian vault.</p>
        )}

        <div className="knowledge-grid">
          {items.map((item) => (
            <article className="card knowledge-card" key={item.id}>
              <div className="knowledge-card__top">
                <div>
                  <div className="eyebrow">{item.source || "Obsidian"}</div>
                  <h4>{item.title}</h4>
                </div>
                <span className="meta-note">{item.last_indexed ? new Date(item.last_indexed).toLocaleDateString() : ""}</span>
              </div>
              <p>{item.summary || "No preview available."}</p>
              <div className="tag-list">
                {Array.isArray(item.tags) && item.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  className="button"
                  type="button"
                  onClick={() => openObsidian(item.source_path)}
                >
                  Open in Obsidian
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
