import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleDot, CheckCircle2, Plus, Tag, MessageSquare } from "lucide-react";
import { listIssues, createIssue, type IssueSummary } from "../../api/issues";
import { useAuthStore } from "../../store/auth";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Card } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { formatRelativeTime } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { getInitials, hashColor } from "../../lib/utils";

function LabelPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border"
      style={{
        backgroundColor: color + "26",
        borderColor: color + "55",
        color: color,
      }}
    >
      {name}
    </span>
  );
}

function IssueRow({ issue, repoId }: { issue: IssueSummary; repoId: number }) {
  const isOpen = issue.state === "open";
  return (
    <div className="group flex items-start gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
      <div className="mt-0.5 shrink-0">
        {isOpen ? (
          <CircleDot className="h-4 w-4 text-emerald-400" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-violet-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/repos/${repoId}/issues/${issue.id}`}
            className="font-medium text-sm text-foreground hover:text-primary transition-colors"
          >
            {issue.title}
          </Link>
          {issue.labels.map((l) => (
            <LabelPill key={l.id} name={l.name} color={l.color} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            #{issue.id} opened {formatRelativeTime(issue.created_at)} by
          </span>
          <span className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarFallback className={`${hashColor(issue.author.username)} text-white text-[8px]`}>
                {getInitials(issue.author.username)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{issue.author.username}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
        {issue.labels.length > 0 && (
          <span className="flex items-center gap-1 text-xs">
            <Tag className="h-3 w-3" />
            {issue.labels.length}
          </span>
        )}
        {issue.comment_count > 0 && (
          <span className="flex items-center gap-1 text-xs">
            <MessageSquare className="h-3 w-3" />
            {issue.comment_count}
          </span>
        )}
      </div>
    </div>
  );
}

export function IssueListView({ repoId }: { repoId: number; isOwner: boolean }) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: issues, isLoading } = useQuery({
    queryKey: ["issues", repoId, tab],
    queryFn: () => listIssues(repoId, tab),
  });

  const openCount = useQuery({
    queryKey: ["issues-count", repoId, "open"],
    queryFn: () => listIssues(repoId, "open"),
  });

  const closedCount = useQuery({
    queryKey: ["issues-count", repoId, "closed"],
    queryFn: () => listIssues(repoId, "closed"),
  });

  const createMutation = useMutation({
    mutationFn: () => createIssue(repoId, { title, body: body || undefined }),
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ["issues", repoId] });
      qc.invalidateQueries({ queryKey: ["issues-count", repoId] });
      setShowCreate(false);
      setTitle(""); setBody("");
      navigate(`/repos/${repoId}/issues/${issue.id}`);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Issues</h2>
        {user && (
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />New issue
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "open" | "closed")}>
          <div className="px-5">
            <TabsList>
              <TabsTrigger value="open" className="gap-2">
                <CircleDot className="h-3.5 w-3.5" />
                Open
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {openCount.data?.length ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Closed
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {closedCount.data?.length ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={tab} className="m-0">
            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 px-5 py-4">
                    <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : issues?.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                  {tab === "open" ? (
                    <CircleDot className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {tab === "open" ? "No open issues" : "No closed issues"}
                </p>
                {tab === "open" && user && (
                  <Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />Create an issue
                  </Button>
                )}
              </div>
            ) : (
              <div>
                {issues?.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} repoId={repoId} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a new issue</DialogTitle>
            <DialogDescription>Describe the bug, feature request, or question</DialogDescription>
          </DialogHeader>
          <div className="px-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input
                placeholder="Brief, descriptive title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Description <span className="text-muted-foreground text-xs">(optional, supports Markdown)</span>
              </label>
              <Textarea
                placeholder="Describe the issue in detail. What happened? What did you expect? Steps to reproduce?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="h-36"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Submit issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
