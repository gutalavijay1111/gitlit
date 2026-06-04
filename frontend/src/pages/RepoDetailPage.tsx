import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Lock, Globe, Settings, ChevronRight, AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import { getRepo, updateRepo, deleteRepo } from "../api/repos";
import { useAuthStore } from "../store/auth";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog";
import { IssueListView } from "../components/issues/IssueListView";

function SettingsDialog({
  open, onOpenChange, repoId, initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  repoId: number;
  initial: { name: string; description: string | null; is_private: boolean };
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [isPrivate, setIsPrivate] = useState(initial.is_private);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const saveMutation = useMutation({
    mutationFn: () => updateRepo(repoId, { name, description: description || undefined, is_private: isPrivate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repo", repoId] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRepo(repoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repos"] });
      navigate("/repos");
    },
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Repository settings</DialogTitle>
          <DialogDescription>Update repository details or manage access</DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Repository name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description <span className="text-muted-foreground text-xs">(optional)</span></label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none h-20"
              placeholder="Short description..."
            />
          </div>

          <div
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors select-none ${isPrivate ? "border-primary/30 bg-primary/5" : "border-border hover:bg-accent/30"}`}
            onClick={() => setIsPrivate(!isPrivate)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${isPrivate ? "bg-primary/15 border-primary/30" : "bg-muted border-border"}`}>
              {isPrivate ? <Lock className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{isPrivate ? "Private" : "Public"}</p>
              <p className="text-xs text-muted-foreground">
                {isPrivate ? "Only you can see this repository" : "Anyone can view this repository"}
              </p>
            </div>
            <div className={`h-5 w-9 rounded-full transition-colors relative ${isPrivate ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-destructive">Danger zone</p>
              <p className="text-xs text-muted-foreground mt-0.5">Once you delete a repository, there is no going back.</p>
            </div>
            {!confirmDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} className="gap-2">
                <Trash2 className="h-3.5 w-3.5" />Delete repository
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs text-destructive font-medium">Are you sure?</p>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!name || saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RepoDetailPage() {
  const { repoId } = useParams<{ repoId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const id = Number(repoId);

  const { data: repo, isLoading, error } = useQuery({
    queryKey: ["repo", id],
    queryFn: () => getRepo(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive/60 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Repository not found</p>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => navigate("/repos")}>
          <ArrowLeft className="h-4 w-4" />Back to repositories
        </Button>
      </div>
    );
  }

  const isOwner = user?.user_id === repo.owner_id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/repos" className="hover:text-foreground transition-colors">Repositories</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{repo.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{repo.name}</h1>
              <Badge variant={repo.is_private ? "outline" : "secondary"} className="text-[10px] h-5">
                {repo.is_private ? (
                  <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Private</span>
                ) : (
                  <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" />Public</span>
                )}
              </Badge>
            </div>
            {repo.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{repo.description}</p>
            )}
          </div>
        </div>

        {isOwner && (
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />Settings
          </Button>
        )}
      </div>

      <IssueListView repoId={id} isOwner={isOwner} />

      {isOwner && repo && (
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          repoId={id}
          initial={{ name: repo.name, description: repo.description, is_private: repo.is_private }}
        />
      )}
    </div>
  );
}
