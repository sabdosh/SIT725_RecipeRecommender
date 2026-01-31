// client/public/dashboard-logic.js
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("recipeForm");
    const ingredientsEl = document.getElementById("ingredients");
    const statusEl = document.getElementById("status");
    const resultsEl = document.getElementById("results");
    const submitBtn = document.getElementById("submitBtn");
    const recipeByTitle = new Map();
    const savedTitles = new Set();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        window.location.href = "/public/index.html";
      });
    }

    if (!form || !ingredientsEl || !statusEl || !resultsEl) {
      console.error("Required dashboard elements not found:", {
        form,
        ingredientsEl,
        statusEl,
        resultsEl,
        submitBtn,
      });
      return;
    }

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

    function showTextModal(text) {
      const existing = document.getElementById("recipeDetailsModal");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "recipeDetailsModal";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.65)";
      overlay.style.zIndex = "9999";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.padding = "24px";

      const box = document.createElement("div");
      box.style.background = "#fff";
      box.style.borderRadius = "12px";
      box.style.width = "min(900px, 100%)";
      box.style.maxHeight = "min(80vh, 900px)";
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.boxShadow = "0 20px 60px rgba(0,0,0,0.35)";
      box.style.overflow = "hidden";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "flex-end";
      header.style.padding = "12px 12px 0 12px";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "×";
      closeBtn.style.border = "none";
      closeBtn.style.background = "transparent";
      closeBtn.style.fontSize = "28px";
      closeBtn.style.lineHeight = "28px";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.padding = "6px 10px";

      const body = document.createElement("pre");
      body.style.margin = "0";
      body.style.padding = "12px 16px 18px 16px";
      body.style.whiteSpace = "pre-wrap";
      body.style.wordBreak = "break-word";
      body.style.overflow = "auto";
      body.style.fontFamily = "inherit";
      body.style.fontSize = "14px";
      body.style.lineHeight = "1.5";
      body.textContent = text || "";

      function close() {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }

      function onKey(e) {
        if (e.key === "Escape") close();
      }

      closeBtn.addEventListener("click", close);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
      });
      document.addEventListener("keydown", onKey);

      header.appendChild(closeBtn);
      box.appendChild(header);
      box.appendChild(body);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }

    function normalizeList(v) {
      if (v == null) return [];

      if (Array.isArray(v)) {
        return v
          .flatMap((x) => normalizeList(x))
          .map((s) => String(s).trim())
          .filter(Boolean);
      }

      if (typeof v === "string") {
        return v
          .split(/,|\n/)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (typeof v === "object") {
        const container =
          v.ingredients ??
          v.items ??
          v.list ??
          v.data ??
          v.used ??
          v.usedIngredients ??
          v.ingredients_used ??
          v.ingredientsUsed ??
          v.ingredientsList ??
          v.ingredient_list ??
          v.ingredientList ??
          v.ingredient ??
          v.text;

        if (container !== undefined && container !== v) {
          return normalizeList(container);
        }

        const name =
          v.name ??
          v.item ??
          v.ingredient ??
          v.text ??
          v.title ??
          "";

        const qty = v.quantity ?? v.qty ?? "";
        const unit = v.unit ?? "";
        const base = [qty, unit, name].filter(Boolean).join(" ").trim();

        return base ? [base] : [];
      }

      return [String(v).trim()].filter(Boolean);
    }

    function renderRecipes(recipes) {
      resultsEl.innerHTML = "";
      recipeByTitle.clear();
      resultsEl.className = "recipe-grid";

      for (const r of recipes) {
        const key = (r.title || "").toString();
        if (key) recipeByTitle.set(key, r);
        const card = document.createElement("article");
        card.className = "recipe-card";

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
            <p class="recipe-card__description">${escapeHtml(
              r.description || r.why_it_fits || ""
            )}</p>
          </div>
          <div class="recipe-card__actions">
            <a href="#" class="btn btn--primary" onclick="event.preventDefault(); showRecipeDetails('${escapeHtml(
              r.title || ""
            )}')">View Details</a>
            <a href="#" class="btn btn--secondary" onclick="event.preventDefault(); saveRecipe('${escapeHtml(
              r.title || ""
            )}')">Save</a>
          </div>
        </div>
      `;

        resultsEl.appendChild(card);
      }
    }

    function getAuthToken() {
      return (
        localStorage.getItem("token") || localStorage.getItem("auth_token") || ""
      );
    }

    async function persistRecipe(recipe) {
      const token = getAuthToken();
      if (!token) return;

      const key = (recipe?.title || "").toString();
      if (key && savedTitles.has(key)) return;
      if (key) savedTitles.add(key);

      try {
        const res = await fetch("/api/recipes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(recipe),
        });

        if (!res.ok) {
          if (key) savedTitles.delete(key);
        }
      } catch (e) {
        if (key) savedTitles.delete(key);
        throw e;
      }
    }

    async function autoSaveGeneratedRecipes(recipes) {
      const token = getAuthToken();
      if (!token) return;
      const list = Array.isArray(recipes) ? recipes : [];
      await Promise.allSettled(list.map((r) => persistRecipe(r)));
    }

    window.showRecipeDetails = function (recipeTitle) {
      const r = recipeByTitle.get(recipeTitle);

      if (!r) {
        showTextModal("Details for: " + recipeTitle);
        return;
      }

      const steps = normalizeList(r.steps ?? r.instructions ?? r.method);
      const ingredients = normalizeList(
        r.ingredients ??
          r.ingredients_used ??
          r.ingredientsUsed ??
          r.used_ingredients ??
          r.usedIngredients ??
          r.usedIngredientsList ??
          r.ingredients_needed ??
          r.ingredientsNeeded ??
          r.ingredientsList ??
          r.ingredient_list ??
          r.ingredientList
      );
      const missing = normalizeList(
        r.missing_ingredients ?? r.missingIngredients ?? r.missing
      );
      const optional = normalizeList(
        r.optional_additions ?? r.optionalAdditions ?? r.optional
      );

      showTextModal(
        `Recipe: ${r.title || recipeTitle}

Steps:
${steps.join("\n")}

Missing Ingredients:
${missing.join(", ")}

Optional Additions:
${optional.join(", ")}`
      );
    };

    window.saveRecipe = async function (recipeTitle) {
      const token = getAuthToken();
      if (!token) {
        alert("Please log in to save recipes.");
        return;
      }

      const r = recipeByTitle.get(recipeTitle);
      if (!r) {
        alert("Unable to save this recipe.");
        return;
      }

      if (savedTitles.has(recipeTitle)) {
        alert("This recipe has been saved - " + recipeTitle);
        return;
      }

      try {
        await persistRecipe(r);
        alert("Saved: " + recipeTitle + "\n\nRecipe saved to your collection!");
      } catch (err) {
        alert("Unable to save recipe.");
      }
    };

    window.fetchSuggestions = async function (payload) {
      const resp = await fetch("/api/gemini/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${resp.status})`);
      }
      return data;
    };

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const raw = (ingredientsEl.value || "").trim();
      if (!raw) {
        setStatus("Please enter at least one ingredient.", true);
        return;
      }

      const ingredients = raw
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (ingredients.length === 0) {
        setStatus("Please enter at least one ingredient.", true);
        return;
      }

      setStatus("Fetching recipe suggestions...");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const data = await window.fetchSuggestions({ ingredients });

        const recipes = data?.recipes || data?.data?.recipes || data?.data || [];

        if (!Array.isArray(recipes) || recipes.length === 0) {
          setStatus("No recipes returned. Try different ingredients.", true);
          resultsEl.innerHTML = "";
          return;
        }

        setStatus(`Found ${recipes.length} recipe suggestion(s).`);
        renderRecipes(recipes);
        await autoSaveGeneratedRecipes(recipes);
      } catch (err) {
        setStatus(err?.message || "Something went wrong.", true);
        resultsEl.innerHTML = "";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
})();
