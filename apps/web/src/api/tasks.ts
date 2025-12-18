import { api, type PaginatedResponse } from "./client";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  page?: number;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}

export const tasksApi = {
  list(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    return api.get("/tasks", filters);
  },

  get(id: string): Promise<Task> {
    return api.get(`/tasks/${id}`);
  },

  create(input: CreateTaskInput): Promise<Task> {
    return api.post("/tasks", input);
  },

  update(id: string, input: UpdateTaskInput): Promise<Task> {
    return api.put(`/tasks/${id}`, input);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete(`/tasks/${id}`);
  },
};
