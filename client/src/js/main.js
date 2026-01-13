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
    window.location.href = "/dashboard";
  } else {
    alert(data.message);
  }
}

// expose function globally for your login form
window.handleLogin = handleLogin;
