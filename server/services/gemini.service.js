// server/services/gemini.service.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function assertConfigured() {
  if (!GEMINI_API_KEY) {
    const err = new Error("GEMINI_API_KEY is missing in .env");
    err.statusCode = 500;
    throw err;
  }
}

function extractJsonCandidate(text) {
  if (!text) return "";

  // Remove markdown fences
  let s = text.replace(/```json/gi, "```").replace(/```/g, "").trim();

  // Find first { or [ and last matching } or ]
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let first = -1;
  if (firstObj === -1) first = firstArr;
  else if (firstArr === -1) first = firstObj;
  else first = Math.min(firstObj, firstArr);

  const lastObj = s.lastIndexOf("}");
  const lastArr = s.lastIndexOf("]");
  let last = Math.max(lastObj, lastArr);

  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1).trim();
  }

  // Basic cleanup: smart quotes → normal quotes
  s = s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  return s;
}

async function callGemini(prompt, { temperature = 0.7, maxOutputTokens = 1200 } = {}) {
  assertConfigured();

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json"
    }
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(`Gemini API error (${resp.status}): ${text}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await resp.json();
  const textOut =
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("")?.trim() || "";

  return textOut;
}

async function generateRecipeSuggestions({ ingredients }) {
  assertConfigured();

  const cleanedIngredients = Array.isArray(ingredients)
    ? ingredients.map(x => String(x).trim()).filter(Boolean)
    : String(ingredients || "")
        .split(/,|\n/g)
        .map(x => x.trim())
        .filter(Boolean);

  if (!cleanedIngredients.length) {
    const err = new Error("No ingredients provided.");
    err.statusCode = 400;
    throw err;
  }

  // Primary prompt (strict)
  const prompt = `
Return ONLY valid JSON. No markdown. No commentary. No code fences.

Schema:
{
  "recipes": [
    {
      "title": "string",
      "why_it_fits": "string",
      "missing_ingredients": ["string"],
      "estimated_time_minutes": number,
      "difficulty": "Easy|Medium|Hard",
      "steps": ["string"],
      "optional_additions": ["string"]
    }
  ]
}

Ingredients the user has:
${cleanedIngredients.map(i => `- ${i}`).join("\n")}

Rules:
- Suggest 5 recipes max.
- Do not list pantry staples (salt, pepper, oil, water) as missing.
- Steps <= 8 lines each.
`.trim();

  const raw1 = await callGemini(prompt, { temperature: 0.4, maxOutputTokens: 1400 });

  // Attempt parse #1 (with extraction/cleanup)
  const candidate1 = extractJsonCandidate(raw1);
  try {
    const parsed = JSON.parse(candidate1 || raw1);
    if (parsed && Array.isArray(parsed.recipes)) return parsed;
  } catch (e) {
    // fall through to repair pass
  }

  // Repair pass: ask Gemini to convert raw output into valid JSON for schema
  const repairPrompt = `
You are a formatter. Convert the following into VALID JSON that matches this schema exactly.
Return ONLY JSON. No markdown. No extra text.

Schema:
{
  "recipes": [
    {
      "title": "string",
      "why_it_fits": "string",
      "missing_ingredients": ["string"],
      "estimated_time_minutes": number,
      "difficulty": "Easy|Medium|Hard",
      "steps": ["string"],
      "optional_additions": ["string"]
    }
  ]
}

Text to convert:
${raw1}
`.trim();

  const raw2 = await callGemini(repairPrompt, { temperature: 0, maxOutputTokens: 1400 });
  const candidate2 = extractJsonCandidate(raw2);

  try {
    const parsed2 = JSON.parse(candidate2 || raw2);
    if (parsed2 && Array.isArray(parsed2.recipes)) return parsed2;
  } catch (e) {
    // TEMP DEBUG: uncomment to see what Gemini returned
    // console.log("RAW1:\n", raw1);
    // console.log("RAW2:\n", raw2);

    const err = new Error("Gemini returned non-JSON output. Try again.");
    err.statusCode = 502;
    throw err;
  }

  return { recipes: [] };
}

module.exports = { generateRecipeSuggestions };
