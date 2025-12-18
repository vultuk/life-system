import { z } from "zod";
import { getClient, type PaginatedData } from "../client";

// Types
interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// Schemas
const listNotesSchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const getNoteSchema = z.object({
  id: z.string().uuid(),
});

const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

const deleteNoteSchema = z.object({
  id: z.string().uuid(),
});

// Tool definitions
export const noteTools = [
  {
    name: "list_notes",
    description: "List all notes, optionally filter by tags or search content",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search notes by title or content",
        },
        tag: {
          type: "string",
          description: "Filter by a specific tag",
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
      const input = listNotesSchema.parse(params);
      const client = getClient();
      const result = await client.get<PaginatedData<Note>>("/notes", {
        search: input.search,
        tag: input.tag,
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
    name: "create_note",
    description: "Create a new note",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Note title (required)",
        },
        content: {
          type: "string",
          description: "Note content (supports markdown)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorizing the note",
        },
      },
      required: ["title"],
    },
    handler: async (params: unknown) => {
      const input = createNoteSchema.parse(params);
      const client = getClient();
      const note = await client.post<Note>("/notes", input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_note",
    description: "Get a specific note by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Note ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = getNoteSchema.parse(params);
      const client = getClient();
      const note = await client.get<Note>(`/notes/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "update_note",
    description: "Update an existing note",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Note ID (UUID)",
        },
        title: {
          type: "string",
          description: "New note title",
        },
        content: {
          type: "string",
          description: "New note content (null to clear)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags (null to clear)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = updateNoteSchema.parse(params);
      const { id, ...updates } = input;
      const client = getClient();
      const note = await client.put<Note>(`/notes/${id}`, updates);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(note, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "delete_note",
    description: "Delete a note",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Note ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = deleteNoteSchema.parse(params);
      const client = getClient();
      await client.delete(`/notes/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, message: "Note deleted" }, null, 2),
          },
        ],
      };
    },
  },
];
