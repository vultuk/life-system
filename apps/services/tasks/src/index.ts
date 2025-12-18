import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ service: "tasks" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "tasks" });
});

const port = Number(process.env.TASKS_PORT) || 3002;

console.log(`Tasks service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
