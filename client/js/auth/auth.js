// /client/js/auth/auth.js
export async function login({ username, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

export async function register({ username, password }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Register failed");
  return data;
}

// Auth page mounting functionality
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

  registerLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert("Enter a username and password first.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({ username, password });
      if (result?.token) {
        localStorage.setItem("auth_token", result.token);
        alert("Registered successfully. Redirecting...");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ username, password });
      if (result?.token) {
        localStorage.setItem("auth_token", result.token);
        alert("Login successful. Redirecting...");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      alert(err.message);
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