import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Globe, Lock, GitBranch, Search, ChevronRight, ChevronLeft,
  AlertCircle, MessageSquare, CircleDot, Clock,
} from "lucide-react";
import { exploreRepos, type Repo } from "../api/repos";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { formatRelativeTime } from "../lib/utils";

const PAGE_SIZE = 10;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const result: (number | "…")[] = [0];
  if (current > 2) result.push("…");
  for (let p = Math.max(1, current - 1); p <= Math.min(total - 2, current + 1); p++) {
    result.push(p);
  }
  if (current < total - 3) result.push("…");
  result.push(total - 1);
  return result;
}

function ExploreRepoCard({ repo }: { repo: Repo }) {
  return (
    <Link to={`/repos/${repo.id}`} className="group block">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
          <GitBranch className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {repo.name}
            </span>
            <Badge variant={repo.is_private ? "outline" : "secondary"} className="text-[9px] py-0 h-3.5 shrink-0">
              {repo.is_private ? (
                <span className="flex items-center gap-0.5"><Lock className="h-2 w-2" />Private</span>
              ) : (
                <span className="flex items-center gap-0.5"><Globe className="h-2 w-2" />Public</span>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {repo.description && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">{repo.description}</span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <CircleDot className="h-2.5 w-2.5" />{repo.issue_count}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <MessageSquare className="h-2.5 w-2.5" />{repo.comment_count}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Clock className="h-2.5 w-2.5" />{formatRelativeTime(repo.created_at)}
            </span>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </Link>
  );
}

export function ExplorePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["explore-repos", page],
    queryFn: () => exploreRepos(page * PAGE_SIZE, PAGE_SIZE),
  });

  const repos = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <Skeleton className="h-7 w-7 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-56" />
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
              {search ? "No repositories match your search" : "No public repositories yet"}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">
                {total} {total === 1 ? "repository" : "repositories"}
              </span>
              {totalPages > 1 && (
                <span className="text-xs text-muted-foreground">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </span>
              )}
            </div>
            {filtered.map((repo) => (
              <ExploreRepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground select-none">…</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="icon"
                onClick={() => setPage(p)}
                className="h-8 w-8 text-xs"
              >
                {p + 1}
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
