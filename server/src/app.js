import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import tlRoutes from "./routes/tlRoutes.js";
import pointsRoutes from "./routes/pointsRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// Do not tell the world which framework runs the server
app.disable("x-powered-by");

// Basic safety headers for every response
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Reject oversized request bodies
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tl", tlRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/director", dashboardRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ViaVistas WorkHub API is running.",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

export default app;