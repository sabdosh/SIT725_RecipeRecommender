require("dotenv").config();

console.log("app.js loaded");

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const connectDB = require("./config/authDB");
const auth = require("./middleware/auth");
const User = require("./models/user");
const Recipe = require("./models/recipe");
console.log("Models loaded:", { hasUser: !!User, hasRecipe: !!Recipe });
const jwt = require("jsonwebtoken");


const app = express();


app.use(express.json());

const geminiRoutes = require("./routes/gemini.routes");

app.use("/api/gemini", geminiRoutes);

app.get("/api/gemini/health", (req, res) => res.json({ ok: true }));

// connect mongo
connectDB();

// serve client
const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

app.get("/", (req, res) => {
  return res.sendFile(path.join(clientPath, "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(clientPath, "public", "dashboard.html"));
});


/**
 * REGISTER - create account
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // IMPORTANT: capture the created user doc so you can sign a token
    const created = await User.create({ username, password: hashed });

    const token = jwt.sign(
      { userId: created._id.toString(), username: created.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({ token });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token });
} catch (err) {
  console.error("LOGIN ERROR:", err);
  return res.status(500).json({ message: "Server error", error: err.message });
}
});
function validateRecipePayload(body) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    errors.push("Body must be a JSON object.");
    return errors;
  }

  // required: title only
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    errors.push("title is required and must be a non-empty string.");
  }

  // optional fields: validate type only if present
  if (body.why_it_fits !== undefined && typeof body.why_it_fits !== "string") {
    errors.push("why_it_fits must be a string.");
  }

  if (
    body.estimated_time_minutes !== undefined &&
    (typeof body.estimated_time_minutes !== "number" ||
      Number.isNaN(body.estimated_time_minutes) ||
      body.estimated_time_minutes < 0)
  ) {
    errors.push("estimated_time_minutes must be a number >= 0.");
  }

  if (
    body.difficulty !== undefined &&
    !["Easy", "Medium", "Hard"].includes(body.difficulty)
  ) {
    errors.push('difficulty must be one of: "Easy", "Medium", "Hard".');
  }

  const arrayFields = ["missing_ingredients", "steps", "optional_additions"];
  for (const f of arrayFields) {
    if (body[f] !== undefined && !Array.isArray(body[f])) {
      errors.push(`${f} must be an array of strings.`);
      continue;
    }
    if (Array.isArray(body[f]) && body[f].some((x) => typeof x !== "string")) {
      errors.push(`${f} must contain only strings.`);
    }
  }

  return errors;
}

// assumes your auth middleware sets req.user = { userId, username, iat, exp }
app.post("/api/recipes", auth, async (req, res) => {
  const errors = validateRecipePayload(req.body);
  if (errors.length) {
    return res
      .status(400)
      .json({ error: "Invalid recipe payload", details: errors });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Missing userId in token" });
  }

  try {
    const saved = await Recipe.create({
      owner: userId,
      title: req.body.title.trim(),
      why_it_fits: req.body.why_it_fits ?? "",
      missing_ingredients: req.body.missing_ingredients ?? [],
      estimated_time_minutes: req.body.estimated_time_minutes ?? 0,
      difficulty: req.body.difficulty, // optional
      steps: req.body.steps ?? [],
      optional_additions: req.body.optional_additions ?? [],
    });

    return res.status(201).json(saved);
  } catch (err) {
    return res
      .status(400)
      .json({ error: "Failed to save recipe", details: err.message });
  }
});

app.delete("/api/recipes/:id", auth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Missing userId in token" });
  }

  const id = req.params.id;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }

  try {
    const deleted = await Recipe.findOneAndDelete({ _id: id, owner: userId });
    if (!deleted) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to delete recipe", details: err.message });
  }
});


// Save logic

app.get("/api/saved", auth, async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Missing userId in token" });
  }

  try {
    const recipes = await Recipe.find({ owner: userId }).sort({ createdAt: -1 });
    return res.json({ recipes });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to load recipes", details: err.message });
  }
});



module.exports = app;
