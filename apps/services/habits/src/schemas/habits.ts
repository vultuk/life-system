import { z } from "zod";

export const frequencyValues = ["daily", "weekly", "monthly"] as const;

export const createHabitSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  frequency: z.enum(frequencyValues).optional().default("daily"),
  targetCount: z.number().int().positive().max(100).optional().default(1),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").nullable().optional(),
  frequency: z.enum(frequencyValues).optional(),
  targetCount: z.number().int().positive().max(100).optional(),
  categoryId: z.string().uuid("Invalid category ID").nullable().optional(),
});

export const habitQuerySchema = z.object({
  frequency: z.enum(frequencyValues).optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createHabitLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  count: z.number().int().positive().max(1000).optional().default(1),
  notes: z.string().max(1000, "Notes too long").optional(),
});

export const habitLogQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type HabitQueryInput = z.infer<typeof habitQuerySchema>;
export type CreateHabitLogInput = z.infer<typeof createHabitLogSchema>;
export type HabitLogQueryInput = z.infer<typeof habitLogQuerySchema>;
