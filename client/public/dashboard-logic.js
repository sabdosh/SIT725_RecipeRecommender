// client/public/dashboard-logic.js
(function () {
  const form = document.getElementById("recipeForm");
  const ingredientsEl = document.getElementById("ingredients");
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");
  const submitBtn = document.getElementById("submitBtn");

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "crimson" : "inherit";
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderRecipes(recipes) {
    resultsEl.innerHTML = "";
    resultsEl.className = "recipe-grid"; // Ensure grid class is applied
    
    for (const r of recipes) {
      const card = document.createElement("article");
      card.className = "recipe-card";
      
      // Format time and servings for display
      const time = r.estimated_time_minutes || 30;
      const servings = r.servings || 4;
      
      card.innerHTML = `
        <div class="recipe-card__content">
          <div class="recipe-card__header">
            <h3 class="recipe-card__title">${escapeHtml(r.title || "Recipe")}</h3>
            <div class="recipe-card__meta">
              <div class="recipe-card__time">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${time} min
              </div>
              <div class="recipe-card__servings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                ${servings} servings
              </div>
            </div>
            <p class="recipe-card__description">${escapeHtml(r.description || r.why_it_fits || "")}</p>
          </div>
          <div class="recipe-card__actions">
            <a href="#" class="btn btn--primary" onclick="event.preventDefault(); showRecipeDetails('${escapeHtml(r.title || '')}')">View Details</a>
            <a href="#" class="btn btn--secondary" onclick="event.preventDefault(); saveRecipe('${escapeHtml(r.title || '')}')">Save</a>
          </div>
        </div>
      `;
      
      resultsEl.appendChild(card);
    }
  }

  // Dummy functions for buttons
  window.showRecipeDetails = function(recipeTitle) {
    alert(`Details for: ${recipeTitle}\n\nThis would show the full recipe with ingredients and steps.`);
  };

  window.saveRecipe = function(recipeTitle) {
    alert(`Saved: ${recipeTitle}\n\nRecipe saved to your collection!`);
  };

  // Make fetchSuggestions available globally for testing
  window.fetchSuggestions = async function(payload) {
    const resp = await fetch("/api/gemini/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.ok) {
      throw new Error(data?.error || `Request failed (${resp.status})`);
    }
    return data;
  };


  // Set up event listeners for test buttons
  function setupTestButtons() {
    if (testDataBtn) {
      testDataBtn.addEventListener("click", () => {
        // Fill with sample ingredients
        ingredientsEl.value = "chicken, rice, tomatoes, garlic, pasta, eggs, cheese, onions";
        // Submit the form
        form.dispatchEvent(new Event("submit"));
      });
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    resultsEl.innerHTML = "";

    const ingredientsText = ingredientsEl.value.trim();
    if (!ingredientsText) {
      setStatus("Please enter at least one ingredient.", true);
      return;
    }

    const ingredients = ingredientsText
      .split(/\n|,/g)
      .map(s => s.trim())
      .filter(Boolean);

    submitBtn.disabled = true;
    setStatus("Asking Gemini for suggestions...");

    try {
      const data = await window.fetchSuggestions({ ingredients });

      const recipes = Array.isArray(data.recipes) ? data.recipes : [];
      if (!recipes.length) {
        setStatus("No recipes returned. Try adding more ingredients.", true);
        return;
      }

      setStatus(`Found ${recipes.length} recipe suggestion(s).`);
      renderRecipes(recipes);
    } catch (err) {
      setStatus(err.message || "Something went wrong.", true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Set up test buttons when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupTestButtons);
  } else {
    setupTestButtons();
  }
})();