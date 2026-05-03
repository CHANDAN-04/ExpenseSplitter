const http = require("http");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

// Validate environment variables before anything else
const { validateEnvironment } = require("./config/validateEnv");
const logger = require("./utils/logger");

try {
  validateEnvironment();
} catch (error) {
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");
const { setIo } = require("./services/socket");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

setIo(io);

io.on("connection", (socket) => {
  socket.emit("server:connected", { id: socket.id });

  socket.on("join:user", (userId) => {
    if (!userId) {
      return;
    }
    socket.join(`user:${userId}`);
  });

  socket.on("join:group", (groupId) => {
    if (!groupId) {
      return;
    }
    socket.join(`group:${groupId}`);
  });

  socket.on("leave:group", (groupId) => {
    if (!groupId) {
      return;
    }
    socket.leave(`group:${groupId}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Server failed to start", error);
    process.exit(1);
  }
};

startServer();
