import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import { authMiddleware, getUser } from "../middleware/auth";
import { proxyRequest } from "../middleware/proxy";

type NotesEnv = {
  Variables: {
    user: UserContext;
  };
};

const notesRoutes = new Hono<NotesEnv>();

const getNotesServiceUrl = () => {
  const url = process.env.NOTES_SERVICE_URL;
  if (!url) {
    throw new Error("NOTES_SERVICE_URL environment variable is not set");
  }
  return url;
};

// Apply auth middleware to all routes
notesRoutes.use("/*", authMiddleware());

// List notes
notesRoutes.get("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getNotesServiceUrl(),
    path: "/notes",
    user,
  });
});

// Create note
notesRoutes.post("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getNotesServiceUrl(),
    path: "/notes",
    user,
  });
});

// Get single note
notesRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getNotesServiceUrl(),
    path: `/notes/${id}`,
    user,
  });
});

// Update note
notesRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getNotesServiceUrl(),
    path: `/notes/${id}`,
    user,
  });
});

// Delete note
notesRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getNotesServiceUrl(),
    path: `/notes/${id}`,
    user,
  });
});

export { notesRoutes };
