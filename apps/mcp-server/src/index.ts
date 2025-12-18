import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ service: "mcp-server" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "mcp-server" });
});

const port = Number(process.env.PORT) || 3005;

console.log(`MCP Server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
