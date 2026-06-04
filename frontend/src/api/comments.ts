import { apiClient } from "./client";

export interface CommentResponse {
  id: number;
  issue_id: number;
  author_id: number;
  body: string;
}

export async function createComment(
  repoId: number,
  issueId: number,
  body: string
): Promise<CommentResponse> {
  const { data } = await apiClient.post(`/repos/${repoId}/issues/${issueId}/comments/`, { body });
  return data;
}

export async function deleteComment(
  repoId: number,
  issueId: number,
  commentId: number
): Promise<void> {
  await apiClient.delete(`/repos/${repoId}/issues/${issueId}/comments/${commentId}`);
}
