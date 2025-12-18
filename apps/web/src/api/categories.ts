import { api, type PaginatedResponse } from "./client";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

export const categoriesApi = {
  list(filters?: CategoryFilters): Promise<PaginatedResponse<Category>> {
    return api.get("/categories", filters);
  },

  get(id: string): Promise<Category> {
    return api.get(`/categories/${id}`);
  },

  create(input: CreateCategoryInput): Promise<Category> {
    return api.post("/categories", input);
  },

  update(id: string, input: UpdateCategoryInput): Promise<Category> {
    return api.put(`/categories/${id}`, input);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete(`/categories/${id}`);
  },
};
