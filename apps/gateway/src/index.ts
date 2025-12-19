import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AppError,
  createApiErrorResponse,
} from "@life/shared";
import { authRoutes, tasksRoutes, contactsRoutes, notesRoutes, habitsRoutes, categoriesRoutes, oauthRoutes, carddavRoutes, mcpRoutes } from "./routes";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PROPFIND", "REPORT", "HEAD"],
    allowHeaders: ["Content-Type", "Authorization", "Depth", "If-Match", "If-None-Match", "mcp-session-id", "mcp-protocol-version"],
    exposeHeaders: ["mcp-session-id"],
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "gateway" });
});

// CardDAV well-known discovery endpoints (RFC 6764)
// These must be handled BEFORE other routes and WITHOUT auth
app.get("/.well-known/carddav", (c) => c.redirect("/carddav", 301));
app.on("PROPFIND", "/.well-known/carddav", (c) => c.redirect("/carddav", 301));

// CalDAV well-known returns 404 (we don't support calendars)
app.get("/.well-known/caldav", (c) => c.notFound());
app.on("PROPFIND", "/.well-known/caldav", (c) => c.notFound());

// CardDAV routes (no gateway auth - service handles Basic Auth)
app.route("/carddav", carddavRoutes);

// MCP routes (no gateway auth - service handles Bearer token auth)
app.route("/mcp", mcpRoutes);

// MCP OAuth Protected Resource Metadata
app.get("/.well-known/oauth-protected-resource", (c) => {
  const gatewayUrl = process.env.GATEWAY_URL || `http://localhost:${process.env.PORT || 3000}`;
  return c.json({
    resource: gatewayUrl,
    authorization_servers: [gatewayUrl],
    scopes_supported: ["openid", "profile", "tasks", "contacts", "notes", "habits"],
    bearer_methods_supported: ["header"],
    resource_name: "Life System MCP Server",
  });
});

// Mount routes
app.route("/auth", authRoutes);
app.route("/tasks", tasksRoutes);
app.route("/contacts", contactsRoutes);
app.route("/notes", notesRoutes);
app.route("/habits", habitsRoutes);
app.route("/categories", categoriesRoutes);

// OAuth routes (mounted at root for /.well-known and /oauth)
app.route("/", oauthRoutes);
app.route("/oauth", oauthRoutes);

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
