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
function formatStep(step) {
  if (!step) return "";

  let s = String(step).trim();

  // Capitalise first letter
  s = s.charAt(0).toUpperCase() + s.slice(1);

  // Add full stop if missing
  if (!/[.!?]$/.test(s)) {
    s += ".";
  }

  return s;
}
    // ---------------------------
    // MODAL (structured like Figma)
    // ---------------------------
    function openRecipeModal(recipe, userIngredients = []) {
      const existing = document.getElementById("recipeDetailsModal");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "recipeDetailsModal";
      overlay.className = "modalOverlay";

      const box = document.createElement("div");
      box.className = "modalBox";

      const header = document.createElement("div");
      header.className = "modalHeader";

      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "modalBack";
      backBtn.textContent = "← Back";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "modalClose";
      closeBtn.textContent = "×";

      header.appendChild(backBtn);
      header.appendChild(closeBtn);

      const body = document.createElement("div");
      body.className = "modalBody";

      // ---- Title / Meta ----
      const title = document.createElement("h2");
      title.className = "modalTitle";
      title.textContent = recipe.title || "Recipe";

      const meta = document.createElement("p");
      meta.className = "modalMeta";
      const time = recipe.estimated_time_minutes || recipe.time || "";
      const servings = recipe.servings || "";
      meta.textContent = [time ? `${time} min` : "", servings ? `${servings} servings` : ""]
        .filter(Boolean)
        .join(" • ");

      const hero = document.createElement("div");
      hero.className = "modalHero";

      // ---- Ingredients section ----
      const ingredientsSection = document.createElement("section");
      ingredientsSection.className = "modalSection";

      const ingHeading = document.createElement("h3");
      ingHeading.className = "modalSectionTitle";
      ingHeading.textContent = "Ingredients";

      const ingList = document.createElement("ul");
      ingList.className = "modalIngredients";

      // 1) User typed ingredients = ALWAYS AVAILABLE (never missing)
      const userList = (Array.isArray(userIngredients) ? userIngredients : [])
        .map((x) => String(x).trim())
        .filter(Boolean);

      const availableSet = new Set(userList.map((x) => x.toLowerCase()));

      // 2) Recipe ingredients (whatever the model returns)
      const recipeList = normalizeList(
        recipe.ingredients ??
          recipe.ingredientsList ??
          recipe.ingredient_list ??
          recipe.ingredientList ??
          recipe.ingredients_used ??
          recipe.ingredientsUsed ??
          recipe.used_ingredients ??
          recipe.usedIngredients
      )
        .map((x) => String(x).trim())
        .filter(Boolean);

      // 3) Missing ingredients returned by model
      const missingList = normalizeList(
        recipe.missing_ingredients ?? recipe.missingIngredients ?? recipe.missing
      )
        .map((x) => String(x).trim())
        .filter(Boolean);

      const missingSet = new Set(missingList.map((x) => x.toLowerCase()));

      // Helper: does this ingredient look like something the user has?
      // (handles "onion" vs "onions", "garlic" inside longer lines, etc.)
      function isUserAvailable(label) {
        const low = String(label).toLowerCase();

        // exact match
        if (availableSet.has(low)) return true;

        // partial match either direction
        for (const a of availableSet) {
          if (!a) continue;
          if (low.includes(a) || a.includes(low)) return true;
        }
        return false;
      }

      // Helper: is it missing?
      // Missing only if model says missing AND user did NOT type it.
      function isMissingIngredient(label) {
        const low = String(label).toLowerCase();

        const modelSaysMissing =
          missingSet.has(low) ||
          [...missingSet].some((m) => m && (low.includes(m) || m.includes(low)));

        if (!modelSaysMissing) return false;

        // user typed it => NOT missing
        if (isUserAvailable(label)) return false;

        return true;
      }

      // Combine ALL ingredients (user + recipe + missing), de-dupe
      const all = [];
      const seen = new Set();

      function addUnique(item) {
        const clean = String(item).trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        all.push(clean);
      }

      userList.forEach(addUnique);
      recipeList.forEach(addUnique);
      missingList.forEach(addUnique);

      // Render ALL with ✅/❌
      all.forEach((line) => {
        const missing = isMissingIngredient(line);

        const li = document.createElement("li");
        li.className = "modalIngredientItem";

        const badge = document.createElement("span");
        badge.className = "modalBadge " + (missing ? "isMissing" : "isOk");
        badge.textContent = missing ? "✕" : "✓";

        const text = document.createElement("span");
        text.className = "modalIngredientText";
        text.textContent = line;

        li.appendChild(badge);
        li.appendChild(text);

        if (missing) {
          const miss = document.createElement("span");
          miss.className = "modalMissingTag";
          miss.textContent = "(Missing)";
          li.appendChild(miss);
        }

        ingList.appendChild(li);
      });

      if (!all.length) {
        const empty = document.createElement("li");
        empty.className = "modalIngredientItem";
        empty.textContent = "No ingredients available for this recipe.";
        ingList.appendChild(empty);
      }

      ingredientsSection.appendChild(ingHeading);
      ingredientsSection.appendChild(ingList);

      // ---- Instructions section ----
      const instructionsSection = document.createElement("section");
      instructionsSection.className = "modalSection";

      const stepHeading = document.createElement("h3");
      stepHeading.className = "modalSectionTitle";
      stepHeading.textContent = "Instructions";

      const stepsList = document.createElement("ol");
      stepsList.className = "modalSteps";

      const steps = normalizeList(
  recipe.steps ?? recipe.instructions ?? recipe.method
);

steps.forEach((s, i) => {
  const li = document.createElement("li");
  li.className = "modalStep";

  const num = document.createElement("span");
  num.className = "modalStepNum";
  num.textContent = String(i + 1);

  const txt = document.createElement("div");
  txt.className = "modalStepText";
  txt.textContent = formatStep(s); // 👈 FIX HERE

  li.appendChild(num);
  li.appendChild(txt);
  stepsList.appendChild(li);
});


      instructionsSection.appendChild(stepHeading);
      instructionsSection.appendChild(stepsList);

      // Optional additions (only show if exists)
      const optional = normalizeList(
        recipe.optional_additions ?? recipe.optionalAdditions ?? recipe.optional
      );
      let optionalSection = null;
      if (optional.length) {
        optionalSection = document.createElement("section");
        optionalSection.className = "modalSection";

        const optHeading = document.createElement("h3");
        optHeading.className = "modalSectionTitle";
        optHeading.textContent = "Optional Additions";

        const optList = document.createElement("ul");
        optList.className = "modalPills";

        optional.forEach((o) => {
          const pill = document.createElement("li");
          pill.className = "modalPill";
          pill.textContent = o;
          optList.appendChild(pill);
        });

        optionalSection.appendChild(optHeading);
        optionalSection.appendChild(optList);
      }

      // Footer
      const footer = document.createElement("div");
      footer.className = "modalFooter";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "modalBtn modalBtnPrimary";
      saveBtn.textContent = "Save Recipe";
      saveBtn.addEventListener("click", () => window.saveRecipe(recipe.title || ""));

      const backBtn2 = document.createElement("button");
      backBtn2.type = "button";
      backBtn2.className = "modalBtn";
      backBtn2.textContent = "Back to Results";

      footer.appendChild(saveBtn);
      footer.appendChild(backBtn2);

      body.appendChild(hero);
      body.appendChild(title);
      if (meta.textContent) body.appendChild(meta);
      body.appendChild(ingredientsSection);
      body.appendChild(instructionsSection);
      if (optionalSection) body.appendChild(optionalSection);
      body.appendChild(footer);

      function close() {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
      function onKey(e) {
        if (e.key === "Escape") close();
      }

      closeBtn.addEventListener("click", close);
      backBtn.addEventListener("click", close);
      backBtn2.addEventListener("click", close);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });
      document.addEventListener("keydown", onKey);

      box.appendChild(header);
      box.appendChild(body);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
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
      return localStorage.getItem("token") || localStorage.getItem("auth_token") || "";
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

    // ===============================
    // View Recipe Details (NEW MODAL)
    // ===============================
    window.showRecipeDetails = function (recipeTitle) {
      const r = recipeByTitle.get(recipeTitle);
      if (!r) return;

      const raw = (ingredientsEl.value || "").trim();
      const userIngredients = raw
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      openRecipeModal(r, userIngredients);
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
