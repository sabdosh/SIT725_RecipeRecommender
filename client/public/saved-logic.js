// client/public/saved-logic.js
(function () {
  const statusEl = document.getElementById("status");
  const emptyStateEl = document.getElementById("emptyState");
  const savedSectionEl = document.getElementById("savedSection");
  const savedGridEl = document.getElementById("savedGrid");

  function setStatus(msg, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = isError ? "crimson" : "inherit";
  }

  function renderRecipes(recipes) {
    savedGridEl.innerHTML = "";
    recipes.forEach((r) => {
      const card = document.createElement("article");
      card.className = "recipe-card";
      card.innerHTML = `
        <h3 class="recipe-card__title">${r.title || "Untitled Recipe"}</h3>
        <p class="recipe-card__desc">${r.description || ""}</p>
      `;
      savedGridEl.appendChild(card);
    });
  }

  const token = localStorage.getItem("token");

  // ✅ NO AUTH YET → just show empty state
  if (!token) {
    emptyStateEl.hidden = false;
    savedSectionEl.hidden = true;
    setStatus("");
    return;
  }

  // (Future backend integration starts here)
  const SAVED_API_URL = "/api/saved";

  async function loadSaved() {
    try {
      setStatus("Loading saved recipes…");

      const res = await fetch(SAVED_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);
      const recipes = data?.recipes || [];

      if (!recipes.length) {
        emptyStateEl.hidden = false;
        savedSectionEl.hidden = true;
        setStatus("");
        return;
      }

      emptyStateEl.hidden = true;
      savedSectionEl.hidden = false;
      renderRecipes(recipes);
      setStatus("");
    } catch (err) {
      emptyStateEl.hidden = false;
      savedSectionEl.hidden = true;
      setStatus("Unable to load saved recipes.", true);
    }
  }

  loadSaved();
})();
