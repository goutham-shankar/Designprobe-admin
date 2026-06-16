"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { useToken } from "@/lib/useToken";
import { apiFetch } from "@/lib/api";
import { r2Url, getR2Base, setR2Base } from "@/lib/r2";
import { cn, formatDuration, timeAgo, urlToSlug, getDomain } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search, RefreshCw, MoreVertical, Pencil, Trash2, RotateCcw,
  ExternalLink, Image as ImageIcon, FileCode2, FileText, Braces, Palette,
  X, Eye, Clock, Cpu, Loader2, ChevronLeft, ChevronRight, Save, Copy, Check,
  Globe, Link2, Hash, FileSearch,
} from "lucide-react";

/* ── Types ── */

interface R2Keys {
  slug?: string | null;
  previewHtml?: string | null;
  designMd?: string | null;
  screenshot?: string | null;
  semanticStructure?: string | null;
  designTokens?: string | null;
  assets?: {
    logo?: string | null;
    favicon?: string | null;
    appleIcon?: string | null;
    ogImage?: string | null;
  } | null;
}

interface Run {
  _id: string;
  runId: string;
  url: string;
  slug?: string;
  status?: string;
  error?: string | null;
  provider?: string;
  model?: string;
  durationMs?: number | null;
  tokenUsage?: Record<string, unknown> | null;
  costEstimate?: Record<string, unknown> | null;
  r2?: R2Keys | null;
  title?: string | null;
  description?: string | null;
  designTokens?: Record<string, unknown> | null;
  storageVersion?: string | null;
  createdAt?: string;
  updatedAt?: string;
  brandAssets?: {
    logo?: string | null;
    favicon?: string | null;
    appleIcon?: string | null;
    ogImage?: string | null;
  } | null;
}

interface ScrapedDoc {
  _id: string;
  url: string;
  slug?: string;
  title?: string | null;
  description?: string | null;
  h1?: string | null;
  canonical?: string | null;
  status?: string | null;
  error?: string | null;
  runId?: string | null;
  r2?: R2Keys | null;
  brandAssets?: {
    logo?: string | null;
    favicon?: string | null;
    appleIcon?: string | null;
    ogImage?: string | null;
  } | null;
  storageVersion?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/* ── Site Favicon ── */

function SiteFavicon({ url, size = 20 }: { url: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const domain = getDomain(url);

  if (errored) {
    return <Globe className="h-4 w-4 text-zinc-600 shrink-0" />;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`}
      width={size}
      height={size}
      alt=""
      className="rounded-sm shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

/* ── Copy Button ── */

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button onClick={copy} className={cn("text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer", className)}>
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
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
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider w-[35%]">URL</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-sm" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                </td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
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

/* ── Detail Skeleton ── */

function DetailSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function RunsPage() {
  const { token } = useToken();
  const [runs, setRuns] = useState<Run[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Run | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editRun, setEditRun] = useState<Run | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Run | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [rerunTarget, setRerunTarget] = useState<Run | null>(null);
  const [rerunning, setRerunning] = useState(false);

  const [scrapedData, setScrapedData] = useState<ScrapedDoc | null>(null);
  const [scrapedLoading, setScrapedLoading] = useState(false);

  const [r2Ready, setR2Ready] = useState(!!getR2Base());

  useEffect(() => {
    if (!token || getR2Base()) { setR2Ready(!!getR2Base()); return; }
    apiFetch<{ ok: boolean; data: { r2PublicBase?: string | null } }>("/api/admin/stats", { adminToken: token })
      .then((r) => { if (r.data.r2PublicBase) { setR2Base(r.data.r2PublicBase); setR2Ready(true); } })
      .catch(() => {});
  }, [token]);

  const fetchRuns = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      if (search) params.set("search", search);
      const res = await apiFetch<{ ok: boolean; data: Run[]; total: number; pages: number }>(
        `/api/admin/runs?${params}`, { adminToken: token },
      );
      setRuns(res.data);
      setPages(res.pages);
      setTotal(res.total);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [token, page, status, search]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const openDetail = async (run: Run) => {
    if (selected?.runId === run.runId) { setSelected(null); setScrapedData(null); return; }
    setDetailLoading(true);
    setSelected(run);
    setScrapedData(null);
    try {
      const res = await apiFetch<{ ok: boolean; data: Run }>(`/api/admin/runs/${run.runId}`, { adminToken: token });
      setSelected(res.data);
    } catch { /* keep list data */ } finally {
      setDetailLoading(false);
    }
    // Fetch matching scraped data
    setScrapedLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: ScrapedDoc[] }>(
        `/api/admin/scraped?search=${encodeURIComponent(run.url)}&limit=1`, { adminToken: token },
      );
      if (res.data.length > 0) setScrapedData(res.data[0]);
    } catch { /* ignore */ } finally {
      setScrapedLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editRun) return;
    setEditSaving(true);
    try {
      await apiFetch(`/api/admin/runs/${editRun.runId}`, {
        method: "PATCH", adminToken: token,
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      });
      setEditRun(null);
      fetchRuns();
      if (selected?.runId === editRun.runId) openDetail(editRun);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/runs/${deleteTarget.runId}`, { method: "DELETE", adminToken: token });
      setDeleteTarget(null);
      if (selected?.runId === deleteTarget.runId) { setSelected(null); setScrapedData(null); }
      fetchRuns();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleRerun = async () => {
    if (!rerunTarget) return;
    setRerunning(true);
    try {
      await apiFetch(`/api/admin/runs/${rerunTarget.runId}/rerun`, { method: "POST", adminToken: token });
      setRerunTarget(null);
      fetchRuns();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setRerunning(false);
    }
  };

  if (!token) {
    return <p className="text-zinc-500 mt-16 text-center text-sm">Enter admin token on the dashboard first.</p>;
  }

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Designs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{total} runs &middot; scraped data merged</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRuns}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
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

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800/60 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider w-[30%]">Site</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const slug = run.slug || urlToSlug(run.url);
                  return (
                    <Fragment key={run.runId}>
                      <tr
                        className={cn(
                          "border-b border-zinc-800/30 transition-colors cursor-pointer",
                          selected?.runId === run.runId ? "bg-zinc-900" : "hover:bg-zinc-900/50",
                        )}
                        onClick={() => openDetail(run)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SiteFavicon url={run.url} size={18} />
                            <div className="min-w-0">
                              <p className="text-xs text-zinc-200 truncate font-medium">{run.title || getDomain(run.url)}</p>
                              <p className="text-[10px] text-zinc-600 font-mono truncate">{run.url}</p>
                            </div>
                            {run.r2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">R2</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[120px]">{slug}</span>
                            <CopyButton text={slug} />
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                        <td className="px-4 py-3 text-xs text-zinc-500 font-mono">{formatDuration(run.durationMs)}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{timeAgo(run.createdAt)}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4 text-zinc-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditRun(run); setEditTitle(run.title ?? ""); setEditDesc(run.description ?? ""); }}>
                                <Pencil className="text-zinc-400" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRerunTarget(run); }}>
                                <RotateCcw className="text-zinc-400" /> Re-scrape
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
                    </Fragment>
                  );
                })}
                {runs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-sm">No runs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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

      {/* ── Detail Panel ── */}
      {selected && (
        detailLoading ? <DetailSkeleton /> : (
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800/60 flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-3">
                <SiteFavicon url={selected.url} size={28} />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">{selected.title || getDomain(selected.url)}</h2>
                  <p className="text-[11px] text-zinc-600 font-mono truncate">{selected.url}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-500 font-mono">{selected.slug || urlToSlug(selected.url)}</span>
                      <CopyButton text={selected.slug || urlToSlug(selected.url)} />
                    </div>
                    <StatusBadge status={selected.status} />
                    {selected.provider && (
                      <Badge variant="outline" className="text-[10px]">
                        <Cpu className="h-3 w-3 mr-1" /> {selected.provider}/{selected.model ?? "?"}
                      </Badge>
                    )}
                    {selected.durationMs && (
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1" /> {formatDuration(selected.durationMs)}
                      </Badge>
                    )}
                  </div>
                  {selected.description && (
                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{selected.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditRun(selected); setEditTitle(selected.title ?? ""); setEditDesc(selected.description ?? ""); }}>
                  <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRerunTarget(selected)}>
                  <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelected(null); setScrapedData(null); }}>
                  <X className="h-3.5 w-3.5 text-zinc-400" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="artifacts" className="w-full">
              <div className="px-5 pt-3">
                <TabsList>
                  <TabsTrigger value="artifacts"><FileCode2 className="h-3.5 w-3.5 mr-1.5" /> Artifacts</TabsTrigger>
                  <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</TabsTrigger>
                  <TabsTrigger value="tokens"><Palette className="h-3.5 w-3.5 mr-1.5" /> Tokens</TabsTrigger>
                  <TabsTrigger value="source"><FileSearch className="h-3.5 w-3.5 mr-1.5" /> Source</TabsTrigger>
                  <TabsTrigger value="usage"><Cpu className="h-3.5 w-3.5 mr-1.5" /> Usage</TabsTrigger>
                  <TabsTrigger value="json"><Braces className="h-3.5 w-3.5 mr-1.5" /> Raw</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="artifacts" className="px-5 pb-5">
                <ArtifactsGrid r2={selected.r2} r2Ready={r2Ready} />
              </TabsContent>

              <TabsContent value="preview" className="px-5 pb-5">
                <PreviewTab r2={selected.r2} />
              </TabsContent>

              <TabsContent value="tokens" className="px-5 pb-5">
                <DesignTokensTab tokens={selected.designTokens} />
              </TabsContent>

              <TabsContent value="source" className="px-5 pb-5">
                <SourceDataTab scraped={scrapedData} loading={scrapedLoading} />
              </TabsContent>

              <TabsContent value="usage" className="px-5 pb-5">
                <UsageTab run={selected} />
              </TabsContent>

              <TabsContent value="json" className="px-5 pb-5">
                <ScrollArea className="h-[500px] rounded-md border border-zinc-800 bg-zinc-950">
                  <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )
      )}

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editRun} onOpenChange={(o) => !o && setEditRun(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Run</DialogTitle>
            <DialogDescription className="font-mono text-xs">{editRun?.runId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Site title" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Description</label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRun(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Run</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-mono text-zinc-300">{deleteTarget?.runId}</span>? This action cannot be undone.
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

      {/* ── Rerun Dialog ── */}
      <Dialog open={!!rerunTarget} onOpenChange={(o) => !o && setRerunTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-scrape</DialogTitle>
            <DialogDescription>
              Queue a fresh scrape for <span className="font-mono text-zinc-300">{rerunTarget?.url}</span>? The existing run data will be replaced.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRerunTarget(null)}>Cancel</Button>
            <Button onClick={handleRerun} disabled={rerunning}>
              {rerunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Re-scrape
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Artifacts Grid ── */

function ArtifactsGrid({ r2, r2Ready }: { r2?: R2Keys | null; r2Ready: boolean }) {
  if (!r2) return <p className="text-sm text-zinc-600 py-4">No R2 artifacts.</p>;

  const items = [
    { label: "Preview HTML", key: r2.previewHtml, icon: FileCode2, color: "text-blue-400" },
    { label: "Design.md", key: r2.designMd, icon: FileText, color: "text-emerald-400" },
    { label: "Screenshot", key: r2.screenshot, icon: ImageIcon, color: "text-purple-400" },
    { label: "Semantic Structure", key: r2.semanticStructure, icon: Braces, color: "text-yellow-400" },
    { label: "Design Tokens", key: r2.designTokens, icon: Palette, color: "text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
      {items.map((a) => {
        const url = r2Url(a.key);
        const Icon = a.icon;
        return (
          <div key={a.label} className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-black/50 px-3 py-3">
            <div className={cn("h-8 w-8 rounded-md bg-zinc-900 flex items-center justify-center shrink-0", a.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200">{a.label}</p>
              <p className="text-[10px] text-zinc-600 font-mono truncate">{a.key ?? "—"}</p>
            </div>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-zinc-700 text-xs">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Preview Tab ── */

function PreviewTab({ r2 }: { r2?: R2Keys | null }) {
  const screenshotUrl = r2Url(r2?.screenshot);
  const previewUrl = r2Url(r2?.previewHtml);
  const designMdUrl = r2Url(r2?.designMd);

  if (!r2) return <p className="text-sm text-zinc-600 py-4">No preview available.</p>;

  return (
    <div className="space-y-4 mt-1">
      {screenshotUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Screenshot</h4>
            <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-900 p-2 flex justify-center">
            <img src={screenshotUrl} alt="Screenshot" className="max-h-[350px] rounded object-contain" />
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Preview HTML</h4>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
              Full page <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="rounded-lg border border-zinc-800/60 overflow-hidden bg-white" style={{ height: "500px" }}>
            <iframe src={previewUrl} title="Preview" className="w-full h-full border-0" sandbox="allow-same-origin" />
          </div>
        </div>
      )}

      {designMdUrl && (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-400" />
          <a href={designMdUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-300 hover:text-white flex items-center gap-1">
            Open design.md <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Design Tokens Tab ── */

function DesignTokensTab({ tokens }: { tokens?: Record<string, unknown> | null }) {
  if (!tokens) return <p className="text-sm text-zinc-600 py-4">No design tokens.</p>;

  const palette = (tokens.palette as Array<{ name: string; hex: string; desc: string }>) ?? [];
  const fonts = (tokens.fonts as Array<{ name: string; role: string }>) ?? [];

  return (
    <div className="space-y-4 mt-1">
      {palette.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Color Palette</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {palette.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-zinc-800/60 bg-black/50 p-2">
                <div className="h-8 w-8 rounded-md shrink-0 border border-zinc-800" style={{ backgroundColor: c.hex }} />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-200 truncate">{c.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fonts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Fonts</h4>
          <div className="flex flex-wrap gap-2">
            {fonts.map((f, i) => (
              <Badge key={i} variant="outline">{f.name} — {f.role}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">All Tokens</h4>
        <ScrollArea className="h-[300px] rounded-md border border-zinc-800 bg-black/50">
          <pre className="p-3 text-xs text-zinc-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(tokens, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

/* ── Source Data Tab (merged scraped data) ── */

function SourceDataTab({ scraped, loading }: { scraped: ScrapedDoc | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3 mt-1">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (!scraped) {
    return <p className="text-sm text-zinc-600 py-4">No linked scraped data found for this URL.</p>;
  }

  const brandAssets = scraped.brandAssets;
  const assetEntries = brandAssets
    ? Object.entries(brandAssets).filter(([, v]) => v)
    : [];

  return (
    <div className="space-y-4 mt-1">
      {/* Metadata cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          ["Title", scraped.title],
          ["Description", scraped.description],
          ["H1", scraped.h1],
          ["Canonical", scraped.canonical],
        ] as [string, string | null | undefined][])
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-800/60 bg-black/50 p-3">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-zinc-300 line-clamp-3">{value}</p>
            </div>
          ))}
      </div>

      {/* Brand Assets */}
      {assetEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Brand Assets</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {assetEntries.map(([key, src]) => (
              <div key={key} className="rounded-lg border border-zinc-800/60 bg-black/50 p-3 text-center">
                <div className="h-12 flex items-center justify-center mb-2">
                  <img
                    src={String(src)}
                    alt={key}
                    className="max-h-12 max-w-full object-contain rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scraped record info */}
      <div className="flex items-center gap-4 text-[11px] text-zinc-600">
        <span>ID: <span className="font-mono text-zinc-500">{scraped._id}</span></span>
        {scraped.runId && <span>Run: <span className="font-mono text-zinc-500">{scraped.runId}</span></span>}
        {scraped.storageVersion && <span>Storage: <span className="font-mono text-zinc-500">{scraped.storageVersion}</span></span>}
      </div>

      {/* Raw JSON */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Scraped Record</h4>
        <ScrollArea className="h-[300px] rounded-md border border-zinc-800 bg-black/50">
          <pre className="p-3 text-xs text-zinc-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(scraped, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

/* ── Usage & Cost Tab ── */

function UsageTab({ run }: { run: Run }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-1">
      {run.tokenUsage && (
        <div className="rounded-lg border border-zinc-800/60 bg-black/50 p-4 space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Token Usage</h4>
          {Object.entries(run.tokenUsage).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-zinc-500">{k}</span>
              <span className="text-zinc-200 font-mono text-xs">{typeof v === "number" ? v.toLocaleString() : String(v)}</span>
            </div>
          ))}
        </div>
      )}
      {run.costEstimate && (
        <div className="rounded-lg border border-zinc-800/60 bg-black/50 p-4 space-y-2">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Cost Estimate</h4>
          {Object.entries(run.costEstimate).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-zinc-500">{k}</span>
              <span className="text-zinc-200 font-mono text-xs">
                {typeof v === "number" ? (k.toLowerCase().includes("usd") || k.toLowerCase().includes("rate") ? `$${v.toFixed(6)}` : v.toLocaleString()) : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
      {!run.tokenUsage && !run.costEstimate && (
        <p className="text-sm text-zinc-600 py-4">No usage data.</p>
      )}
    </div>
  );
}
