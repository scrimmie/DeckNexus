import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import config from "@/config/config";
import { cardsRoutes } from "@/routes/cards.routes";
import deckBuilderRoutes from "@/routes/deckbuilder.routes";
import { errorHandler, notFoundHandler } from "@/middleware/error.middleware";
import type { ApiResponse } from "@/types/api";

const app = express();

// Security middleware
app.use(helmet());
app.use(compression() as any);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Logging
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req, res) => {
  const response: ApiResponse = {
    status: "success",
    message: "DeckNexus API is running",
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  };
  res.json(response);
});

// API routes
app.use("/api/v1/cards", cardsRoutes);
app.use("/api/v1/deckbuilder", deckBuilderRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 DeckNexus API server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔒 CORS origins: ${config.corsOrigin.join(", ")}`);
});

export default app;
