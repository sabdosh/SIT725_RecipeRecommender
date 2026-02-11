const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:3001"
  },
  webServer: {
    command: "node tests/e2e/start-server.js",
    url: "http://localhost:3001/api/gemini/health",
    reuseExistingServer: !process.env.CI
  }
});