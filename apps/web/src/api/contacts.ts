import { api, type PaginatedResponse } from "./client";

export interface Contact {
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

export interface ContactFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
  notes?: string;
}

export interface UpdateContactInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  relationship?: string | null;
  notes?: string | null;
}

export const contactsApi = {
  list(filters?: ContactFilters): Promise<PaginatedResponse<Contact>> {
    return api.get("/contacts", filters);
  },

  get(id: string): Promise<Contact> {
    return api.get(`/contacts/${id}`);
  },

  create(input: CreateContactInput): Promise<Contact> {
    return api.post("/contacts", input);
  },

  update(id: string, input: UpdateContactInput): Promise<Contact> {
    return api.put(`/contacts/${id}`, input);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete(`/contacts/${id}`);
  },
};
