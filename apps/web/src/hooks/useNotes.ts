import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi, type NoteFilters, type CreateNoteInput, type UpdateNoteInput } from "~/api/notes";
import toast from "react-hot-toast";

export function useNotes(filters?: NoteFilters) {
  return useQuery({
    queryKey: ["notes", filters],
    queryFn: () => notesApi.list(filters),
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: () => notesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => notesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create note");
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateNoteInput & { id: string }) =>
      notesApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes", variables.id] });
      toast.success("Note updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update note");
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete note");
    },
  });
}
