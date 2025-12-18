import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email").max(255).optional(),
  phone: z.string().max(50, "Phone too long").optional(),
  relationship: z.string().max(100, "Relationship too long").optional(),
  notes: z.string().max(5000, "Notes too long").optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  email: z.string().email("Invalid email").max(255).nullable().optional(),
  phone: z.string().max(50, "Phone too long").nullable().optional(),
  relationship: z.string().max(100, "Relationship too long").nullable().optional(),
  notes: z.string().max(5000, "Notes too long").nullable().optional(),
});

export const contactQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQueryInput = z.infer<typeof contactQuerySchema>;
