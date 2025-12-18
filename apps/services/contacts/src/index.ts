import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ service: "contacts" });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "contacts" });
});

const port = Number(process.env.PORT) || 3001;

console.log(`Contacts service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
