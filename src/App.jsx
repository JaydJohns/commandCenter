import { useMemo, useState } from "react";

const navigation = [
  { id: "dashboard", label: "Dashboard", eyebrow: "Control" },
  { id: "projects", label: "Projects", eyebrow: "Delivery" },
  { id: "knowledge", label: "Knowledge Base", eyebrow: "Archive" },
  { id: "search", label: "Semantic Search", eyebrow: "Discover" },
  { id: "settings", label: "Settings", eyebrow: "System" }
];

const quickTemplates = [
  "Follow up with platform team about ingestion blockers",
  "Save article summary to knowledge base",
  "Outline new course module on prompt engineering"
];

const projects = [
  {
    id: 1,
    name: "Command Center MVP",
    owner: "Jordan",
    status: "Active",
    health: "On track",
    progress: 72,
    due: "Apr 12",
    summary: "Convert Stitch concepts into a navigable internal prototype.",
    milestones: [
      { name: "Prototype shell", done: true },
      { name: "Mock data flows", done: true },
      { name: "Search interactions", done: false }
    ]
  },
  {
    id: 2,
    name: "Knowledge Ingestion Pipeline",
    owner: "Rae",
    status: "Blocked",
    health: "Needs decision",
    progress: 46,
    due: "Apr 19",
    summary: "Normalize source metadata and prepare document summaries for search.",
    milestones: [
      { name: "Source schema review", done: true },
      { name: "Chunking strategy", done: false },
      { name: "Embeddings experiment", done: false }
    ]
  },
  {
    id: 3,
    name: "Course Builder Alpha",
    owner: "Sam",
    status: "Planned",
    health: "Queued",
    progress: 18,
    due: "May 02",
    summary: "Package curriculum authoring into a guided production workflow.",
    milestones: [
      { name: "Template inventory", done: true },
      { name: "Assessment flow", done: false },
      { name: "Analytics surface", done: false }
    ]
  }
];

const knowledgeItems = [
  {
    id: 1,
    title: "Semantic retrieval architecture",
    type: "Design note",
    collection: "Knowledge Base",
    updated: "2h ago",
    tags: ["search", "retrieval", "system design"],
    excerpt: "Hybrid lexical and embedding search gave the cleanest recall for cross-domain notes."
  },
  {
    id: 2,
    title: "Command Center implementation plan",
    type: "Plan",
    collection: "Projects",
    updated: "Yesterday",
    tags: ["roadmap", "mvp"],
    excerpt: "The prototype should center on capture, projects, retrieval, and configuration before advanced modules."
  },
  {
    id: 3,
    title: "Prompt engineering course outline",
    type: "Curriculum",
    collection: "Course Builder",
    updated: "3d ago",
    tags: ["education", "curriculum"],
    excerpt: "Draft lesson sequence covering instruction, examples, evaluation, and revision loops."
  },
  {
    id: 4,
    title: "Home maintenance seasonal checklist",
    type: "Operational note",
    collection: "Life Log",
    updated: "5d ago",
    tags: ["home", "routine"],
    excerpt: "Spring tasks can become a small recurring board once the general workflow is stable."
  }
];

const searchResults = [
  {
    id: 1,
    title: "Retrieval system notes",
    source: "Knowledge Base",
    confidence: 0.92,
    summary: "Direct match to semantic search architecture, ranking layers, and ingestion constraints."
  },
  {
    id: 2,
    title: "Implementation roadmap",
    source: "Projects",
    confidence: 0.84,
    summary: "MVP feature prioritization mentions search, project control, and quick capture."
  },
  {
    id: 3,
    title: "Course analytics dashboard",
    source: "Course Builder",
    confidence: 0.61,
    summary: "Related because it surfaces learner insights and summary cards using similar patterns."
  }
];

const settingsGroups = [
  {
    title: "Workspace profile",
    items: [
      { label: "Workspace name", value: "Command Center" },
      { label: "Primary mode", value: "Prototype" },
      { label: "Timezone", value: "America/Indiana/Indianapolis" }
    ]
  },
  {
    title: "Connected systems",
    items: [
      { label: "Knowledge ingestion", value: "Configured for mock data" },
      { label: "Search index", value: "Local prototype only" },
      { label: "Notifications", value: "Digest at 9:00 AM" }
    ]
  }
];

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const [captureValue, setCaptureValue] = useState("");
  const [entries, setEntries] = useState([
    "Prototype launch checklist created",
    "Imported Stitch concepts into React MVP",
    "Need final decision on search result ranking"
  ]);
  const [query, setQuery] = useState("semantic search architecture");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [selectedProjectId]
  );

  const filteredKnowledge = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return knowledgeItems;
    }

    return knowledgeItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalized) ||
        item.excerpt.toLowerCase().includes(normalized) ||
        item.tags.join(" ").toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  const saveCapture = () => {
    const trimmed = captureValue.trim();
    if (!trimmed) {
      return;
    }

    setEntries((current) => [trimmed, ...current].slice(0, 6));
    setCaptureValue("");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="eyebrow">Prototype Build</div>
          <h1>Command Center</h1>
          <p>From Stitch concepts to a working React prototype with shared UI and mock workflows.</p>
        </div>

        <nav className="nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav__item ${item.id === activeView ? "is-active" : ""}`}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span className="nav__eyebrow">{item.eyebrow}</span>
              <span className="nav__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <section className="sidebar__panel">
          <div className="sidebar__panel-title">Quick templates</div>
          <div className="template-list">
            {quickTemplates.map((template) => (
              <button
                key={template}
                className="template-chip"
                type="button"
                onClick={() => setCaptureValue(template)}
              >
                {template}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Unified Control</div>
            <h2>{navigation.find((item) => item.id === activeView)?.label}</h2>
            <p>Shared design system, mock data, and connected flows in a single app surface.</p>
          </div>
          <div className="topbar__meta">
            <div className="status-pill">
              <span className="status-pill__dot" />
              Prototype ready
            </div>
            <div className="status-pill muted">UTC-04:00</div>
          </div>
        </header>

        {activeView === "dashboard" && (
          <DashboardView
            captureValue={captureValue}
            entries={entries}
            onCaptureChange={setCaptureValue}
            onSaveCapture={saveCapture}
            onOpenProjects={() => setActiveView("projects")}
            projects={projects}
          />
        )}

        {activeView === "projects" && (
          <ProjectsView
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProjectId}
          />
        )}

        {activeView === "knowledge" && <KnowledgeView items={knowledgeItems} />}

        {activeView === "search" && (
          <SearchView
            query={query}
            onQueryChange={setQuery}
            results={searchResults}
            filteredKnowledge={filteredKnowledge}
          />
        )}

        {activeView === "settings" && <SettingsView groups={settingsGroups} />}
      </main>
    </div>
  );
}

function DashboardView({ captureValue, entries, onCaptureChange, onSaveCapture, onOpenProjects, projects }) {
  return (
    <section className="view-grid">
      <div className="hero-card card">
        <div>
          <div className="eyebrow">Command Layer</div>
          <h3>Move from stitched concepts to an MVP we can actually test.</h3>
          <p>
            This prototype focuses on the four strongest workflows in the export: quick capture,
            project visibility, knowledge retrieval, and system configuration.
          </p>
        </div>
        <div className="hero-card__actions">
          <button className="button button--primary" type="button" onClick={onOpenProjects}>
            Review projects
          </button>
          <button className="button" type="button">
            Export brief
          </button>
        </div>
      </div>

      <div className="capture-card card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Quick Capture</div>
            <h4>Drop the next thought into the system</h4>
          </div>
          <button className="button" type="button" onClick={onSaveCapture}>
            Save entry
          </button>
        </div>
        <textarea
          className="capture-input"
          value={captureValue}
          onChange={(event) => onCaptureChange(event.target.value)}
          placeholder="What should this system remember, route, or follow up on?"
        />
        <div className="capture-log">
          {entries.map((entry) => (
            <div className="capture-log__item" key={entry}>
              {entry}
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <MetricCard label="Active initiatives" value="03" detail="1 blocked, 1 queued" />
        <MetricCard label="Knowledge documents" value="148" detail="12 updated this week" />
        <MetricCard label="Search readiness" value="84%" detail="mock ranking configured" />
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Delivery snapshot</div>
            <h4>Current initiatives</h4>
          </div>
        </div>
        <div className="project-row-list">
          {projects.map((project) => (
            <div className="project-row" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.summary}</p>
              </div>
              <div className={`status-tag ${project.status.toLowerCase()}`}>{project.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsView({ projects, selectedProject, onSelectProject }) {
  return (
    <section className="split-layout">
      <div className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Program board</div>
            <h4>Projects</h4>
          </div>
        </div>

        <div className="project-stack">
          {projects.map((project) => (
            <button
              key={project.id}
              className={`project-list-card ${project.id === selectedProject.id ? "selected" : ""}`}
              type="button"
              onClick={() => onSelectProject(project.id)}
            >
              <div className="project-list-card__top">
                <strong>{project.name}</strong>
                <span className={`status-tag ${project.status.toLowerCase()}`}>{project.status}</span>
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
            <h4>{selectedProject.name}</h4>
          </div>
          <div className={`status-tag ${selectedProject.status.toLowerCase()}`}>{selectedProject.status}</div>
        </div>

        <div className="detail-grid">
          <DetailStat label="Owner" value={selectedProject.owner} />
          <DetailStat label="Health" value={selectedProject.health} />
          <DetailStat label="Due date" value={selectedProject.due} />
          <DetailStat label="Progress" value={`${selectedProject.progress}%`} />
        </div>

        <p className="detail-summary">{selectedProject.summary}</p>

        <div className="milestone-list">
          {selectedProject.milestones.map((milestone) => (
            <div className="milestone-item" key={milestone.name}>
              <span className={`milestone-dot ${milestone.done ? "done" : ""}`} />
              <div>
                <strong>{milestone.name}</strong>
                <p>{milestone.done ? "Completed in the current prototype flow." : "Still needs implementation or a product decision."}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function KnowledgeView({ items }) {
  return (
    <section className="knowledge-grid">
      {items.map((item) => (
        <article className="card knowledge-card" key={item.id}>
          <div className="knowledge-card__top">
            <div>
              <div className="eyebrow">{item.collection}</div>
              <h4>{item.title}</h4>
            </div>
            <span className="meta-note">{item.updated}</span>
          </div>
          <p>{item.excerpt}</p>
          <div className="tag-list">
            <span className="status-tag neutral">{item.type}</span>
            {item.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function SearchView({ query, onQueryChange, results, filteredKnowledge }) {
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

function SettingsView({ groups }) {
  return (
    <section className="settings-grid">
      {groups.map((group) => (
        <div className="card" key={group.title}>
          <div className="section-heading">
            <div>
              <div className="eyebrow">Configuration</div>
              <h4>{group.title}</h4>
            </div>
          </div>
          <div className="settings-list">
            {group.items.map((item) => (
              <div className="settings-item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="card metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function DetailStat({ label, value }) {
  return (
    <div className="detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
