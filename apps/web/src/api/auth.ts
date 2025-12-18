import type { User } from "~/stores/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AuthResponse {
  user: User;
  token: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const json = (await response.json()) as ApiResponse<AuthResponse>;

  if (!response.ok || !json.success) {
    throw new Error(json.error || "Login failed");
  }

  return json.data!;
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  const json = (await response.json()) as ApiResponse<AuthResponse>;

  if (!response.ok || !json.success) {
    throw new Error(json.error || "Registration failed");
  }

  return json.data!;
}
