require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) return next(new Error("Unauthorized"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    return next();
  } catch (e) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  if (socket.data.userId) socket.join(socket.data.userId);
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
