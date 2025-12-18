import { Hono } from "hono";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, createApiErrorResponse } from "@life/shared";
import { userContextMiddleware } from "./middleware";
import { categoryRoutes } from "./routes";

const app = new Hono();

// Global middleware
app.use("*", logger());

// Health check (no auth required)
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "categories" });
});

// Apply user context middleware to all category routes
app.use("/categories", userContextMiddleware());
app.use("/categories/*", userContextMiddleware());

// Mount category routes
app.route("/categories", categoryRoutes);

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

const port = Number(process.env.PORT) || 3006;

console.log(`Categories service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
