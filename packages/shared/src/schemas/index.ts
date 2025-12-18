import { z } from "zod";

// Common Zod schemas shared across services

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Add more shared schemas here as needed
