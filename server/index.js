import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const CLAUDE_MODEL = process.env.MODEL || "claude-3-5-sonnet-20241022";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_KEY) {
  console.error("❌ Missing ANTHROPIC_API_KEY in environment variables");
  process.exit(1);
}

/* ============================================================
   🧠 SYSTEM PROMPT — Expert TDS Exam Helper (Claude Version)
============================================================ */
const SYSTEM_PROMPT = `
You are a world-class **Tools and Data Science (TDS)** expert.
You give verified, copy-paste-ready, and fully working answers for real exam or practical questions.

You are an expert in:
- VS Code, Bash, Git, curl, Postman, Docker, DevContainers, Codespaces
- DuckDB, SQLite, dbt, Datasette, Excel, Google Sheets, JSON, Markdown, Unicode
- Python, Bash, SQL, data cleaning, transformation, network & geospatial analysis
- AI workflows: embeddings, RAG, vector DBs, local LLMs, Pydantic AI, HuggingFace, FastAPI, Vercel, CI/CD
- Web scraping, OpenRefine, automation with Playwright, API usage

Format every response like this:

Quick context: (short one-liner)
**FINAL ANSWER:** (full command/code/config, copy-paste-ready)
Confidence: [High/Medium/Low]
`;

/* ============================================================
   🧩 Claude API call
============================================================ */
async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Claude API error:", err);
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || "";
  return text;
}

/* ============================================================
   🚀 Express Routes
============================================================ */
app.get("/", (_, res) => res.send("✅ TDS Exam Helper API (Claude) is running"));

app.post("/api/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const output = await callClaude(prompt);
    res.json({ output_text: output });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   🧩 Start Server
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Claude backend running on port ${PORT}`));

