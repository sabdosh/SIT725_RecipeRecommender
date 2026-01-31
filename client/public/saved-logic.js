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

  function renderRecipes(recipes) {
    savedGridEl.innerHTML = "";
    recipeByTitle.clear();

    recipes.forEach((r) => {
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
          </div>
        </div>
      `;

      savedGridEl.appendChild(card);
    });
  }

  window.showRecipeDetails = function (recipeTitle) {
    const r = recipeByTitle.get(recipeTitle);

    if (!r) {
      showTextModal("Details for: " + recipeTitle);
      return;
    }

    const steps = normalizeList(r.steps ?? r.instructions ?? r.method);
    const ingredients = normalizeList(
      r.ingredients ?? r.ingredientList
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

  const token =
    localStorage.getItem("token") || localStorage.getItem("auth_token");

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
