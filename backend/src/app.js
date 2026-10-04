require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Leave Management API is running",
  });
});


// Routes
app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/leaves",
  require("./routes/leaveRoutes")
);

app.use(
  "/api/employees",
  require("./routes/employeeRoutes")
);

app.use(
  "/api/dashboard",
  require("./routes/dashboardRoutes")
);

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);

app.use(
  "/api/leave-types",
  require("./routes/leaveTypeRoutes")
);


// 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Internal server error",
  });
});


module.exports = app;
