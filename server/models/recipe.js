const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    // link recipe to a user
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: { type: String, required: true, trim: true, minlength: 1 },

    why_it_fits: { type: String, default: "" },
    missing_ingredients: { type: [String], default: [] },

    estimated_time_minutes: { type: Number, default: 0, min: 0 },

    // optional; if provided must be one of these values
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },

    steps: { type: [String], default: [] },
    optional_additions: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
