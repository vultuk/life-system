import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ service: "notes" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "notes" });
});

const port = Number(process.env.NOTES_PORT) || 3003;

console.log(`Notes service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
