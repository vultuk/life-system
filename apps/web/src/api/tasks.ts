import { api, type PaginatedResponse } from "./client";

export type TaskPriority = "Lowest" | "Low" | "Normal" | "High" | "Very high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  deadlineTime: string | null;
  scheduledStart: string | null;
  scheduledFinish: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface TaskLink {
  id: string;
  taskId: string;
  noteId?: string;
  contactId?: string;
  userId: string;
  createdAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  deadlineTime?: string;
  scheduledStart?: string;
  scheduledFinish?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
  deadlineTime?: string | null;
  scheduledStart?: string | null;
  scheduledFinish?: string | null;
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

  // Note linking
  getNotes(taskId: string): Promise<Note[]> {
    return api.get(`/tasks/${taskId}/notes`);
  },

  linkNote(taskId: string, noteId: string): Promise<TaskLink> {
    return api.post(`/tasks/${taskId}/notes/${noteId}`, {});
  },

  unlinkNote(taskId: string, noteId: string): Promise<{ unlinked: boolean }> {
    return api.delete(`/tasks/${taskId}/notes/${noteId}`);
  },

  // Contact linking
  getContacts(taskId: string): Promise<Contact[]> {
    return api.get(`/tasks/${taskId}/contacts`);
  },

  linkContact(taskId: string, contactId: string): Promise<TaskLink> {
    return api.post(`/tasks/${taskId}/contacts/${contactId}`, {});
  },

  unlinkContact(
    taskId: string,
    contactId: string
  ): Promise<{ unlinked: boolean }> {
    return api.delete(`/tasks/${taskId}/contacts/${contactId}`);
  },
};
