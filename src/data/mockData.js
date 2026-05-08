export const navigation = [
  { id: "dashboard", label: "Dashboard", eyebrow: "Control" },
  { id: "briefing", label: "Daily Briefing", eyebrow: "Morning" },
  { id: "inbox", label: "Inbox", eyebrow: "Capture" },
  { id: "tasks", label: "Tasks", eyebrow: "Action" },
  { id: "projects", label: "Projects", eyebrow: "Delivery" },
  { id: "knowledge", label: "Knowledge Base", eyebrow: "Archive" },
  { id: "search", label: "Semantic Search", eyebrow: "Discover" },
  { id: "review", label: "Review", eyebrow: "Reflect" },
  { id: "google", label: "Google Integration", eyebrow: "Connect" },
  { id: "settings", label: "Settings", eyebrow: "System" }
];

export const quickTemplates = [
  "Follow up with platform team about ingestion blockers",
  "Save article summary to knowledge base",
  "Outline new course module on prompt engineering"
];

export const projects = [
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

export const knowledgeItems = [
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

export const searchResults = [
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

export const settingsGroups = [
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
