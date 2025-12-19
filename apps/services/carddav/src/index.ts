import { Hono } from "hono";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError, createApiErrorResponse } from "@life/shared";
import { basicAuthMiddleware } from "./middleware";
import { carddavRoutes } from "./routes";

const app = new Hono();

// Global middleware
app.use("*", logger());

// Normalize trailing slashes - /carddav/ becomes /carddav
app.use(trimTrailingSlash());

// Health check (no auth required)
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "carddav" });
});

// Apply basic auth middleware to all CardDAV routes
// Note: OPTIONS requests should pass through for CORS preflight
app.use("/carddav/*", async (c, next) => {
  // Allow OPTIONS without auth
  if (c.req.method === "OPTIONS") {
    return next();
  }
  return basicAuthMiddleware()(c, next);
});

// Mount CardDAV routes
app.route("/carddav", carddavRoutes);

// Global error handler
app.onError((err, c) => {
  console.error("CardDAV Error:", err);

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

const port = Number(process.env.PORT) || 3007;

console.log(`CardDAV service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
