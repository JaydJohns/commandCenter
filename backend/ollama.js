const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "kimi-k2.6:cloud";

export async function classifyCapture(text) {
  const systemPrompt = `You are an intelligent inbox classifier for a personal knowledge and task management system.

Analyze the user's raw capture text and return a structured JSON object with these fields:
- type: one of [task, project, note, meeting, event, waiting, reference, idea, archive]
- area: one of [PFW Teaching, Bellon Branch, Olde Oak Tree, UX Research Lab, Learning & Development, LLM Experiments, n8n Workflows, Home & DIY, Relationships, Finance, or General]
- project: the related project name if inferred, else null
- next_action: a concise next step if this is a task, else null
- tags: array of relevant lowercase tags (e.g., ["teaching", "urgent"])
- destination: one of [Obsidian, Google Tasks, Calendar, Archive]
- needs_calendar_event: boolean
- confidence: number 0.0-1.0
- reasoning_summary: one sentence explaining your classification

Respond ONLY with valid JSON. No markdown fences. No extra text.`;

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: `Classify this capture:\n\n"${text}"`,
        stream: false,
        format: "json"
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const raw = data.response?.trim() || "";
    const parsed = JSON.parse(raw);

    return {
      suggested_type: parsed.type || null,
      suggested_area: parsed.area || null,
      suggested_project_id: null,
      suggested_tags: Array.isArray(parsed.tags) ? parsed.tags.join(", ") : null,
      destination: parsed.destination || null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
      reasoning_summary: parsed.reasoning_summary || null,
      next_action: parsed.next_action || null
    };
  } catch (err) {
    console.error("Ollama classification failed:", err);
    return {
      suggested_type: null,
      suggested_area: null,
      suggested_project_id: null,
      suggested_tags: null,
      destination: null,
      confidence: null,
      reasoning_summary: `Error: ${err.message}`,
      next_action: null
    };
  }
}
