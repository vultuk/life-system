import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import { authMiddleware, getUser } from "../middleware/auth";
import { proxyRequest } from "../middleware/proxy";

type CategoriesEnv = {
  Variables: {
    user: UserContext;
  };
};

const categoriesRoutes = new Hono<CategoriesEnv>();

const getCategoriesServiceUrl = () => {
  const url = process.env.CATEGORIES_SERVICE_URL;
  if (!url) {
    throw new Error("CATEGORIES_SERVICE_URL environment variable is not set");
  }
  return url;
};

// Apply auth middleware to all routes
categoriesRoutes.use("/*", authMiddleware());

// List categories
categoriesRoutes.get("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getCategoriesServiceUrl(),
    path: "/categories",
    user,
  });
});

// Create category
categoriesRoutes.post("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getCategoriesServiceUrl(),
    path: "/categories",
    user,
  });
});

// Get single category
categoriesRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getCategoriesServiceUrl(),
    path: `/categories/${id}`,
    user,
  });
});

// Update category
categoriesRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getCategoriesServiceUrl(),
    path: `/categories/${id}`,
    user,
  });
});

// Delete category
categoriesRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getCategoriesServiceUrl(),
    path: `/categories/${id}`,
    user,
  });
});

export { categoriesRoutes };
