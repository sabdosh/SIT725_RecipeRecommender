import { mountAuthPage } from "./pages/auth.pages.js";

document.addEventListener("DOMContentLoaded", () => {
  mountAuthPage();
});
async function handleLogin(username, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.token) {
    window.location.href = "/ingredients.html";
  } else {
    alert(data.message);
  }
}

window.handleLogin = handleLogin;

document.querySelectorAll("[data-quick-add]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = btn.getAttribute("data-quick-add");
    const textarea = document.querySelector("#ingredientsInput");
    if (!textarea) return;

    const current = textarea.value.trim();
    textarea.value = current ? `${current}, ${value}` : value;
    textarea.focus();
  });
});

