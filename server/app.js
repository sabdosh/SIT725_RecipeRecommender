require("dotenv").config();

console.log("✅ app.js loaded");

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const connectDB = require("./config/authDB");
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
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/recipes", async (req, res, next) => {
  try {
    const recipe = await Recipe.create(req.body);
    return res.status(201).json(recipe);
  } catch (err) {
    next(err); // lets global handler catch it
  }
});

app.get("/test-save", async (req, res) => {
  const Recipe = require("./models/recipe");

  const r = await Recipe.create({
    title: "Test Pasta",
    why_it_fits: "Quick",
    missing_ingredients: ["cheese"],
    estimated_time_minutes: 10,
    difficulty: "Easy",
    steps: ["Boil water"],
    optional_additions: []
  });

  res.json(r);
});


// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("UNCAUGHT ERROR:", err);
  res.status(500).json({ message: "Server error" });
});

module.exports = app;
