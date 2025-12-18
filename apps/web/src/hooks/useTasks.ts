import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi,
  type TaskFilters,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "~/api/tasks";
import toast from "react-hot-toast";

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => tasksApi.list(filters),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create task"
      );
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      tasksApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
      toast.success("Task updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update task"
      );
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task"
      );
    },
  });
}

// Note linking hooks
export function useTaskNotes(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "notes"],
    queryFn: () => tasksApi.getNotes(taskId),
    enabled: !!taskId,
  });
}

export function useLinkNoteToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, noteId }: { taskId: string; noteId: string }) =>
      tasksApi.linkNote(taskId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.taskId, "notes"],
      });
      toast.success("Note linked to task");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to link note"
      );
    },
  });
}

export function useUnlinkNoteFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, noteId }: { taskId: string; noteId: string }) =>
      tasksApi.unlinkNote(taskId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.taskId, "notes"],
      });
      toast.success("Note unlinked from task");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to unlink note"
      );
    },
  });
}

// Contact linking hooks
export function useTaskContacts(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "contacts"],
    queryFn: () => tasksApi.getContacts(taskId),
    enabled: !!taskId,
  });
}

export function useLinkContactToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, contactId }: { taskId: string; contactId: string }) =>
      tasksApi.linkContact(taskId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.taskId, "contacts"],
      });
      toast.success("Contact linked to task");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to link contact"
      );
    },
  });
}

export function useUnlinkContactFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, contactId }: { taskId: string; contactId: string }) =>
      tasksApi.unlinkContact(taskId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.taskId, "contacts"],
      });
      toast.success("Contact unlinked from task");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to unlink contact"
      );
    },
  });
}
