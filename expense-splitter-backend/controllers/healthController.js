const { getIo } = require("../services/socket");

const healthCheck = (req, res) => {
  const io = getIo();

  io.emit("server:health", {
    status: "ok",
    time: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    message: "Expense Splitter backend is running",
  });
};

module.exports = { healthCheck };
