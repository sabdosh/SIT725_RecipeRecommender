// client/public/dashboard-logic.js
(function () {
  const form = document.getElementById("recipeForm");
  const ingredientsEl = document.getElementById("ingredients");
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");
  const submitBtn = document.getElementById("submitBtn");
  
  // Get the test buttons from HTML
  const enableMockBtn = document.getElementById("enableMockBtn");
  const testDataBtn = document.getElementById("testDataBtn");

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

  // Add test mode flag and mock function
  window.enableMockMode = function() {
    const originalFetch = window.fetchSuggestions;
    
    window.fetchSuggestions = async function(payload) {
      console.log("📋 Mock API called with payload:", payload);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock response matching the screenshot style
      return {
        ok: true,
        recipes: [
          {
            title: "Classic Chicken Stir-Fry",
            estimated_time_minutes: 25,
            servings: 4,
            description: "Quick and easy chicken stir-fry with vegetables and savory sauce.",
            why_it_fits: "Uses your chicken, vegetables, and basic pantry staples",
            missing_ingredients: ["soy sauce", "cornstarch"],
            steps: [
              "Cut chicken into bite-sized pieces",
              "Stir-fry vegetables in hot oil",
              "Add chicken and cook until done",
              "Mix sauce ingredients and simmer"
            ],
            optional_additions: ["Bell peppers", "Broccoli", "Cashews"]
          },
          {
            title: "Tomato Pasta Primavera",
            estimated_time_minutes: 30,
            servings: 4,
            description: "Fresh pasta with tomatoes, garlic, and seasonal vegetables.",
            why_it_fits: "Perfect for your pasta, tomatoes, and garlic",
            missing_ingredients: ["fresh basil", "parmesan"],
            steps: [
              "Cook pasta according to package",
              "Sauté garlic and tomatoes",
              "Add seasonal vegetables",
              "Combine with pasta and toss"
            ],
            optional_additions: ["Zucchini", "Mushrooms", "Spinach"]
          },
          {
            title: "Garlic Butter Rice Bowl",
            estimated_time_minutes: 20,
            servings: 2,
            description: "Simple and flavorful rice bowl with garlic butter sauce.",
            why_it_fits: "Uses your rice and garlic efficiently",
            missing_ingredients: ["butter", "lemon"],
            steps: [
              "Cook rice until fluffy",
              "Melt butter with minced garlic",
              "Mix garlic butter into rice",
              "Season with salt and pepper"
            ],
            optional_additions: ["Parsley", "Green onions", "Toasted sesame seeds"]
          }
        ]
      };
    };
    
    console.log("✅ Mock mode enabled. Using simulated data instead of real API.");
    return function disableMock() {
      window.fetchSuggestions = originalFetch;
      console.log("✅ Mock mode disabled. Back to real API.");
    };
  };

  // Set up event listeners for test buttons
  function setupTestButtons() {
    let disableMock = null;
    
    if (enableMockBtn) {
      enableMockBtn.addEventListener("click", () => {
        if (!disableMock) {
          disableMock = window.enableMockMode();
          enableMockBtn.textContent = "Disable Mock Mode";
          enableMockBtn.style.backgroundColor = "#f44336";
          statusEl.textContent = "Mock mode enabled. All API calls will use simulated data.";
        } else {
          disableMock();
          disableMock = null;
          enableMockBtn.textContent = "Enable Mock Mode";
          enableMockBtn.style.backgroundColor = "#4CAF50";
          statusEl.textContent = "Mock mode disabled. Using real API.";
        }
      });
    }
    
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