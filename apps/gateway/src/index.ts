import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AppError,
  createApiErrorResponse,
} from "@life/shared";
import { authRoutes, tasksRoutes } from "./routes";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "gateway" });
});

// Mount routes
app.route("/auth", authRoutes);
app.route("/tasks", tasksRoutes);

// Global error handler
app.onError((err, c) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return c.json(
      createApiErrorResponse(err.message),
      err.statusCode as ContentfulStatusCode
    );
  }

  // Handle Hono HTTPException
  if (err.name === "HTTPException") {
    const httpErr = err as { status?: number; message?: string };
    const status = (httpErr.status || 500) as ContentfulStatusCode;
    return c.json(
      createApiErrorResponse(httpErr.message || "An error occurred"),
      status
    );
  }

  return c.json(createApiErrorResponse("Internal server error"), 500);
});

// 404 handler
app.notFound((c) => {
  return c.json(createApiErrorResponse("Not found"), 404);
});

const port = Number(process.env.PORT) || 3000;

console.log(`Gateway running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
