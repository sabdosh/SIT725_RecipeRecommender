import { login, register } from "../api/auth.api.js";
import { mountStatusBanner, setBanner } from "../components/statusBanner.js";

export function mountAuthPage() {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const registerLink = document.getElementById("registerLink");
  const statusMount = document.getElementById("statusMount");

  if (!form || !usernameInput || !passwordInput || !loginBtn || !statusMount) {
    console.error("Auth page: required elements missing");
    return;
  }

  mountStatusBanner(statusMount);

  registerLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setBanner({ type: "error", message: "Enter a username and password first." });
      return;
    }

    setLoading(true);
    setBanner(null);

    try {
      const result = await register({ username, password });
      if (result?.token) {
        localStorage.setItem("auth_token", result.token);
        setBanner({ type: "success", message: "Registered successfully. Redirecting..." });
        window.location.href = "/ingredients.html";
      }
    } catch (err) {
      setBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setBanner({ type: "error", message: "Please enter both username and password." });
      return;
    }

    setLoading(true);
    setBanner(null);

    try {
      const result = await login({ username, password });
      if (result?.token) {
        localStorage.setItem("auth_token", result.token);
        setBanner({ type: "success", message: "Login successful. Redirecting..." });
        window.location.href = "/ingredients.html";
      }
    } catch (err) {
      setBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "Loading..." : "Log In";
    usernameInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
  }
}
