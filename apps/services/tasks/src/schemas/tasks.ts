import { z } from "zod";

export const taskStatusValues = ["todo", "in_progress", "done"] as const;
export const taskPriorityValues = ["low", "medium", "high"] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  priority: z.enum(taskPriorityValues).optional().default("medium"),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  description: z.string().max(5000, "Description too long").nullable().optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
