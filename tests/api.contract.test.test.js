const chai = require("chai");
const { expect } = chai;

const BASE_URL = "http://localhost:3000";

describe("API contract tests", () => {
  describe("Auth endpoints", () => {
    it("POST /api/auth/login returns expected keys", async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "test" }),
      });

      expect(res.status).to.be.within(200, 401);

      let body = {};
      try {
        body = await res.json();
      } catch (e) {
        body = {};
      }

      expect(body).to.be.an("object");
      expect(Object.keys(body)).to.satisfy(
        (keys) => keys.includes("token") || keys.includes("message")
      );
    });
  });
});
