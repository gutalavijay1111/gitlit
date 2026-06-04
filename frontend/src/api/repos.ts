import { apiClient } from "./client";

export interface Repo {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  issue_count: number;
  comment_count: number;
}

export interface PaginatedRepos {
  items: Repo[];
  total: number;
  skip: number;
  limit: number;
}

export async function listRepos(): Promise<Repo[]> {
  const { data } = await apiClient.get("/repos/");
  return data;
}

export async function getRepo(repoId: number): Promise<Repo> {
  const { data } = await apiClient.get(`/repos/${repoId}`);
  return data;
}

export async function createRepo(payload: { name: string; description?: string; is_private?: boolean }): Promise<Repo> {
  const { data } = await apiClient.post("/repos/", payload);
  return data;
}

export async function updateRepo(repoId: number, payload: Partial<{ name: string; description: string; is_private: boolean }>): Promise<Repo> {
  const { data } = await apiClient.put(`/repos/${repoId}`, payload);
  return data;
}

export async function deleteRepo(repoId: number): Promise<void> {
  await apiClient.delete(`/repos/${repoId}`);
}

export async function getWatchers(repoId: number): Promise<number[]> {
  const { data } = await apiClient.get(`/repos/${repoId}/watchers`);
  return data;
}

export async function exploreRepos(skip = 0, limit = 10): Promise<PaginatedRepos> {
  const { data } = await apiClient.get("/repos/explore", { params: { skip, limit } });
  return data;
}
