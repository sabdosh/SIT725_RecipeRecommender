const { MongoMemoryServer } = require("mongodb-memory-server");

const PORT = Number(process.env.PORT || 3001);
process.env.PORT = String(PORT);
process.env.JWT_SECRET = process.env.JWT_SECRET || "e2e_secret";
process.env.GEMINI_STUB = "1";

let mongo;
let server;

async function start() {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  const app = require("../../server/app");
  server = app.listen(PORT, () => {
    console.log(`E2E server running at http://localhost:${PORT}`);
  });
}

async function stop() {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  } catch (_) {}

  try {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  } catch (_) {}

  try {
    if (mongo) await mongo.stop();
  } catch (_) {}
}

process.on("SIGINT", async () => {
  await stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stop();
  process.exit(0);
});

start().catch(async () => {
  await stop();
  process.exit(1);
});
