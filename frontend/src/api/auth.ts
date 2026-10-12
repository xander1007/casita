import api from "./axios";
import type { AuthResponse, LoginPayload, User } from "../types/auth";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function me(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}
