import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import { authMiddleware, getUser } from "../middleware/auth";
import { proxyRequest } from "../middleware/proxy";

type HabitsEnv = {
  Variables: {
    user: UserContext;
  };
};

const habitsRoutes = new Hono<HabitsEnv>();

const getHabitsServiceUrl = () => {
  const url = process.env.HABITS_SERVICE_URL;
  if (!url) {
    throw new Error("HABITS_SERVICE_URL environment variable is not set");
  }
  return url;
};

// Apply auth middleware to all routes
habitsRoutes.use("/*", authMiddleware());

// List habits
habitsRoutes.get("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: "/habits",
    user,
  });
});

// Create habit
habitsRoutes.post("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: "/habits",
    user,
  });
});

// Get single habit
habitsRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: `/habits/${id}`,
    user,
  });
});

// Update habit
habitsRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: `/habits/${id}`,
    user,
  });
});

// Delete habit
habitsRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: `/habits/${id}`,
    user,
  });
});

// Log habit completion
habitsRoutes.post("/:id/log", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: `/habits/${id}/log`,
    user,
  });
});

// Get habit logs
habitsRoutes.get("/:id/logs", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getHabitsServiceUrl(),
    path: `/habits/${id}/logs`,
    user,
  });
});

export { habitsRoutes };
