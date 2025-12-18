import { z } from "zod";
import type { ApiResponse } from "../types";

export const userContextSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export type UserContextInput = z.infer<typeof userContextSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function createApiErrorResponse(error: string): ApiResponse<never> {
  return { success: false, error };
}
