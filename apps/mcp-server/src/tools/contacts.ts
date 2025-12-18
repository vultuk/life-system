import { z } from "zod";
import { getClient, type PaginatedData } from "../client";

// Types
interface Contact {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Schemas
const listContactsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
  notes: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

const getContactSchema = z.object({
  id: z.string().uuid(),
});

const updateContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  relationship: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

const deleteContactSchema = z.object({
  id: z.string().uuid(),
});

// Tool definitions
export const contactTools = [
  {
    name: "list_contacts",
    description: "List all contacts, optionally search by name, email, or phone",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search contacts by name, email, or phone",
        },
        categoryId: {
          type: "string",
          description: "Filter by category ID (UUID)",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        limit: {
          type: "number",
          description: "Items per page (default: 20, max: 100)",
        },
      },
    },
    handler: async (params: unknown) => {
      const input = listContactsSchema.parse(params);
      const client = getClient();
      const result = await client.get<PaginatedData<Contact>>("/contacts", {
        search: input.search,
        categoryId: input.categoryId,
        page: input.page,
        limit: input.limit,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "create_contact",
    description: "Create a new contact",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Contact name (required)",
        },
        email: {
          type: "string",
          description: "Contact email address",
        },
        phone: {
          type: "string",
          description: "Contact phone number",
        },
        relationship: {
          type: "string",
          description: "Relationship to this contact (e.g., friend, colleague, family)",
        },
        notes: {
          type: "string",
          description: "Additional notes about this contact",
        },
        categoryId: {
          type: "string",
          description: "Category ID (UUID) to assign the contact to",
        },
      },
      required: ["name"],
    },
    handler: async (params: unknown) => {
      const input = createContactSchema.parse(params);
      const client = getClient();
      const contact = await client.post<Contact>("/contacts", input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(contact, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_contact",
    description: "Get a specific contact by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Contact ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = getContactSchema.parse(params);
      const client = getClient();
      const contact = await client.get<Contact>(`/contacts/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(contact, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "update_contact",
    description: "Update an existing contact",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Contact ID (UUID)",
        },
        name: {
          type: "string",
          description: "New contact name",
        },
        email: {
          type: "string",
          description: "New email address (null to clear)",
        },
        phone: {
          type: "string",
          description: "New phone number (null to clear)",
        },
        relationship: {
          type: "string",
          description: "New relationship (null to clear)",
        },
        notes: {
          type: "string",
          description: "New notes (null to clear)",
        },
        categoryId: {
          type: "string",
          description: "New category ID (UUID) (null to clear)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = updateContactSchema.parse(params);
      const { id, ...updates } = input;
      const client = getClient();
      const contact = await client.put<Contact>(`/contacts/${id}`, updates);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(contact, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "delete_contact",
    description: "Delete a contact",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Contact ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = deleteContactSchema.parse(params);
      const client = getClient();
      await client.delete(`/contacts/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, message: "Contact deleted" }, null, 2),
          },
        ],
      };
    },
  },
];
