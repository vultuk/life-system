import { api, type PaginatedResponse } from "./client";

export interface Note {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  content: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFilters {
  search?: string;
  tag?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  categoryId?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string | null;
  tags?: string[] | null;
  categoryId?: string | null;
}

export const notesApi = {
  list(filters?: NoteFilters): Promise<PaginatedResponse<Note>> {
    return api.get("/notes", filters);
  },

  get(id: string): Promise<Note> {
    return api.get(`/notes/${id}`);
  },

  create(input: CreateNoteInput): Promise<Note> {
    return api.post("/notes", input);
  },

  update(id: string, input: UpdateNoteInput): Promise<Note> {
    return api.put(`/notes/${id}`, input);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete(`/notes/${id}`);
  },
};
