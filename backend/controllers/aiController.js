const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
};

const suggestEstimate = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: "Task title is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Gemini Key:", process.env.GEMINI_API_KEY);
    if (!apiKey) {
      return res.json({
        effort: "M",
        suggestedDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        reasoning: "AI estimate unavailable – using default values. Configure GEMINI_API_KEY to enable smart estimates.",
        fallback: true,
      });
    }

    const prompt = `You are a project management assistant. A user has a task titled: "${title}". Description: "${description || "No description provided"}".
Estimate the effort and suggest a due date (from today: ${new Date().toISOString().split("T")[0]}).
Respond ONLY with valid JSON in this exact format:
{
  "effort": "S | M | L",
  "effortHours": <number>,
  "suggestedDueDate": "YYYY-MM-DD",
  "reasoning": "<one sentence explanation>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);
  } catch (error) {
    // Always return a usable fallback instead of failing
    console.error("Gemini Error:", error);
    res.json({
      effort: "M",
      effortHours: 4,
      suggestedDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      reasoning: "Could not reach AI service – using default estimate.",
      fallback: true,
    });
  }
};

module.exports = { suggestEstimate, parseTask };

// POST /api/ai/parse-task
async function parseTask(req, res) {
  try {
    const { input } = req.body;
    if (!input || !input.trim()) {
      return res.status(400).json({ message: "Input is required" });
    }

    const today = new Date().toISOString().split("T")[0];
    const prompt = `You are a task parsing assistant. Today is ${today}.
The user typed this natural language task description: "${input.trim()}"

Extract the task details and respond ONLY with valid JSON in this exact format:
{
  "title": "<concise task title>",
  "description": "<optional extra detail, empty string if none>",
  "priority": "low | medium | high",
  "status": "todo | in-progress | done",
  "dueDate": "YYYY-MM-DD or null",
  "estimatedEffort": "<e.g. S (~1h) or M (~4h) or L (~8h) or empty string>"
}

Rules:
- title should be short and action-oriented
- Infer priority from words like urgent/critical/high/low/minor
- Infer dueDate from relative terms like "today", "tomorrow", "friday", "next week" relative to today (${today})
- If no due date is mentioned, use null
- Default priority is "medium", default status is "todo"`;

    const fallback = {
      title: input.trim().slice(0, 80),
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: null,
      estimatedEffort: "",
      fallback: true,
    };

    if (!process.env.GEMINI_API_KEY) return res.json(fallback);

    const text = await callGemini(prompt);
    if (!text) return res.json(fallback);

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch {
    res.json({
      title: req.body.input?.trim().slice(0, 80) || "New task",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: null,
      estimatedEffort: "",
      fallback: true,
    });
  }
}
