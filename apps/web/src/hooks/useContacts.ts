import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactsApi, type ContactFilters, type CreateContactInput, type UpdateContactInput } from "~/api/contacts";
import toast from "react-hot-toast";

export function useContacts(filters?: ContactFilters) {
  return useQuery({
    queryKey: ["contacts", filters],
    queryFn: () => contactsApi.list(filters),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContactInput) => contactsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create contact");
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateContactInput & { id: string }) =>
      contactsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts", variables.id] });
      toast.success("Contact updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update contact");
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete contact");
    },
  });
}
