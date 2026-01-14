console.log("✅ gemini.routes loaded");

// server/routes/gemini.routes.js
const express = require("express");
const router = express.Router();

const { postRecipeSuggestions } = require("../controllers/gemini.controller");

// POST /api/gemini/recipes
router.post("/recipes", postRecipeSuggestions);

module.exports = router;
