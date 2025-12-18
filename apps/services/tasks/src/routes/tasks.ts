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
import {
  linkNoteToTask,
  unlinkNoteFromTask,
  getTaskNotes,
  linkContactToTask,
  unlinkContactFromTask,
  getTaskContacts,
} from "../services/taskLinks";

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
      createPaginatedResponse(
        result.items,
        result.total,
        result.page,
        result.limit
      )
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

// --- Note linking routes ---

// Get linked notes
taskRoutes.get("/:id/notes", async (c) => {
  const user = getUser(c);
  const taskId = c.req.param("id");

  const linkedNotes = await getTaskNotes(user.userId, taskId);

  return c.json(createApiResponse(linkedNotes));
});

// Link note to task
taskRoutes.post("/:id/notes/:noteId", async (c) => {
  const user = getUser(c);
  const taskId = c.req.param("id");
  const noteId = c.req.param("noteId");

  const link = await linkNoteToTask(user.userId, taskId, noteId);

  return c.json(createApiResponse(link), 201);
});

// Unlink note from task
taskRoutes.delete("/:id/notes/:noteId", async (c) => {
  const user = getUser(c);
  const taskId = c.req.param("id");
  const noteId = c.req.param("noteId");

  await unlinkNoteFromTask(user.userId, taskId, noteId);

  return c.json(createApiResponse({ unlinked: true }));
});

// --- Contact linking routes ---

// Get linked contacts
taskRoutes.get("/:id/contacts", async (c) => {
  const user = getUser(c);
  const taskId = c.req.param("id");

  const linkedContacts = await getTaskContacts(user.userId, taskId);

  return c.json(createApiResponse(linkedContacts));
});

// Link contact to task
taskRoutes.post("/:id/contacts/:contactId", async (c) => {
  const user = getUser(c);
  const taskId = c.req.param("id");
  const contactId = c.req.param("contactId");

  const link = await linkContactToTask(user.userId, taskId, contactId);

  return c.json(createApiResponse(link), 201);
});

// Unlink contact from task
taskRoutes.delete("/:id/contacts/:contactId", async (c) => {
  const user = getUser(c);
  const taskId = c.req.param("id");
  const contactId = c.req.param("contactId");

  await unlinkContactFromTask(user.userId, taskId, contactId);

  return c.json(createApiResponse({ unlinked: true }));
});

export { taskRoutes };
