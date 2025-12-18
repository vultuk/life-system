import { Hono } from "hono";
import { html } from "hono/html";

const app = new Hono();

app.get("/", (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Life System</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
          }
          .container {
            text-align: center;
            padding: 2rem;
          }
          h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(90deg, #00d9ff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #888;
            font-size: 1.2rem;
            margin-bottom: 2rem;
          }
          .status {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 2rem;
            color: #00ff88;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Life System</h1>
          <p>Personal life management platform</p>
          <span class="status">Frontend coming soon — TanStack Start</span>
        </div>
      </body>
    </html>
  `);
});

app.get("/health", (c) => {
  return c.json({ status: "ok", service: "web" });
});

const port = Number(process.env.PORT) || 3000;

console.log(`Web frontend running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
