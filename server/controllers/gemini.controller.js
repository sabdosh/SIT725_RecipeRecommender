// server/controllers/gemini.controller.js
const { generateRecipeSuggestions } = require("../services/gemini.service");

async function postRecipeSuggestions(req, res) {
  try {
    const { ingredients, dietary, maxRecipes } = req.body || {};

    const result = await generateRecipeSuggestions({
      ingredients,
      dietary: dietary || "",
      maxRecipes: maxRecipes || 6
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: err.message || "Server error"
    });
  }
}

module.exports = { postRecipeSuggestions };
