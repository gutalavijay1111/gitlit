import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CircleDot, CheckCircle2, ChevronRight, AlertCircle,
  Pencil, X, Check, Tag, Users, Smile,
} from "lucide-react";
import { getIssue, updateIssue, type IssueDetail, type Comment, type TimelineEvent, type Reaction } from "../api/issues";
import { createComment, deleteComment } from "../api/comments";
import { addReaction, removeReaction } from "../api/reactions";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { getInitials, hashColor, formatRelativeTime } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const EMOJI_PALETTE = ["👍", "👎", "❤️", "😄", "😢", "😮", "🎉", "🚀", "👀", "🔥"];

function UserAvatar({ username, size = "sm" }: { username: string; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "h-8 w-8" : "h-6 w-6";
  const textClass = size === "md" ? "text-xs" : "text-[9px]";
  return (
    <Avatar className={sizeClass}>
      <AvatarFallback className={`${hashColor(username)} text-white ${textClass}`}>
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
}

function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="prose-gitlit text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function LabelPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border"
      style={{ backgroundColor: color + "26", borderColor: color + "55", color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

function ReactionChip({
  reaction, currentUsername, onToggle,
}: {
  reaction: Reaction;
  currentUsername?: string;
  onToggle: (emoji: string, isOwn: boolean) => void;
}) {
  const isOwn = currentUsername ? reaction.reactors.includes(currentUsername) : false;
  const names = reaction.reactors;
  const tooltipText = names.length === 0
    ? ""
    : names.slice(0, 5).join(", ") + (names.length > 5 ? ` and ${names.length - 5} more` : "");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => onToggle(reaction.emoji, isOwn)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all duration-150 active:scale-95 ${
            isOwn
              ? "border-primary/50 bg-primary/15 text-primary font-medium"
              : "border-border bg-muted/60 text-foreground hover:border-primary/30 hover:bg-primary/5"
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className={isOwn ? "text-primary" : "text-muted-foreground"}>{reaction.count}</span>
        </button>
      </TooltipTrigger>
      {tooltipText && (
        <TooltipContent className="max-w-[200px] text-center text-xs">
          {tooltipText}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function EmojiPicker({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="grid grid-cols-5 gap-1 p-1">
      {EMOJI_PALETTE.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onPick(emoji); onClose(); }}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-base hover:bg-accent transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function CommentReactions({
  reactions, commentId, repoId, issueId,
  currentUsername, onReacted,
}: {
  reactions: Reaction[];
  commentId: number;
  repoId: number;
  issueId: number;
  currentUsername?: string;
  onReacted: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const addMutation = useMutation({
    mutationFn: (emoji: string) => addReaction(repoId, issueId, commentId, emoji),
    onSuccess: onReacted,
  });

  const removeMutation = useMutation({
    mutationFn: (emoji: string) => removeReaction(repoId, issueId, commentId, emoji),
    onSuccess: onReacted,
  });

  const handleToggle = (emoji: string, isOwn: boolean) => {
    if (!currentUsername) return;
    if (isOwn) {
      removeMutation.mutate(emoji);
    } else {
      addMutation.mutate(emoji);
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-1.5 px-4 pb-3 pt-1">
      {reactions.map((r) => (
        <ReactionChip
          key={r.emoji}
          reaction={r}
          currentUsername={currentUsername}
          onToggle={handleToggle}
        />
      ))}
      {currentUsername && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Smile className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto">
            <EmojiPicker onPick={(e) => addMutation.mutate(e)} onClose={() => setPickerOpen(false)} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const icons: Record<string, React.ReactNode> = {
    closed: <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />,
    reopened: <CircleDot className="h-3.5 w-3.5 text-emerald-400" />,
    label_added: <Tag className="h-3.5 w-3.5 text-blue-400" />,
    label_removed: <Tag className="h-3.5 w-3.5 text-muted-foreground" />,
    assigned: <Users className="h-3.5 w-3.5 text-amber-400" />,
    unassigned: <Users className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  const descriptions: Record<string, string> = {
    closed: "closed this issue",
    reopened: "reopened this issue",
    label_added: `added the label "${(event.payload as { label_name?: string }).label_name ?? ""}"`,
    label_removed: `removed the label "${(event.payload as { label_name?: string }).label_name ?? ""}"`,
    assigned: `assigned ${(event.payload as { username?: string }).username ?? ""}`,
    unassigned: `unassigned ${(event.payload as { username?: string }).username ?? ""}`,
  };

  if (event.event_type === "comment_added") return null;

  return (
    <div className="flex items-center gap-2.5 py-2 text-xs text-muted-foreground">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
        {icons[event.event_type] ?? <CircleDot className="h-3 w-3" />}
      </div>
      <UserAvatar username={event.actor.username} />
      <span>
        <span className="font-medium text-foreground">{event.actor.username}</span>{" "}
        {descriptions[event.event_type] ?? event.event_type}{" "}
        <span className="text-muted-foreground">{formatRelativeTime(event.created_at)}</span>
      </span>
    </div>
  );
}

function CommentCard({
  comment, repoId, issueId, currentUsername, currentUserId, onRefresh,
}: {
  comment: Comment;
  repoId: number;
  issueId: number;
  currentUsername?: string;
  currentUserId?: number;
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isAuthor = currentUserId === comment.author.id;

  const handleDelete = async () => {
    setDeleting(true);
    await deleteComment(repoId, issueId, comment.id);
    onRefresh();
  };

  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="shrink-0">
        <UserAvatar username={comment.author.username} size="md" />
      </div>
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{comment.author.username}</span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
          </div>
          {isAuthor && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive h-6 w-6"
              onClick={handleDelete}
              disabled={deleting}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="px-4 py-3">
          <MarkdownBody content={comment.body} />
        </div>
        <CommentReactions
          reactions={comment.reactions}
          commentId={comment.id}
          repoId={repoId}
          issueId={issueId}
          currentUsername={currentUsername}
          onReacted={onRefresh}
        />
      </div>
    </div>
  );
}

function AddCommentBox({ repoId, issueId, onSuccess }: { repoId: number; issueId: number; onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link> to leave a comment.
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setLoading(true);
    try {
      await createComment(repoId, issueId, body);
      setBody("");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="shrink-0">
        <UserAvatar username={user.username} size="md" />
      </div>
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-all">
        <div className="flex gap-2 px-3 py-2 border-b border-border bg-muted/30">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${!preview ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${preview ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Preview
          </button>
        </div>
        {preview ? (
          <div className="min-h-[120px] px-4 py-3">
            {body ? <MarkdownBody content={body} /> : <p className="text-sm text-muted-foreground italic">Nothing to preview</p>}
          </div>
        ) : (
          <Textarea
            placeholder="Leave a comment... (Markdown supported)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[120px] border-0 rounded-none focus-visible:ring-0 bg-transparent"
          />
        )}
        <div className="flex justify-end px-3 py-2 border-t border-border bg-muted/20">
          <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || loading} className="gap-2">
            <Check className="h-3.5 w-3.5" />
            {loading ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IssueSidebar({ issue, repoId, currentUserId }: { issue: IssueDetail; repoId: number; currentUserId?: number }) {
  const qc = useQueryClient();
  const isAuthor = currentUserId === issue.author.id;

  const toggleState = useMutation({
    mutationFn: () =>
      updateIssue(repoId, issue.id, { state: issue.state === "open" ? "closed" : "open" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issue", repoId, issue.id] }),
  });

  return (
    <div className="space-y-5">
      {isAuthor && (
        <Button
          variant={issue.state === "open" ? "outline" : "success"}
          size="sm"
          className="w-full gap-2"
          onClick={() => toggleState.mutate()}
          disabled={toggleState.isPending}
        >
          {issue.state === "open" ? (
            <><CheckCircle2 className="h-4 w-4" />Close issue</>
          ) : (
            <><CircleDot className="h-4 w-4" />Reopen issue</>
          )}
        </Button>
      )}

      <div>
        <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Tag className="h-3.5 w-3.5" />Labels
        </h3>
        {issue.labels.length === 0 ? (
          <p className="text-xs text-muted-foreground">None yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {issue.labels.map((l) => <LabelPill key={l.id} name={l.name} color={l.color} />)}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Users className="h-3.5 w-3.5" />Assignees
        </h3>
        {issue.assignees.length === 0 ? (
          <p className="text-xs text-muted-foreground">No one assigned</p>
        ) : (
          <div className="space-y-2">
            {issue.assignees.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <UserAvatar username={a.username} />
                <span className="text-sm text-foreground">{a.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function IssueDetailPage() {
  const { repoId, issueId } = useParams<{ repoId: string; issueId: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const rid = Number(repoId);
  const iid = Number(issueId);

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ["issue", rid, iid],
    queryFn: () => getIssue(rid, iid),
    enabled: !!rid && !!iid,
  });

  const updateTitle = useMutation({
    mutationFn: (title: string) => updateIssue(rid, iid, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["issue", rid, iid] });
      setEditingTitle(false);
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["issue", rid, iid] });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Issue not found</p>
      </div>
    );
  }

  const isAuthor = user?.user_id === issue.author.id;
  const isOpen = issue.state === "open";
  const timeline = issue.timeline.filter((e) => e.event_type !== "comment_added");

  const allItems = [
    ...issue.comments.map((c) => ({ type: "comment" as const, data: c, created_at: c.created_at })),
    ...timeline.map((e) => ({ type: "event" as const, data: e, created_at: e.created_at })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/repos" className="hover:text-foreground transition-colors">Repositories</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/repos/${rid}`} className="hover:text-foreground transition-colors">Repo #{rid}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Issue #{iid}</span>
      </div>

      <div className="mb-6">
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-muted/40 border border-input rounded-md px-3 py-1.5 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              autoFocus
            />
            <Button size="sm" onClick={() => updateTitle.mutate(titleDraft)} disabled={!titleDraft}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold text-foreground flex-1 leading-tight">{issue.title}</h1>
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 mt-1 text-muted-foreground hover:text-foreground"
                onClick={() => { setTitleDraft(issue.title); setEditingTitle(true); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <Badge variant={isOpen ? "open" : "closed"} className="gap-1.5">
            {isOpen ? <CircleDot className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isOpen ? "Open" : "Closed"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{issue.author.username}</span> opened{" "}
            {formatRelativeTime(issue.created_at)}
          </span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{issue.comments.length} comments</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
        <div className="space-y-4 min-w-0">
          {issue.body && (
            <div className="flex gap-3">
              <div className="shrink-0">
                <UserAvatar username={issue.author.username} size="md" />
              </div>
              <div className="flex-1 rounded-xl border border-primary/20 bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-primary/15">
                  <span className="text-sm font-semibold text-foreground">{issue.author.username}</span>
                  <span className="text-xs text-muted-foreground">opened {formatRelativeTime(issue.created_at)}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] h-4 py-0">Author</Badge>
                </div>
                <div className="px-4 py-3">
                  <MarkdownBody content={issue.body} />
                </div>
              </div>
            </div>
          )}

          {allItems.length > 0 && (
            <div className="space-y-3 pl-11">
              {allItems.map((item) => {
                if (item.type === "comment") {
                  return (
                    <CommentCard
                      key={`comment-${item.data.id}`}
                      comment={item.data as Comment}
                      repoId={rid}
                      issueId={iid}
                      currentUsername={user?.username}
                      currentUserId={user?.user_id}
                      onRefresh={refresh}
                    />
                  );
                }
                return <TimelineItem key={`event-${item.data.id}`} event={item.data as TimelineEvent} />;
              })}
            </div>
          )}

          <div className="pl-11">
            <AddCommentBox repoId={rid} issueId={iid} onSuccess={refresh} />
          </div>
        </div>

        <div className="lg:sticky lg:top-20 self-start">
          <IssueSidebar issue={issue} repoId={rid} currentUserId={user?.user_id} />
        </div>
      </div>
    </div>
  );
}
