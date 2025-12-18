import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import {
  createApiResponse,
  ValidationError,
  createPaginatedResponse,
} from "@life/shared";
import { getUser } from "../middleware/userContext";
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
} from "../schemas/notes";
import {
  listNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../services/notes";

type NotesEnv = {
  Variables: {
    user: UserContext;
  };
};

const noteRoutes = new Hono<NotesEnv>();

// List notes
noteRoutes.get("/", async (c) => {
  const user = getUser(c);
  const query = c.req.query();

  const parsed = noteQuerySchema.safeParse(query);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const result = await listNotes(user.userId, parsed.data);

  return c.json(
    createApiResponse(
      createPaginatedResponse(result.items, result.total, result.page, result.limit)
    )
  );
});

// Create note
noteRoutes.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const note = await createNote(user.userId, parsed.data);

  return c.json(createApiResponse(note), 201);
});

// Get single note
noteRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const note = await getNoteById(user.userId, id);

  return c.json(createApiResponse(note));
});

// Update note
noteRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const note = await updateNote(user.userId, id, parsed.data);

  return c.json(createApiResponse(note));
});

// Delete note
noteRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  await deleteNote(user.userId, id);

  return c.json(createApiResponse({ deleted: true }));
});

export { noteRoutes };
