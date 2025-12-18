import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import {
  createApiResponse,
  ValidationError,
  createPaginatedResponse,
} from "@life/shared";
import { getUser } from "../middleware/userContext";
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from "../schemas/tasks";
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../services/tasks";

type TasksEnv = {
  Variables: {
    user: UserContext;
  };
};

const taskRoutes = new Hono<TasksEnv>();

// List tasks
taskRoutes.get("/", async (c) => {
  const user = getUser(c);
  const query = c.req.query();

  const parsed = taskQuerySchema.safeParse(query);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const result = await listTasks(user.userId, parsed.data);

  return c.json(
    createApiResponse(
      createPaginatedResponse(result.items, result.total, result.page, result.limit)
    )
  );
});

// Create task
taskRoutes.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const task = await createTask(user.userId, parsed.data);

  return c.json(createApiResponse(task), 201);
});

// Get single task
taskRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const task = await getTaskById(user.userId, id);

  return c.json(createApiResponse(task));
});

// Update task
taskRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const task = await updateTask(user.userId, id, parsed.data);

  return c.json(createApiResponse(task));
});

// Delete task
taskRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  await deleteTask(user.userId, id);

  return c.json(createApiResponse({ deleted: true }));
});

export { taskRoutes };
