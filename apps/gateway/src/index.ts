import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Life System Gateway" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "gateway" });
});

const port = Number(process.env.GATEWAY_PORT) || 3000;

console.log(`Gateway running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
