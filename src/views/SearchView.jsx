import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const runSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/search/semantic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), limit: 20 })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Semantic search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => runSearch(value), 400);
    setDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceTimer) clearTimeout(debounceTimer);
    runSearch(query);
  };

  const knowledgeHits = results.filter((r) => r.source_type === "knowledge_item");
  const captureHits = results.filter((r) => r.source_type === "capture");

  return (
    <section className="split-layout">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Retrieval layer</div>
            <h4>Semantic search</h4>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="search-box">
            <span>Search query</span>
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Try: semantic search architecture"
            />
          </label>
        </form>

        {loading && <p style={{ marginTop: "1rem" }}>Searching...</p>}

        {!loading && results.length > 0 && (
          <div className="result-stack" style={{ marginTop: "1rem" }}>
            {results.map((result) => (
              <article className="result-card" key={`${result.source_type}-${result.source_id}`}>
                <div className="result-card__top">
                  <strong>{result.title || "Untitled"}</strong>
                  <span className="meta-note">{Math.round(result.similarity * 100)}% match</span>
                </div>
                <p>{result.summary}</p>
                <div className="tag-list">
                  <span className="status-tag neutral">{result.source_type}</span>
                  {result.tags && typeof result.tags === "string" && result.tags.split(", ").map((t) => (
                    <span className="tag" key={t}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <p style={{ marginTop: "1rem" }}>No results found.</p>
        )}
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Matched documents</div>
            <h4>Knowledge hits</h4>
          </div>
        </div>
        <div className="mini-list">
          {knowledgeHits.map((item) => (
            <div className="mini-list__item" key={`${item.source_type}-${item.source_id}`}>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <div className="tag-list" style={{ marginTop: "0.25rem" }}>
                {item.tags && typeof item.tags === "string" && item.tags.split(", ").map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
            </div>
          ))}
          {knowledgeHits.length === 0 && (
            <div className="mini-list__empty">No documents matched this query.</div>
          )}
        </div>
      </div>
    </section>
  );
}
