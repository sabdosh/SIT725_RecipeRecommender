// client/public/saved-logic.js
(function () {
  const statusEl = document.getElementById("status");
  const emptyStateEl = document.getElementById("emptyState");
  const savedSectionEl = document.getElementById("savedSection");
  const savedGridEl = document.getElementById("savedGrid");
  const recipeByTitle = new Map();
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      window.location.href = "/public/index.html";
    });
  }

  function setStatus(msg, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
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

  // Kept for safety fallback (unchanged behaviour if recipe not found)
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

  function setVisible(el, isVisible) {
    if (!el) return;
    el.hidden = !isVisible;
    el.style.display = isVisible ? "" : "none";
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

  // --- Match dashboard modal behaviour (same classes/styles) ---
  function formatStep(step) {
    if (!step) return "";
    let s = String(step).trim();
    if (!s) return "";

    // Capitalise first letter
    s = s.charAt(0).toUpperCase() + s.slice(1);

    // Add full stop if missing
    if (!/[.!?]$/.test(s)) s += ".";

    return s;
  }

  function openRecipeModalSaved(recipe) {
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

    // Title
    const title = document.createElement("h2");
    title.className = "modalTitle";
    title.textContent = recipe.title || "Recipe";

    // Meta
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

// In saved recipes, ingredients = what the recipe requires
const ingredients = normalizeList(
  recipe.ingredients ??
    recipe.ingredientsList ??
    recipe.ingredient_list ??
    recipe.ingredientList ??
    recipe.ingredients_used ??
    recipe.usedIngredients ??
    recipe.missing_ingredients ??
    recipe.missingIngredients ??
    recipe.missing
)
  .map((x) => String(x).trim())
  .filter(Boolean);

// Deduplicate
const seen = new Set();
const uniqueIngredients = [];
for (const item of ingredients) {
  const key = item.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  uniqueIngredients.push(item);
}

// Render plain bullets
uniqueIngredients.forEach((line) => {
  const li = document.createElement("li");
  li.textContent = line;
  ingList.appendChild(li);
});

if (!uniqueIngredients.length) {
  const empty = document.createElement("li");
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

    const steps = normalizeList(recipe.steps ?? recipe.instructions ?? recipe.method);

    steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "modalStep";

      const num = document.createElement("span");
      num.className = "modalStepNum";
      num.textContent = String(i + 1);

      const txt = document.createElement("div");
      txt.className = "modalStepText";
      txt.textContent = formatStep(s);

      li.appendChild(num);
      li.appendChild(txt);
      stepsList.appendChild(li);
    });

    instructionsSection.appendChild(stepHeading);
    instructionsSection.appendChild(stepsList);

    // ---- Optional additions ----
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

    // Footer (matches dashboard layout style)
    const footer = document.createElement("div");
    footer.className = "modalFooter";

    const backBtn2 = document.createElement("button");
    backBtn2.type = "button";
    backBtn2.className = "modalBtn";
    backBtn2.textContent = "Back to Saved";

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
    savedGridEl.innerHTML = "";
    recipeByTitle.clear();

    recipes.forEach((r) => {
      const key = (r.title || "").toString();
      if (key) recipeByTitle.set(key, r);
      const rid = (r._id || r.id || "").toString();

      const card = document.createElement("article");
      card.className = "recipe-card";
      if (rid) card.dataset.recipeId = rid;

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
            <a href="#" class="btn btn--secondary" onclick="event.preventDefault(); removeSavedRecipe('${escapeHtml(
              rid
            )}')">Remove</a>
          </div>
        </div>
      `;

      savedGridEl.appendChild(card);
    });
  }

  // Uses new modal UI (same as dashboard). Keeps showTextModal only as fallback.
  window.showRecipeDetails = function (recipeTitle) {
    const r = recipeByTitle.get(recipeTitle);

    if (!r) {
      showTextModal("Details for: " + recipeTitle);
      return;
    }

    openRecipeModalSaved(r);
    console.log("Saved recipe object:", r);

  };

  window.removeSavedRecipe = async function (recipeId) {
    if (!recipeId) return;

    const card = document.querySelector(`[data-recipe-id="${recipeId}"]`);
    const parent = card ? card.parentNode : null;
    const next = card ? card.nextSibling : null;

    let removedKey = null;
    let removedRecipe = null;

    for (const [k, v] of recipeByTitle.entries()) {
      const rid = (v?._id || v?.id || "").toString();
      if (rid === recipeId) {
        removedKey = k;
        removedRecipe = v;
        recipeByTitle.delete(k);
        break;
      }
    }

    if (card) card.remove();

    if (savedGridEl && savedGridEl.children.length === 0) {
      setVisible(emptyStateEl, true);
      setVisible(savedSectionEl, false);
    }

    try {
      const res = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      if (parent && card) {
        if (next) parent.insertBefore(card, next);
        else parent.appendChild(card);
      }
      if (removedKey) recipeByTitle.set(removedKey, removedRecipe);
      if (savedGridEl && savedGridEl.children.length > 0) {
        setVisible(emptyStateEl, false);
        setVisible(savedSectionEl, true);
      }
      alert("Unable to remove recipe.");
    }
  };

  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");

  if (!token) {
    setVisible(emptyStateEl, true);
    setVisible(savedSectionEl, false);
    setStatus("");
    return;
  }

  const SAVED_API_URL = "/api/saved";

  async function loadSaved() {
    try {
      setVisible(emptyStateEl, false);
      setVisible(savedSectionEl, false);
      setStatus("Loading saved recipes…");

      const res = await fetch(SAVED_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      const recipes = data?.recipes || [];

      if (!recipes.length) {
        setVisible(emptyStateEl, true);
        setVisible(savedSectionEl, false);
        setStatus("");
        return;
      }

      setVisible(emptyStateEl, false);
      setVisible(savedSectionEl, true);
      renderRecipes(recipes);
      setStatus("");
    } catch (err) {
      setVisible(emptyStateEl, true);
      setVisible(savedSectionEl, false);
      setStatus("Unable to load saved recipes.", true);
    }
  }

  loadSaved();
})();
