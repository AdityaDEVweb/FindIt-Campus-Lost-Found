import express from "express";

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "12mb" }));

app.post("/api/recognize", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    const { image } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "An image is required." });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Invalid image format." });
    }

    const mimeType = match[1];
    const data = match[2];

    const prompt = `You are the AI recognition assistant for a college campus Lost & Found app called FindIt.\n\nAnalyze the uploaded photo and identify the main physical item. Return ONLY valid JSON with these fields:\n- title: short item name, e.g. "Black wireless earbuds"\n- category: exactly one of: Electronics, Documents, Clothing, Personal Items, Books, Accessories, Other\n- description: concise description of visible identifying details such as color, brand if readable, shape, markings, or accessories. Never invent details that cannot be seen.\n- note: one short sentence reminding the user to verify the AI-generated details before publishing.\n\nIf the image is unclear, make the title/category as cautious as possible and say so in note.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: [
          { type: "text", text: prompt },
          { type: "image", data, mime_type: mimeType }
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              note: { type: "string" }
            },
            required: ["title", "category", "description", "note"]
          }
        }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result.error?.message || "Gemini request failed." });
    }

    const outputText = result.output_text || result.output?.text || "";
    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      return res.status(502).json({ error: "Gemini returned an unexpected response." });
    }

    res.json(parsed);
  } catch (error) {
    console.error("AI recognition error:", error);
    res.status(500).json({ error: "AI recognition is temporarily unavailable." });
  }
});

app.listen(PORT, () => {
  console.log(`FindIt AI server running on http://localhost:${PORT}`);
});
