require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_CHARS = 40_000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json({ limit: "2mb" }));

async function scrapeUrl(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BrowserBullets/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching URL`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside, noscript, iframe").remove();
  const text =
    $("article").text().trim() ||
    $("main").text().trim() ||
    $("[role='main']").text().trim() ||
    $("body").text().trim();
  return text.replace(/\s+/g, " ").trim();
}

app.post("/summarize", async (req, res) => {
  let text = req.body.text;
  const url = req.body.url;

  if (url) {
    try {
      text = await scrapeUrl(url);
    } catch (err) {
      return res.status(422).json({ error: `Could not fetch URL: ${err.message}` });
    }
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "No readable text found. Provide 'text' or a valid 'url'." });
  }

  const trimmed = text.slice(0, MAX_CHARS);

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Summarize the following article in exactly 3 concise bullet points. Respond with ONLY valid JSON in this exact format — no markdown, no explanation, no extra keys:
{"bullets":["bullet one","bullet two","bullet three"]}

Article:
${trimmed}`,
        },
      ],
    });

    const raw = message.content[0].text.trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in model response.");
      parsed = JSON.parse(match[0]);
    }

    if (
      !Array.isArray(parsed.bullets) ||
      parsed.bullets.length !== 3 ||
      parsed.bullets.some((b) => typeof b !== "string")
    ) {
      return res
        .status(502)
        .json({ error: "Model returned unexpected bullet format." });
    }

    return res.json({ bullets: parsed.bullets });
  } catch (err) {
    console.error("Claude API error:", err.message);
    return res.status(502).json({ error: "Failed to summarize article." });
  }
});

app.listen(PORT, () => {
  console.log(`Browser Bullets server running at http://localhost:${PORT}`);
});
