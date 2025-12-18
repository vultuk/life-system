import { api, type PaginatedResponse } from "./client";

export interface Habit {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string;
  count: number;
  notes: string | null;
  createdAt: string;
}

export interface HabitFilters {
  frequency?: "daily" | "weekly" | "monthly";
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface HabitLogFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  frequency?: "daily" | "weekly" | "monthly";
  targetCount?: number;
  categoryId?: string;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string | null;
  frequency?: "daily" | "weekly" | "monthly";
  targetCount?: number;
  categoryId?: string | null;
}

export interface CreateHabitLogInput {
  logDate: string;
  count?: number;
  notes?: string;
}

export const habitsApi = {
  list(filters?: HabitFilters): Promise<PaginatedResponse<Habit>> {
    return api.get("/habits", filters);
  },

  get(id: string): Promise<Habit> {
    return api.get(`/habits/${id}`);
  },

  create(input: CreateHabitInput): Promise<Habit> {
    return api.post("/habits", input);
  },

  update(id: string, input: UpdateHabitInput): Promise<Habit> {
    return api.put(`/habits/${id}`, input);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete(`/habits/${id}`);
  },

  log(id: string, input: CreateHabitLogInput): Promise<HabitLog> {
    return api.post(`/habits/${id}/log`, input);
  },

  getLogs(id: string, filters?: HabitLogFilters): Promise<PaginatedResponse<HabitLog>> {
    return api.get(`/habits/${id}/logs`, filters);
  },
};
