let mountEl = null;

export function mountStatusBanner(el) {
  mountEl = el;
  clear();
}

export function setBanner(banner) {
  if (!mountEl) return;

  clear();
  if (!banner) return;

  const div = document.createElement("div");
  div.className = `banner ${banner.type === "success" ? "banner--success" : "banner--error"}`;
  div.textContent = banner.message || "";
  mountEl.appendChild(div);
}

function clear() {
  if (!mountEl) return;
  mountEl.innerHTML = "";
}
