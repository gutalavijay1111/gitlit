import { apiClient } from "./client";

export interface ReactionResponse {
  id: number;
  reactor_id: number;
  emoji: string;
}

export async function addReaction(
  repoId: number,
  issueId: number,
  commentId: number,
  emoji: string
): Promise<ReactionResponse> {
  const { data } = await apiClient.post(
    `/repos/${repoId}/issues/${issueId}/comments/${commentId}/reactions/`,
    { emoji }
  );
  return data;
}

export async function listReactions(
  repoId: number,
  issueId: number,
  commentId: number
): Promise<ReactionResponse[]> {
  const { data } = await apiClient.get(
    `/repos/${repoId}/issues/${issueId}/comments/${commentId}/reactions/`
  );
  return data;
}

export async function removeReaction(
  repoId: number,
  issueId: number,
  commentId: number,
  emoji: string
): Promise<void> {
  await apiClient.delete(
    `/repos/${repoId}/issues/${issueId}/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`
  );
}
