import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lock, Globe, GitBranch, Trash2, ChevronRight, Search, AlertCircle, MessageSquare, CircleDot, Clock } from "lucide-react";
import { listRepos, createRepo, deleteRepo, type Repo } from "../api/repos";
import { formatRelativeTime } from "../lib/utils";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

function RepoCard({ repo, currentUserId, onDelete }: { repo: Repo; currentUserId: number; onDelete: (id: number) => void }) {
  return (
    <div className="group flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
        <GitBranch className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/repos/${repo.id}`}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
          >
            {repo.name}
          </Link>
          <Badge variant={repo.is_private ? "outline" : "secondary"} className="text-[10px] py-0 h-4 shrink-0">
            {repo.is_private ? (
              <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Private</span>
            ) : (
              <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" />Public</span>
            )}
          </Badge>
        </div>
        {repo.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{repo.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CircleDot className="h-3 w-3" />
            {repo.issue_count} {repo.issue_count === 1 ? "issue" : "issues"}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {repo.comment_count} {repo.comment_count === 1 ? "comment" : "comments"}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(repo.created_at)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {currentUserId === repo.owner_id && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            onClick={(e) => { e.preventDefault(); onDelete(repo.id); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <Link to={`/repos/${repo.id}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      </div>
    </div>
  );
}

export function ReposPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: repos, isLoading, error } = useQuery({
    queryKey: ["repos"],
    queryFn: listRepos,
  });

  const createMutation = useMutation({
    mutationFn: () => createRepo({ name: newName, description: newDesc || undefined, is_private: newPrivate }),
    onSuccess: (repo) => {
      qc.invalidateQueries({ queryKey: ["repos"] });
      setShowCreate(false);
      setNewName(""); setNewDesc(""); setNewPrivate(false);
      navigate(`/repos/${repo.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRepo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repos"] }),
  });

  const filtered = repos?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-muted-foreground">Please <Link to="/login" className="text-primary hover:underline">sign in</Link> to view repositories.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Repositories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{repos?.length ?? 0} repositories</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New repository
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Find a repository..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-destructive/60" />
            <p className="text-sm text-muted-foreground">Failed to load repositories</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <GitBranch className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No repositories match your search" : "No repositories yet"}
            </p>
            {!search && (
              <Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />Create your first repo
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                currentUserId={user.user_id}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new repository</DialogTitle>
            <DialogDescription>A repository contains all your project files and revision history.</DialogDescription>
          </DialogHeader>
          <div className="px-6 space-y-4">
            {createMutation.isError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Repository name might already exist.</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Repository name <span className="text-destructive">*</span></label>
              <Input
                placeholder="my-awesome-project"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground text-xs">(optional)</span></label>
              <Textarea
                placeholder="A short description of your repository..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <input
                type="checkbox"
                id="is-private"
                checked={newPrivate}
                onChange={(e) => setNewPrivate(e.target.checked)}
                className="h-4 w-4 accent-violet-500 cursor-pointer"
              />
              <div>
                <label htmlFor="is-private" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Private repository
                </label>
                <p className="text-xs text-muted-foreground">Only you can see this repository</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
