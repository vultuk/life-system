import { useMutation } from "@tanstack/react-query";
import { useAuth } from "~/stores/auth";
import { login as loginApi, register as registerApi } from "~/api/auth";
import { setStoredAuth } from "~/stores/auth";
import toast from "react-hot-toast";

export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (data) => {
      setStoredAuth(data.token, data.user);
      login(data.token, data.user);
      toast.success("Welcome back!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}

export function useRegister() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => registerApi(email, password, name),
    onSuccess: (data) => {
      setStoredAuth(data.token, data.user);
      login(data.token, data.user);
      toast.success("Account created successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    },
  });
}
