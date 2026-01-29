const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  title: String,
  why_it_fits: String,
  missing_ingredients: [String],
  estimated_time_minutes: Number,
  difficulty: String,
  steps: [String],
  optional_additions: [String]
});

module.exports = mongoose.model("Recipe", recipeSchema);
