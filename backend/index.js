import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Detect response type from user message
function detectResponseType(message) {
  const lower = message.toLowerCase();
  if (lower.includes("table")) return "table";
  if (lower.includes("chart") || lower.includes("graph")) return "chart";
  if (lower.includes("grid")) return "grid";
  if (lower.includes("box") || lower.includes("summary") || lower.includes("card")) return "box";
  return "text";
}

// Build prompt based on response type
function buildPrompt(message, type) {
  const basePrompts = {
    text: `Answer the following question in a clear, informative way: "${message}"`,

    table: `The user asked: "${message}"
Return ONLY a valid JSON object in this exact format, no markdown, no extra text:
{
  "type": "table",
  "title": "A relevant title",
  "headers": ["Column1", "Column2", "Column3"],
  "rows": [
    ["value1", "value2", "value3"],
    ["value4", "value5", "value6"]
  ]
}
Provide at least 5 rows of real, useful data relevant to the question.`,

    chart: `The user asked: "${message}"
Return ONLY a valid JSON object in this exact format, no markdown, no extra text:
{
  "type": "chart",
  "chartType": "bar",
  "title": "A relevant chart title",
  "labels": ["Label1", "Label2", "Label3", "Label4", "Label5"],
  "datasets": [
    {
      "label": "Dataset name",
      "data": [10, 20, 30, 40, 50]
    }
  ]
}
Provide real, meaningful numeric data related to the question.`,

    grid: `The user asked: "${message}"
Return ONLY a valid JSON object in this exact format, no markdown, no extra text:
{
  "type": "grid",
  "title": "A relevant title",
  "items": [
    { "icon": "🔵", "title": "Item Title", "description": "Short description here" },
    { "icon": "🟢", "title": "Item Title", "description": "Short description here" },
    { "icon": "🟡", "title": "Item Title", "description": "Short description here" },
    { "icon": "🔴", "title": "Item Title", "description": "Short description here" },
    { "icon": "🟣", "title": "Item Title", "description": "Short description here" },
    { "icon": "🟠", "title": "Item Title", "description": "Short description here" }
  ]
}
Provide 6 real, relevant items for the topic.`,

    box: `The user asked: "${message}"
Return ONLY a valid JSON object in this exact format, no markdown, no extra text:
{
  "type": "box",
  "title": "Summary title",
  "subtitle": "A short tagline or context line",
  "points": [
    { "label": "Key Point 1", "value": "Detailed explanation" },
    { "label": "Key Point 2", "value": "Detailed explanation" },
    { "label": "Key Point 3", "value": "Detailed explanation" },
    { "label": "Key Point 4", "value": "Detailed explanation" }
  ],
  "footer": "A closing remark or takeaway"
}`,
  };

  return basePrompts[type] || basePrompts.text;
}

app.post("/api/chat", async (req, res) => {
  const { message, apiKey } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(400).json({ error: "Gemini API key not provided" });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const type = detectResponseType(message);
    const prompt = buildPrompt(message, type);

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    if (type === "text") {
      return res.json({ type: "text", content: rawText });
    }

    // Parse JSON response for structured types
    try {
      // Strip markdown code blocks if present
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    } catch (parseErr) {
      // Fallback: return as text if JSON parse fails
      return res.json({ type: "text", content: rawText });
    }
  } catch (err) {
    console.error("Gemini error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to get response from Gemini" });
  }
});

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
