import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import {
  createApiResponse,
  ValidationError,
  createPaginatedResponse,
} from "@life/shared";
import { getUser } from "../middleware/userContext";
import {
  createHabitSchema,
  updateHabitSchema,
  habitQuerySchema,
  createHabitLogSchema,
  habitLogQuerySchema,
} from "../schemas/habits";
import {
  listHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  createHabitLog,
  listHabitLogs,
} from "../services/habits";

type HabitsEnv = {
  Variables: {
    user: UserContext;
  };
};

const habitRoutes = new Hono<HabitsEnv>();

// List habits
habitRoutes.get("/", async (c) => {
  const user = getUser(c);
  const query = c.req.query();

  const parsed = habitQuerySchema.safeParse(query);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const result = await listHabits(user.userId, parsed.data);

  return c.json(
    createApiResponse(
      createPaginatedResponse(result.items, result.total, result.page, result.limit)
    )
  );
});

// Create habit
habitRoutes.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();

  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const habit = await createHabit(user.userId, parsed.data);

  return c.json(createApiResponse(habit), 201);
});

// Get single habit
habitRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const habit = await getHabitById(user.userId, id);

  return c.json(createApiResponse(habit));
});

// Update habit
habitRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = updateHabitSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const habit = await updateHabit(user.userId, id, parsed.data);

  return c.json(createApiResponse(habit));
});

// Delete habit
habitRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  await deleteHabit(user.userId, id);

  return c.json(createApiResponse({ deleted: true }));
});

// Log habit completion
habitRoutes.post("/:id/log", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = createHabitLogSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const log = await createHabitLog(user.userId, id, parsed.data);

  return c.json(createApiResponse(log), 201);
});

// Get habit logs
habitRoutes.get("/:id/logs", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const query = c.req.query();

  const parsed = habitLogQuerySchema.safeParse(query);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const result = await listHabitLogs(user.userId, id, parsed.data);

  return c.json(
    createApiResponse(
      createPaginatedResponse(result.items, result.total, result.page, result.limit)
    )
  );
});

export { habitRoutes };
