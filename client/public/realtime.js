(function () {
  function getAuthToken() {
    return localStorage.getItem("token") || localStorage.getItem("auth_token") || "";
  }

  function ensureToastRoot() {
    let root = document.getElementById("toastRoot");
    if (root) return root;

    root = document.createElement("div");
    root.id = "toastRoot";
    root.style.position = "fixed";
    root.style.right = "16px";
    root.style.bottom = "16px";
    root.style.zIndex = "9999";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.gap = "10px";
    document.body.appendChild(root);
    return root;
  }

  function toast(message) {
    const root = ensureToastRoot();
    const el = document.createElement("div");
    el.textContent = String(message);
    el.style.padding = "10px 12px";
    el.style.borderRadius = "10px";
    el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18)";
    el.style.background = "#111827";
    el.style.color = "#fff";
    el.style.fontSize = "14px";
    el.style.maxWidth = "320px";
    el.style.lineHeight = "1.35";
    root.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 250ms ease";
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const token = getAuthToken();
    if (!token) return;

    const scriptId = "socketIoClient";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "/socket.io/socket.io.js";
      s.defer = true;
      s.onload = connect;
      document.head.appendChild(s);
    } else {
      connect();
    }

    function connect() {
      if (typeof io !== "function") return;

      const socket = io({
        auth: { token }
      });

      socket.on("notification", (payload) => {
        console.log("Notification received:", payload);

        let msg = "Notification";

        if (typeof payload === "string") {
          msg = payload;
        } else if (payload && payload.message) {
          msg = payload.message;
        } else {
          msg = JSON.stringify(payload);
        }

        toast(msg);
      });

      socket.on("connect_error", () => {});
      window.__recipeSocket = socket;
    }
  });
})();
