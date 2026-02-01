const request = require("supertest");

jest.mock("../../server/config/authDB", () => jest.fn(() => Promise.resolve()));

jest.mock("../../server/services/gemini.service", () => ({
  generateRecipeSuggestions: jest.fn()
}));

const app = require("../../server/app");
const { generateRecipeSuggestions } = require("../../server/services/gemini.service");

describe("Gemini recipe API", () => {
  test("GET /api/gemini/health is available", async () => {
    const res = await request(app).get("/api/gemini/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test("POST /api/gemini/recipes returns expected structure for valid input", async () => {
    generateRecipeSuggestions.mockResolvedValue({
      recipes: [
        {
          title: "Chicken Rice Bowl",
          why_it_fits: "Uses chicken and rice",
          missing_ingredients: ["soy sauce"],
          estimated_time_minutes: 25,
          difficulty: "Easy",
          steps: ["Cook rice", "Cook chicken", "Assemble bowl"],
          optional_additions: ["scallions"]
        }
      ]
    });

    const res = await request(app)
      .post("/api/gemini/recipes")
      .send({ ingredients: ["chicken", "rice"], dietary: "", maxRecipes: 1 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("recipes");
    expect(Array.isArray(res.body.recipes)).toBe(true);

    const recipe = res.body.recipes[0];
    expect(recipe).toHaveProperty("title");
    expect(recipe).toHaveProperty("why_it_fits");
    expect(recipe).toHaveProperty("missing_ingredients");
    expect(recipe).toHaveProperty("estimated_time_minutes");
    expect(recipe).toHaveProperty("difficulty");
    expect(recipe).toHaveProperty("steps");
    expect(recipe).toHaveProperty("optional_additions");
  });

  test("POST /api/gemini/recipes returns 400 for invalid input", async () => {
    const err = new Error("No ingredients provided.");
    err.statusCode = 400;
    generateRecipeSuggestions.mockRejectedValue(err);

    const res = await request(app)
      .post("/api/gemini/recipes")
      .send({ ingredients: [] });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body).toHaveProperty("error");
  });
});
