import { z } from "zod";
import { getClient, type PaginatedData } from "../client";

// Types
interface Task {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "Lowest" | "Low" | "Normal" | "High" | "Very high";
  deadline: string | null;
  deadlineTime: string | null;
  scheduledStart: string | null;
  scheduledFinish: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskLink {
  id: string;
  taskId: string;
  noteId?: string;
  contactId?: string;
  userId: string;
  createdAt: string;
}

// Priority values
const priorityValues = ["Lowest", "Low", "Normal", "High", "Very high"] as const;

// Schemas
const listTasksSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(priorityValues).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(priorityValues).optional(),
  categoryId: z.string().uuid().optional(),
  deadline: z.string().optional(),
  deadlineTime: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledFinish: z.string().optional(),
});

const getTaskSchema = z.object({
  id: z.string().uuid(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(priorityValues).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  deadline: z.string().nullable().optional(),
  deadlineTime: z.string().nullable().optional(),
  scheduledStart: z.string().nullable().optional(),
  scheduledFinish: z.string().nullable().optional(),
});

const completeTaskSchema = z.object({
  id: z.string().uuid(),
});

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

const linkNoteSchema = z.object({
  taskId: z.string().uuid(),
  noteId: z.string().uuid(),
});

const unlinkNoteSchema = z.object({
  taskId: z.string().uuid(),
  noteId: z.string().uuid(),
});

const getTaskNotesSchema = z.object({
  taskId: z.string().uuid(),
});

const linkContactSchema = z.object({
  taskId: z.string().uuid(),
  contactId: z.string().uuid(),
});

const unlinkContactSchema = z.object({
  taskId: z.string().uuid(),
  contactId: z.string().uuid(),
});

const getTaskContactsSchema = z.object({
  taskId: z.string().uuid(),
});

// Tool definitions
export const taskTools = [
  {
    name: "list_tasks",
    description: "List all tasks, optionally filtered by status or priority",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["todo", "in_progress", "done"],
          description: "Filter by task status",
        },
        priority: {
          type: "string",
          enum: priorityValues,
          description: "Filter by task priority",
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
      const input = listTasksSchema.parse(params);
      const client = getClient();
      const result = await client.get<PaginatedData<Task>>("/tasks", {
        status: input.status,
        priority: input.priority,
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
    name: "create_task",
    description: "Create a new task with optional scheduling and deadline",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Task title (required)",
        },
        description: {
          type: "string",
          description: "Task description",
        },
        priority: {
          type: "string",
          enum: priorityValues,
          description: "Task priority (default: Normal)",
        },
        categoryId: {
          type: "string",
          description: "Category ID (UUID) to assign the task to",
        },
        deadline: {
          type: "string",
          description: "Deadline date in YYYY-MM-DD format",
        },
        deadlineTime: {
          type: "string",
          description: "Deadline time in HH:MM format (default: 09:00 when deadline is set)",
        },
        scheduledStart: {
          type: "string",
          description: "Scheduled start time in ISO 8601 format",
        },
        scheduledFinish: {
          type: "string",
          description: "Scheduled finish time in ISO 8601 format",
        },
      },
      required: ["title"],
    },
    handler: async (params: unknown) => {
      const input = createTaskSchema.parse(params);
      const client = getClient();
      const task = await client.post<Task>("/tasks", input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_task",
    description: "Get a specific task by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Task ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = getTaskSchema.parse(params);
      const client = getClient();
      const task = await client.get<Task>(`/tasks/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "update_task",
    description: "Update an existing task",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Task ID (UUID)",
        },
        title: {
          type: "string",
          description: "New task title",
        },
        description: {
          type: "string",
          description: "New task description (null to clear)",
        },
        status: {
          type: "string",
          enum: ["todo", "in_progress", "done"],
          description: "New task status",
        },
        priority: {
          type: "string",
          enum: priorityValues,
          description: "New task priority",
        },
        categoryId: {
          type: "string",
          description: "New category ID (UUID) (null to clear)",
        },
        deadline: {
          type: "string",
          description: "New deadline date in YYYY-MM-DD format (null to clear)",
        },
        deadlineTime: {
          type: "string",
          description: "New deadline time in HH:MM format (null to clear)",
        },
        scheduledStart: {
          type: "string",
          description: "New scheduled start time in ISO 8601 format (null to clear)",
        },
        scheduledFinish: {
          type: "string",
          description: "New scheduled finish time in ISO 8601 format (null to clear)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = updateTaskSchema.parse(params);
      const { id, ...updates } = input;
      const client = getClient();
      const task = await client.put<Task>(`/tasks/${id}`, updates);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as done",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Task ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = completeTaskSchema.parse(params);
      const client = getClient();
      const task = await client.put<Task>(`/tasks/${input.id}`, {
        status: "done",
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "delete_task",
    description: "Delete a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Task ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = deleteTaskSchema.parse(params);
      const client = getClient();
      await client.delete(`/tasks/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: "Task deleted" },
              null,
              2
            ),
          },
        ],
      };
    },
  },
  // Note linking tools
  {
    name: "link_note_to_task",
    description: "Link a note to a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (UUID)",
        },
        noteId: {
          type: "string",
          description: "Note ID (UUID)",
        },
      },
      required: ["taskId", "noteId"],
    },
    handler: async (params: unknown) => {
      const input = linkNoteSchema.parse(params);
      const client = getClient();
      const link = await client.post<TaskLink>(
        `/tasks/${input.taskId}/notes/${input.noteId}`,
        {}
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(link, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "unlink_note_from_task",
    description: "Remove a note link from a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (UUID)",
        },
        noteId: {
          type: "string",
          description: "Note ID (UUID)",
        },
      },
      required: ["taskId", "noteId"],
    },
    handler: async (params: unknown) => {
      const input = unlinkNoteSchema.parse(params);
      const client = getClient();
      await client.delete(`/tasks/${input.taskId}/notes/${input.noteId}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: "Note unlinked from task" },
              null,
              2
            ),
          },
        ],
      };
    },
  },
  {
    name: "get_task_notes",
    description: "Get all notes linked to a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (UUID)",
        },
      },
      required: ["taskId"],
    },
    handler: async (params: unknown) => {
      const input = getTaskNotesSchema.parse(params);
      const client = getClient();
      const notes = await client.get<Note[]>(`/tasks/${input.taskId}/notes`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    },
  },
  // Contact linking tools
  {
    name: "link_contact_to_task",
    description: "Link a contact to a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (UUID)",
        },
        contactId: {
          type: "string",
          description: "Contact ID (UUID)",
        },
      },
      required: ["taskId", "contactId"],
    },
    handler: async (params: unknown) => {
      const input = linkContactSchema.parse(params);
      const client = getClient();
      const link = await client.post<TaskLink>(
        `/tasks/${input.taskId}/contacts/${input.contactId}`,
        {}
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(link, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "unlink_contact_from_task",
    description: "Remove a contact link from a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (UUID)",
        },
        contactId: {
          type: "string",
          description: "Contact ID (UUID)",
        },
      },
      required: ["taskId", "contactId"],
    },
    handler: async (params: unknown) => {
      const input = unlinkContactSchema.parse(params);
      const client = getClient();
      await client.delete(`/tasks/${input.taskId}/contacts/${input.contactId}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { success: true, message: "Contact unlinked from task" },
              null,
              2
            ),
          },
        ],
      };
    },
  },
  {
    name: "get_task_contacts",
    description: "Get all contacts linked to a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (UUID)",
        },
      },
      required: ["taskId"],
    },
    handler: async (params: unknown) => {
      const input = getTaskContactsSchema.parse(params);
      const client = getClient();
      const contacts = await client.get<Contact[]>(
        `/tasks/${input.taskId}/contacts`
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(contacts, null, 2),
          },
        ],
      };
    },
  },
];
