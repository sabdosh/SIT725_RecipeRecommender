export async function login({ username, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response
    data = null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Login failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  // Expected: { token: string, ... }
  return data;
}
