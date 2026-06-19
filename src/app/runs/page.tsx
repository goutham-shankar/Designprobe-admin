"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { cn, timeAgo, urlToSlug, getDomain } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Search, RefreshCw, MoreVertical, Trash2, Plus,
  Loader2, ChevronLeft, ChevronRight, Hash, ExternalLink,
  Star, X,
} from "lucide-react";
import { SiteFavicon } from "@/components/SiteFavicon";

interface Run {
  _id: string;
  runId: string;
  url: string;
  slug?: string;
  status?: string;
  provider?: string;
  model?: string;
  durationMs?: number | null;
  r2?: { slug?: string | null } | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  costEstimate?: { totalUsd?: number } | null;
  source?: "library" | "volt" | "scrape" | null;
  featured?: boolean;
  createdAt?: string;
}

/* ── Source Badge ── */

const SOURCE_STYLES: Record<string, string> = {
  library: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  volt:    "bg-amber-500/15 text-amber-400 border-amber-500/30",
  scrape:  "bg-zinc-800 text-zinc-400 border-zinc-700",
};

function SourceBadge({ source }: { source?: string | null }) {
  if (!source || source === "scrape") return null;
  const cls = SOURCE_STYLES[source] ?? SOURCE_STYLES.scrape;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium", cls)}>
      {source}
    </span>
  );
}

/* ── Table Skeleton ── */

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-800/60 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider w-[30%]">Site</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cost</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/30">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Skeleton className="h-5 w-5 rounded-sm" /><Skeleton className="h-4 w-44" /></div></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function RunsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<Run | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [scrapeOpen, setScrapeOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const [error, setError] = useState("");

  const fetchRuns = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await apiFetch<{ ok: boolean; data: Run[]; total: number; pages: number }>(
        `/api/admin/runs?${params}`,
      );
      setRuns(res.data);
      setPages(res.pages);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user, page, status, debouncedSearch]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ ok: boolean; data: { name: string }[] }>("/api/admin/categories")
      .then((r) => setCategories(r.data.map((c) => c.name)))
      .catch(() => {});
  }, [user]);

  const assignCategory = async (runId: string, category: string) => {
    setAssigningId(runId);
    try {
      await apiFetch(`/api/admin/runs/${runId}`, {
        method: "PATCH",
        body: JSON.stringify({ category }),
      });
      setRuns((prev) => prev.map((r) => r.runId === runId ? { ...r, category } : r));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setAssigningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/runs/${deleteTarget.runId}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchRuns();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleNewScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      await apiFetch("/api/admin/scrape", {
        method: "POST",
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      setScrapeOpen(false);
      setScrapeUrl("");
      fetchRuns();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setScraping(false);
    }
  };

  const toggleFeatured = async (run: Run) => {
    const newVal = !run.featured;
    try {
      await apiFetch(`/api/admin/runs/${run.runId}`, {
        method: "PATCH",
        body: JSON.stringify({ featured: newVal }),
      });
      setRuns((prev) => prev.map((r) => r.runId === run.runId ? { ...r, featured: newVal } : r));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const toggleSelect = (runId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId); else next.add(runId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === runs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(runs.map((r) => r.runId)));
    }
  };

  const bulkSetFeatured = async (featured: boolean) => {
    setBulkLoading(true);
    try {
      await apiFetch("/api/admin/runs/bulk", {
        method: "PATCH",
        body: JSON.stringify({ runIds: Array.from(selected), updates: { featured } }),
      });
      setRuns((prev) => prev.map((r) => selected.has(r.runId) ? { ...r, featured } : r));
      setSelected(new Set());
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkLoading(false);
    }
  };

  if (!user) return <p className="text-zinc-500 mt-16 text-center text-sm">Sign in to view designs.</p>;

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Designs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{total} runs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRuns}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setScrapeOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Scrape
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search URL, slug, runId..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 text-sm bg-zinc-950 border border-zinc-800 rounded-md text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="completed_with_warnings">Warnings</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2">
          <span className="text-sm text-zinc-300">{selected.size} selected</span>
          <div className="h-4 w-px bg-zinc-700" />
          <Button variant="outline" size="sm" disabled={bulkLoading} onClick={() => bulkSetFeatured(true)}>
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Add to Library
          </Button>
          <Button variant="outline" size="sm" disabled={bulkLoading} onClick={() => bulkSetFeatured(false)}>
            <Star className="h-3.5 w-3.5 text-zinc-500" /> Remove from Library
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
          {bulkLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRuns}>Retry</Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-zinc-800/60 text-left">
                <th className="px-3 py-2.5 w-9">
                  <input
                    type="checkbox"
                    checked={runs.length > 0 && selected.size === runs.length}
                    onChange={toggleSelectAll}
                    className="accent-violet-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 pl-2 pr-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Site</th>
                <th className="py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-[140px]">Status</th>
                <th className="py-2.5 px-1 w-10 text-center" title="Featured in Library">
                  <Star className="h-3.5 w-3.5 text-zinc-500 mx-auto" />
                </th>
                <th className="py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-[110px]">Category</th>
                <th className="py-2.5 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider w-[80px]">Created</th>
                <th className="py-2.5 px-2 w-9"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const slug = run.slug || urlToSlug(run.url);
                return (
                  <tr
                    key={run.runId}
                    className={cn("border-b border-zinc-800/30 transition-colors cursor-pointer hover:bg-zinc-900/50", selected.has(run.runId) && "bg-zinc-900/70")}
                    onClick={() => router.push(`/runs/${encodeURIComponent(slug)}`)}
                  >
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(run.runId)}
                        onChange={() => toggleSelect(run.runId)}
                        className="accent-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 pl-2 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <SiteFavicon url={run.url} size={18} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-200 truncate font-medium">{run.title || getDomain(run.url)}</p>
                          <p className="text-[10px] text-zinc-600 font-mono truncate">{slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={run.status} />
                        <SourceBadge source={run.source} />
                      </div>
                    </td>
                    <td className="py-2.5 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFeatured(run)}
                        className="inline-flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                        title={run.featured ? "Remove from library" : "Add to library"}
                      >
                        <Star className={cn("h-4 w-4", run.featured ? "text-amber-400 fill-amber-400" : "text-zinc-700 hover:text-zinc-500")} />
                      </button>
                    </td>
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      {assigningId === run.runId ? (
                        <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                      ) : (
                        <select
                          value={run.category ?? "Other"}
                          onChange={(e) => assignCategory(run.runId, e.target.value)}
                          className="h-6 px-1 text-[11px] bg-zinc-900 border border-zinc-700 rounded text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600 w-full truncate"
                        >
                          {Array.from(new Set(["Other", run.category ?? "Other", ...categories])).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-zinc-500">{timeAgo(run.createdAt)}</td>
                    <td className="py-2.5 px-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/runs/${encodeURIComponent(slug)}`); }}>
                            <ExternalLink className="text-zinc-400" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(slug); }}>
                            <Hash className="text-zinc-400" /> Copy Slug
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={(e) => { e.stopPropagation(); setDeleteTarget(run); }}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {runs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">No runs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-zinc-500">{page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* New Scrape Dialog */}
      <Dialog open={scrapeOpen} onOpenChange={setScrapeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Scrape</DialogTitle>
            <DialogDescription>Enter a URL to scrape and generate a design system.</DialogDescription>
          </DialogHeader>
          <div>
            <Input
              placeholder="https://example.com"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNewScrape()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScrapeOpen(false)}>Cancel</Button>
            <Button onClick={handleNewScrape} disabled={scraping || !scrapeUrl.trim()}>
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Scrape
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Run</DialogTitle>
            <DialogDescription>
              Delete <span className="font-mono text-zinc-300">{deleteTarget?.runId}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
