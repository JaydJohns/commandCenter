export default function SearchView({ query, onQueryChange, results, filteredKnowledge }) {
  return (
    <section className="split-layout">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Retrieval layer</div>
            <h4>Semantic search</h4>
          </div>
        </div>

        <label className="search-box">
          <span>Search query</span>
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Try: semantic search architecture"
          />
        </label>

        <div className="result-stack">
          {results.map((result) => (
            <article className="result-card" key={result.id}>
              <div className="result-card__top">
                <strong>{result.title}</strong>
                <span className="meta-note">{Math.round(result.confidence * 100)}% match</span>
              </div>
              <p>{result.summary}</p>
              <div className="tag-list">
                <span className="status-tag neutral">{result.source}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Matched documents</div>
            <h4>Knowledge hits</h4>
          </div>
        </div>
        <div className="mini-list">
          {filteredKnowledge.map((item) => (
            <div className="mini-list__item" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.excerpt}</p>
            </div>
          ))}
          {filteredKnowledge.length === 0 && (
            <div className="mini-list__empty">No mock documents matched this query.</div>
          )}
        </div>
      </div>
    </section>
  );
}
