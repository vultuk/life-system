import { z } from "zod";

export const taskStatusValues = ["todo", "in_progress", "done"] as const;
export const taskPriorityValues = [
  "Lowest",
  "Low",
  "Normal",
  "High",
  "Very high",
] as const;

// Time pattern for HH:MM format
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createTaskSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255, "Title too long"),
    description: z.string().max(5000, "Description too long").optional(),
    priority: z.enum(taskPriorityValues).optional().default("Normal"),
    categoryId: z.string().uuid("Invalid category ID").optional(),
    deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    deadlineTime: z
      .string()
      .regex(timePattern, "Invalid time format (HH:MM)")
      .optional(),
    scheduledStart: z.string().datetime().optional(),
    scheduledFinish: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledStart && data.scheduledFinish) {
        return new Date(data.scheduledFinish) > new Date(data.scheduledStart);
      }
      return true;
    },
    {
      message: "Scheduled finish must be after scheduled start",
      path: ["scheduledFinish"],
    }
  );

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title too long")
      .optional(),
    description: z
      .string()
      .max(5000, "Description too long")
      .nullable()
      .optional(),
    status: z.enum(taskStatusValues).optional(),
    priority: z.enum(taskPriorityValues).optional(),
    categoryId: z.string().uuid("Invalid category ID").nullable().optional(),
    deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .nullable()
      .optional(),
    deadlineTime: z
      .string()
      .regex(timePattern, "Invalid time format (HH:MM)")
      .nullable()
      .optional(),
    scheduledStart: z.string().datetime().nullable().optional(),
    scheduledFinish: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledStart && data.scheduledFinish) {
        return new Date(data.scheduledFinish) > new Date(data.scheduledStart);
      }
      return true;
    },
    {
      message: "Scheduled finish must be after scheduled start",
      path: ["scheduledFinish"],
    }
  );

export const taskQuerySchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
