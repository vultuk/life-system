import { Hono } from "hono";
import type { UserContext } from "@life/shared";
import { authMiddleware, getUser } from "../middleware/auth";
import { proxyRequest } from "../middleware/proxy";

type ContactsEnv = {
  Variables: {
    user: UserContext;
  };
};

const contactsRoutes = new Hono<ContactsEnv>();

const getContactsServiceUrl = () => {
  const url = process.env.CONTACTS_SERVICE_URL;
  if (!url) {
    throw new Error("CONTACTS_SERVICE_URL environment variable is not set");
  }
  return url;
};

// Apply auth middleware to all routes
contactsRoutes.use("/*", authMiddleware());

// List contacts
contactsRoutes.get("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getContactsServiceUrl(),
    path: "/contacts",
    user,
  });
});

// Create contact
contactsRoutes.post("/", async (c) => {
  const user = getUser(c);
  return proxyRequest(c, {
    baseUrl: getContactsServiceUrl(),
    path: "/contacts",
    user,
  });
});

// Get single contact
contactsRoutes.get("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getContactsServiceUrl(),
    path: `/contacts/${id}`,
    user,
  });
});

// Update contact
contactsRoutes.put("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getContactsServiceUrl(),
    path: `/contacts/${id}`,
    user,
  });
});

// Delete contact
contactsRoutes.delete("/:id", async (c) => {
  const user = getUser(c);
  const id = c.req.param("id");
  return proxyRequest(c, {
    baseUrl: getContactsServiceUrl(),
    path: `/contacts/${id}`,
    user,
  });
});

export { contactsRoutes };
