import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import {
  createApiResponse,
  ValidationError,
  createPaginatedResponse,
} from "@life/shared";
import { getUser } from "../middleware/userContext";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "../schemas/categories";
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categories";

type CategoriesEnv = {
  Variables: {
    user: UserContext;
  };
};

const categoryRoutes = new Hono<CategoriesEnv>();

// List categories
categoryRoutes.get("/", async (c) => {
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

// Create category
categoryRoutes.post("/", async (c) => {
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

// Get single category
categoryRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const category = await getCategoryById(user.userId, id);

  return c.json(createApiResponse(category));
});

// Update category
categoryRoutes.put("/:id", async (c) => {
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

// Delete category
categoryRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  await deleteCategory(user.userId, id);

  return c.json(createApiResponse({ deleted: true }));
});

export { categoryRoutes };
