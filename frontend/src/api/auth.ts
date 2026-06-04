import { apiClient } from "./client";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post("/auth/register", { username, email, password });
  return data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post("/auth/login", { username, password });
  return data;
}
