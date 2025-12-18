import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ service: "habits" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "habits" });
});

const port = Number(process.env.HABITS_PORT) || 3004;

console.log(`Habits service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
