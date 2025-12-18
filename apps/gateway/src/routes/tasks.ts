import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import { authMiddleware, getUser } from "../middleware/auth";
import { proxyRequest } from "../middleware/proxy";

type TasksEnv = {
  Variables: {
    user: UserContext;
  };
};

const tasksRoutes = new Hono<TasksEnv>();

const getTasksServiceUrl = () => {
  const url = process.env.TASKS_SERVICE_URL;
  if (!url) {
    throw new Error("TASKS_SERVICE_URL environment variable is not set");
  }
  return url;
};

// Apply auth middleware to all routes
tasksRoutes.use("/*", authMiddleware());

// List tasks
tasksRoutes.get("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: "/tasks",
    user,
  });
});

// Create task
tasksRoutes.post("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: "/tasks",
    user,
  });
});

// Get single task
tasksRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}`,
    user,
  });
});

// Update task
tasksRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}`,
    user,
  });
});

// Delete task
tasksRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}`,
    user,
  });
});

// --- Note linking routes ---

// Get linked notes
tasksRoutes.get("/:id/notes", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}/notes`,
    user,
  });
});

// Link note to task
tasksRoutes.post("/:id/notes/:noteId", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const noteId = c.req.param("noteId");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}/notes/${noteId}`,
    user,
  });
});

// Unlink note from task
tasksRoutes.delete("/:id/notes/:noteId", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const noteId = c.req.param("noteId");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}/notes/${noteId}`,
    user,
  });
});

// --- Contact linking routes ---

// Get linked contacts
tasksRoutes.get("/:id/contacts", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}/contacts`,
    user,
  });
});

// Link contact to task
tasksRoutes.post("/:id/contacts/:contactId", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const contactId = c.req.param("contactId");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}/contacts/${contactId}`,
    user,
  });
});

// Unlink contact from task
tasksRoutes.delete("/:id/contacts/:contactId", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const contactId = c.req.param("contactId");
  return proxyRequest(c, {
    baseUrl: getTasksServiceUrl(),
    path: `/tasks/${id}/contacts/${contactId}`,
    user,
  });
});

export { tasksRoutes };
