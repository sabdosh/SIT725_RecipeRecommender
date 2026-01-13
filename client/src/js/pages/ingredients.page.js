// client/src/js/pages/ingredients.page.js
import { generateRecipes } from "../api/recipes.api.js";

export function wireIngredientsPage() {
  const textarea = document.querySelector("#ingredientsInput");
  const submitBtn = document.querySelector("#getRecipesBtn");
  const status = document.querySelector("#status"); // optional
  const results = document.querySelector("#results"); // optional

  submitBtn.addEventListener("click", async () => {
    const ingredients = textarea.value.trim();

    if (!ingredients) {
      if (status) status.textContent = "Please enter at least one ingredient.";
      return;
    }

    submitBtn.disabled = true;
    if (status) status.textContent = "Generating recipes...";

    try {
      const data = await generateRecipes(ingredients);
      if (status) status.textContent = "";

      // MVP: just dump JSON or render simple cards
      if (results) results.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      if (status) status.textContent = e.message;
    } finally {
      submitBtn.disabled = false;
    }
  });
}
