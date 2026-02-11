const { test, expect } = require("@playwright/test");

async function registerAndGoToDashboard(page) {
  const u = `user_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const p = "Passw0rd!";

  await page.goto("/");
  await page.fill("#username", u);
  await page.fill("#password", p);

  await Promise.all([
    page.waitForURL("**/dashboard"),
    page.click("#registerLink")
  ]);

  return { username: u, password: p };
}

test("E2E: register, request suggestions, save recipe, view saved", async ({ page }) => {
  await registerAndGoToDashboard(page);

  await page.fill("#ingredients", "Chicken, Rice");

  await page.click("#submitBtn");
  await expect(page.locator(".recipe-card")).toHaveCount(1);
  await expect(page.locator(".recipe-card__title").first()).toContainText(
    "Chicken Rice Bowl"
  );

  page.once("dialog", (d) => d.accept());
  await page.locator("a", { hasText: "Save" }).first().click();

  await Promise.all([
    page.waitForURL("**/public/saved.html"),
    page.click("text=Saved Recipes")
  ]);

  await expect(page.locator("#savedSection")).toBeVisible();
  await expect(page.locator("#savedGrid .recipe-card__title").first()).toContainText(
    "Chicken Rice Bowl"
  );
});

test("E2E: Gemini endpoint rejects invalid payload", async ({ page }) => {
  await registerAndGoToDashboard(page);

  const result = await page.evaluate(async () => {
    const res = await fetch("/api/gemini/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: [] })
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  });

  expect(result.status).toBe(400);
  expect(result.json && result.json.ok).toBe(false);
});
