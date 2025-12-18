import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import {
  createApiResponse,
  ValidationError,
  createPaginatedResponse,
} from "@life/shared";
import { getUser } from "../middleware/userContext";
import {
  createContactSchema,
  updateContactSchema,
  contactQuerySchema,
} from "../schemas/contacts";
import {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from "../services/contacts";

type ContactsEnv = {
  Variables: {
    user: UserContext;
  };
};

const contactRoutes = new Hono<ContactsEnv>();

// List contacts
contactRoutes.get("/", async (c) => {
  const user = getUser(c);
  const query = c.req.query();

  const parsed = contactQuerySchema.safeParse(query);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const result = await listContacts(user.userId, parsed.data);

  return c.json(
    createApiResponse(
      createPaginatedResponse(result.items, result.total, result.page, result.limit)
    )
  );
});

// Create contact
contactRoutes.post("/", async (c) => {
  const user = getUser(c);
  const body = await c.req.json();

  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const contact = await createContact(user.userId, parsed.data);

  return c.json(createApiResponse(contact), 201);
});

// Get single contact
contactRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  const contact = await getContactById(user.userId, id);

  return c.json(createApiResponse(contact));
});

// Update contact
contactRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = updateContactSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(messages);
  }

  const contact = await updateContact(user.userId, id, parsed.data);

  return c.json(createApiResponse(contact));
});

// Delete contact
contactRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");

  await deleteContact(user.userId, id);

  return c.json(createApiResponse({ deleted: true }));
});

export { contactRoutes };
