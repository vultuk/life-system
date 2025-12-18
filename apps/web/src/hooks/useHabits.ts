import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  habitsApi,
  type HabitFilters,
  type HabitLogFilters,
  type CreateHabitInput,
  type UpdateHabitInput,
  type CreateHabitLogInput,
} from "~/api/habits";
import toast from "react-hot-toast";

export function useHabits(filters?: HabitFilters) {
  return useQuery({
    queryKey: ["habits", filters],
    queryFn: () => habitsApi.list(filters),
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: ["habits", id],
    queryFn: () => habitsApi.get(id),
    enabled: !!id,
  });
}

export function useHabitLogs(id: string, filters?: HabitLogFilters) {
  return useQuery({
    queryKey: ["habits", id, "logs", filters],
    queryFn: () => habitsApi.getLogs(id, filters),
    enabled: !!id,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => habitsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create habit");
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateHabitInput & { id: string }) =>
      habitsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", variables.id] });
      toast.success("Habit updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update habit");
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete habit");
    },
  });
}

export function useLogHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: CreateHabitLogInput & { id: string }) =>
      habitsApi.log(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["habits", variables.id, "logs"] });
      toast.success("Habit logged!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to log habit");
    },
  });
}
