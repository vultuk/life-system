import { z } from "zod";
import { getClient, type PaginatedData } from "../client";

// Types
interface Habit {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string;
  count: number;
  notes: string | null;
  createdAt: string;
}

// Schemas
const listHabitsSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const createHabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  targetCount: z.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
});

const getHabitSchema = z.object({
  id: z.string().uuid(),
});

const updateHabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  targetCount: z.number().int().positive().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

const deleteHabitSchema = z.object({
  id: z.string().uuid(),
});

const logHabitSchema = z.object({
  id: z.string().uuid(),
  logDate: z.string().optional(),
  count: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const getHabitLogsSchema = z.object({
  id: z.string().uuid(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// Tool definitions
export const habitTools = [
  {
    name: "list_habits",
    description: "List all habits, optionally filtered by frequency",
    inputSchema: {
      type: "object" as const,
      properties: {
        frequency: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "Filter by habit frequency",
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
      const input = listHabitsSchema.parse(params);
      const client = getClient();
      const result = await client.get<PaginatedData<Habit>>("/habits", {
        frequency: input.frequency,
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
    name: "create_habit",
    description: "Create a new habit to track",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Habit name (required)",
        },
        description: {
          type: "string",
          description: "Habit description",
        },
        frequency: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "How often this habit should be done (default: daily)",
        },
        targetCount: {
          type: "number",
          description: "Target number of completions per period (default: 1)",
        },
        categoryId: {
          type: "string",
          description: "Category ID (UUID) to assign the habit to",
        },
      },
      required: ["name"],
    },
    handler: async (params: unknown) => {
      const input = createHabitSchema.parse(params);
      const client = getClient();
      const habit = await client.post<Habit>("/habits", input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(habit, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_habit",
    description: "Get a specific habit by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Habit ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = getHabitSchema.parse(params);
      const client = getClient();
      const habit = await client.get<Habit>(`/habits/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(habit, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "update_habit",
    description: "Update an existing habit",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Habit ID (UUID)",
        },
        name: {
          type: "string",
          description: "New habit name",
        },
        description: {
          type: "string",
          description: "New description (null to clear)",
        },
        frequency: {
          type: "string",
          enum: ["daily", "weekly", "monthly"],
          description: "New frequency",
        },
        targetCount: {
          type: "number",
          description: "New target count",
        },
        categoryId: {
          type: "string",
          description: "New category ID (UUID) (null to clear)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = updateHabitSchema.parse(params);
      const { id, ...updates } = input;
      const client = getClient();
      const habit = await client.put<Habit>(`/habits/${id}`, updates);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(habit, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "delete_habit",
    description: "Delete a habit and all its logs",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Habit ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = deleteHabitSchema.parse(params);
      const client = getClient();
      await client.delete(`/habits/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, message: "Habit deleted" }, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "log_habit",
    description: "Log a habit completion for today or a specific date",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Habit ID (UUID)",
        },
        logDate: {
          type: "string",
          description: "Date in YYYY-MM-DD format (default: today)",
        },
        count: {
          type: "number",
          description: "Number of completions (default: 1)",
        },
        notes: {
          type: "string",
          description: "Optional notes about this completion",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = logHabitSchema.parse(params);
      const { id, logDate, ...rest } = input;
      const client = getClient();

      // Default to today if no date provided
      const date = logDate || new Date().toISOString().split("T")[0];

      const log = await client.post<HabitLog>(`/habits/${id}/log`, {
        logDate: date,
        ...rest,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(log, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_habit_logs",
    description: "Get completion history for a habit",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Habit ID (UUID)",
        },
        startDate: {
          type: "string",
          description: "Start date filter in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "End date filter in YYYY-MM-DD format",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        limit: {
          type: "number",
          description: "Items per page (default: 50, max: 100)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = getHabitLogsSchema.parse(params);
      const { id, ...queryParams } = input;
      const client = getClient();
      const result = await client.get<PaginatedData<HabitLog>>(`/habits/${id}/logs`, queryParams);
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
];
