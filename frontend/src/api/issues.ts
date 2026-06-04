import { apiClient } from "./client";

export interface Author {
  id: number;
  username: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  reactors: string[];
}

export interface Reply {
  id: number;
  body: string;
  author: Author;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  body: string;
  author: Author;
  parent_id: number | null;
  replies: Reply[];
  reactions: Reaction[];
  created_at: string;
}

export interface TimelineEvent {
  id: number;
  event_type: string;
  actor: Author;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface IssueDetail {
  id: number;
  repo_id: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  author: Author;
  labels: Label[];
  assignees: Author[];
  reactions: Reaction[];
  comments: Comment[];
  timeline: TimelineEvent[];
  created_at: string;
  updated_at: string;
}

export interface IssueSummary {
  id: number;
  title: string;
  state: "open" | "closed";
  author: Author;
  labels: Label[];
  created_at: string;
  comment_count: number;
}

export async function listIssues(
  repoId: number,
  state?: "open" | "closed",
  limit = 20,
  offset = 0
): Promise<IssueSummary[]> {
  const params: Record<string, unknown> = { limit, offset };
  if (state) params.state = state;
  const { data } = await apiClient.get(`/repos/${repoId}/issues/`, { params });
  return data;
}

export async function getIssue(repoId: number, issueId: number): Promise<IssueDetail> {
  const { data } = await apiClient.get(`/repos/${repoId}/issues/${issueId}`);
  return data;
}

export async function createIssue(
  repoId: number,
  payload: { title: string; body?: string }
): Promise<IssueDetail> {
  const { data } = await apiClient.post(`/repos/${repoId}/issues/`, payload);
  return data;
}

export async function updateIssue(
  repoId: number,
  issueId: number,
  payload: Partial<{ title: string; body: string; state: "open" | "closed" }>
): Promise<IssueDetail> {
  const { data } = await apiClient.patch(`/repos/${repoId}/issues/${issueId}`, payload);
  return data;
}
