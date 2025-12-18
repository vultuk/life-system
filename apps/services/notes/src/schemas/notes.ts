import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().max(50000, "Content too long").optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  content: z.string().max(50000, "Content too long").nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
});

export const noteQuerySchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
