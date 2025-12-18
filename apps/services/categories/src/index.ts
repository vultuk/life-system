import { Hono } from "hono";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UserContext } from "@life/shared";
import {
  AppError,
  createApiErrorResponse,
  createApiResponse,
  ValidationError,
  createPaginatedResponse,
} from "@life/shared";
import { userContextMiddleware, getUser } from "./middleware";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "./schemas/categories";
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./services/categories";

type CategoriesEnv = {
  Variables: {
    user: UserContext;
  };
};

const app = new Hono<CategoriesEnv>();

// Global middleware
app.use("*", logger());

// Health check (no auth required)
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "categories" });
});

// Apply user context middleware to all category routes
app.use("/categories", userContextMiddleware());
app.use("/categories/*", userContextMiddleware());

// List categories - GET /categories
app.get("/categories", async (c) => {
  const user = getUser(c);
  const query = c.req.query();

  const parsed = categoryQuerySchema.safeParse(query);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const result = await listCategories(user.userId, parsed.data);

  return c.json(
    createApiResponse(
      createPaginatedResponse(result.items, result.total, result.page, result.limit)
    )
  );
});

// Create category - POST /categories
app.post("/categories", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const category = await createCategory(user.userId, parsed.data);

  return c.json(createApiResponse(category), 201);
});

// Get single category - GET /categories/:id
app.get("/categories/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const category = await getCategoryById(user.userId, id);

  return c.json(createApiResponse(category));
});

// Update category - PUT /categories/:id
app.put("/categories/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const category = await updateCategory(user.userId, id, parsed.data);

  return c.json(createApiResponse(category));
});

// Delete category - DELETE /categories/:id
app.delete("/categories/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  await deleteCategory(user.userId, id);

  return c.json(createApiResponse({ deleted: true }));
});

// Global error handler
app.onError((err, c) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return c.json(
      createApiErrorResponse(err.message),
      err.statusCode as ContentfulStatusCode
    );
  }

  // Handle Hono HTTPException
  if (err.name === "HTTPException") {
    const httpErr = err as { status?: number; message?: string };
    const status = (httpErr.status || 500) as ContentfulStatusCode;
    return c.json(
      createApiErrorResponse(httpErr.message || "An error occurred"),
      status
    );
  }

  return c.json(createApiErrorResponse("Internal server error"), 500);
});

// 404 handler
app.notFound((c) => {
  return c.json(createApiErrorResponse("Not found"), 404);
});

const port = Number(process.env.PORT) || 3006;

console.log(`Categories service running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
