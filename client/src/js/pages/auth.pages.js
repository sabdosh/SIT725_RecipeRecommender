import { login } from "../api/auth.api.js";
import { mountStatusBanner, setBanner } from "../components/statusBanner.js";

export function mountAuthPage() {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const registerLink = document.getElementById("registerLink");
  const statusMount = document.getElementById("statusMount");

  if (!form || !usernameInput || !passwordInput || !loginBtn || !statusMount) {
    // Fail fast if markup changed
    console.error("Auth page: required elements missing");
    return;
  }

  mountStatusBanner(statusMount);

  registerLink?.addEventListener("click", (e) => {
    e.preventDefault();
    setBanner({ type: "error", message: "Register page not implemented (minimal scope)." });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Minimal validation
    if (!username || !password) {
      setBanner({ type: "error", message: "Please enter both username and password." });
      return;
    }

    setLoading(true);
    setBanner(null);

    try {
      const result = await login({ username, password });

      // Success contract: token exists
      if (result?.token) {
        localStorage.setItem("auth_token", result.token);
        setBanner({ type: "success", message: "Login successful. Redirecting..." });

        // Minimal navigation (replace with your real next page route)
        window.location.href = "/client/public/next.html";
        return;
      }

      // If server returns 200 but no token, treat as error (reliable behaviour)
      setBanner({ type: "error", message: "Login failed: missing token." });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Login failed." });
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "Logging in..." : "Log In";
    usernameInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
  }
}
