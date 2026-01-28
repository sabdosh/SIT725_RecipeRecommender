// /client/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return; // Not on login page

  const loginBtn = document.getElementById("loginBtn");
  const registerLink = document.getElementById("registerLink");

  // Handle registration
  if (registerLink) {
    registerLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      
      if (!username || !password) {
        alert("Enter a username and password first.");
        return;
      }
      
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
          window.location.href = "/dashboard";
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (error) {
        alert("Registration error: " + error.message);
      }
    });
  }

  // Handle login
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        window.location.href = "/dashboard";
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      alert("Login error: " + error.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Log In";
    }
  });
});