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
    for (const r of recipes) {
      const missing = Array.isArray(r.missing_ingredients) ? r.missing_ingredients : [];
      const steps = Array.isArray(r.steps) ? r.steps : [];
      const opts = Array.isArray(r.optional_additions) ? r.optional_additions : [];

      const card = document.createElement("div");
      card.style.border = "1px solid #ddd";
      card.style.borderRadius = "12px";
      card.style.padding = "14px";

      card.innerHTML = `
        <h3 style="margin:0 0 8px 0;">${escapeHtml(r.title || "Recipe")}</h3>

        <div style="font-size: 0.95rem; opacity: 0.9;">
          <div><strong>Time:</strong> ${escapeHtml(r.estimated_time_minutes ?? "?")} min</div>
          <div><strong>Difficulty:</strong> ${escapeHtml(r.difficulty || "Unknown")}</div>
        </div>

        <p style="margin:10px 0;"><strong>Why it fits:</strong> ${escapeHtml(r.why_it_fits || "")}</p>

        ${
          missing.length
            ? `<p style="margin:10px 0;"><strong>Missing:</strong> ${missing.map(escapeHtml).join(", ")}</p>`
            : `<p style="margin:10px 0;"><strong>Missing:</strong> Nothing major 🎉</p>`
        }

        ${
          steps.length
            ? `<details style="margin-top: 10px;">
                <summary style="cursor:pointer; font-weight:600;">Steps</summary>
                <ol>${steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
              </details>`
            : ""
        }

        ${
          opts.length
            ? `<details style="margin-top: 10px;">
                <summary style="cursor:pointer; font-weight:600;">Optional additions</summary>
                <ul>${opts.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
              </details>`
            : ""
        }
      `;

      resultsEl.appendChild(card);
    }
  }

  async function fetchSuggestions(payload) {
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
      const data = await fetchSuggestions({ ingredients });

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
})();
