import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  categoriesApi,
  type CategoryFilters,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "~/api/categories";
import toast from "react-hot-toast";

export function useCategories(filters?: CategoryFilters) {
  return useQuery({
    queryKey: ["categories", filters],
    queryFn: () => categoriesApi.list(filters),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: () => categoriesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category"
      );
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCategoryInput & { id: string }) =>
      categoriesApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", variables.id] });
      toast.success("Category updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category"
      );
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    },
  });
}
