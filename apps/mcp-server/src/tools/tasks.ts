import { z } from "zod";
import { getClient, type PaginatedData } from "../client";

// Types
interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Schemas
const listTasksSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
});

const getTaskSchema = z.object({
  id: z.string().uuid(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().nullable().optional(),
});

const completeTaskSchema = z.object({
  id: z.string().uuid(),
});

const deleteTaskSchema = z.object({
  id: z.string().uuid(),
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
          enum: ["low", "medium", "high"],
          description: "Filter by task priority",
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
    description: "Create a new task",
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
          enum: ["low", "medium", "high"],
          description: "Task priority (default: medium)",
        },
        dueDate: {
          type: "string",
          description: "Due date in ISO 8601 format",
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
          enum: ["low", "medium", "high"],
          description: "New task priority",
        },
        dueDate: {
          type: "string",
          description: "New due date in ISO 8601 format (null to clear)",
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
            text: JSON.stringify({ success: true, message: "Task deleted" }, null, 2),
          },
        ],
      };
    },
  },
];
