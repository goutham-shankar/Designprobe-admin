"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { r2Url, getR2Base, setR2Base } from "@/lib/r2";
import { cn, formatDuration, timeAgo, getDomain } from "@/lib/utils";
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
  ExternalLink, Image as ImageIcon, FileCode2, FileText, Braces, Palette,
  Eye, Clock, Cpu, Loader2, Save, Copy, Check, Globe, Hash, Code,
  ArrowLeft, Pencil, RotateCcw, Trash2,
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
  r2Urls?: Record<string, string | null> | null;
  designMdText?: string | null;
  title?: string | null;
  description?: string | null;
  designTokens?: Record<string, unknown> | null;
  storageVersion?: string | null;
  pipelineVersion?: string | null;
  workerVersion?: string | null;
  source?: "library" | "volt" | "scrape" | null;
  userIds?: string[];
  summary?: {
    primaryColors?: string[];
    typographyFamilies?: string[];
    sectionCount?: number;
    componentCount?: number;
    confidenceScore?: number;
    scannedElements?: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
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

/* ── Helpers ── */

function SiteFavicon({ url, size = 20 }: { url: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const domain = getDomain(url);
  if (errored) return <Globe className="text-zinc-600 shrink-0" style={{ width: size, height: size }} />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`}
      width={size} height={size} alt="" className="rounded-sm shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

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

/* ── Page Skeleton ── */

function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Skeleton className="h-5 w-20" />
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-28 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
        </div>
      </div>
      <div className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-md" />)}</div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

/* ── Main Page ── */

export default function DesignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const token = user?.uid ?? "";
  const [run, setRun] = useState<Run | null>(null);
  const [scraped, setScraped] = useState<ScrapedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [rerunOpen, setRerunOpen] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    if (!user || getR2Base()) return;
    apiFetch<{ ok: boolean; data: { r2PublicBase?: string | null } }>("/api/admin/stats")
      .then((r) => { if (r.data.r2PublicBase) setR2Base(r.data.r2PublicBase); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiFetch<{ ok: boolean; data: Run; scraped: ScrapedDoc | null }>(
      `/api/admin/runs/by-slug/${encodeURIComponent(slug)}`,
    )
      .then((res) => { setRun(res.data); setScraped(res.scraped); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, slug]);

  const handleEdit = async () => {
    if (!run) return;
    setEditSaving(true);
    try {
      await apiFetch(`/api/admin/runs/${run.runId}`, {
        method: "PATCH", adminToken: token,
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      });
      setEditOpen(false);
      setRun({ ...run, title: editTitle, description: editDesc });
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!run) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/runs/${run.runId}`, { method: "DELETE", adminToken: token });
      router.push("/runs");
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    finally { setDeleting(false); }
  };

  const handleRerun = async () => {
    if (!run) return;
    setRerunning(true);
    try {
      await apiFetch(`/api/admin/runs/${run.runId}/rerun`, { method: "POST", adminToken: token });
      setRerunOpen(false);
      router.push("/runs");
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    finally { setRerunning(false); }
  };

  if (!user) return <p className="text-zinc-500 mt-16 text-center text-sm">Sign in to view designs.</p>;
  if (loading) return <PageSkeleton />;
  if (error) return (
    <div className="max-w-md mx-auto mt-16 rounded-lg border border-red-900/50 bg-red-950/20 p-6">
      <p className="text-red-400 text-sm font-medium">Failed to load design</p>
      <p className="text-xs text-zinc-500 mt-1">{error}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/runs")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Designs
      </Button>
    </div>
  );
  if (!run) return null;

  const screenshotUrl = r2Url(run.r2?.screenshot) || run.r2Urls?.screenshot;
  const previewUrl = r2Url(run.r2?.previewHtml) || run.r2Urls?.previewHtml;
  const designMdUrl = r2Url(run.r2?.designMd) || run.r2Urls?.designMd;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/runs")} className="text-zinc-500 hover:text-white -ml-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Designs
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <SiteFavicon url={run.url} size={36} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-white truncate">{run.title || getDomain(run.url)}</h1>
            <a href={run.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-zinc-300 font-mono flex items-center gap-1 mt-0.5">
              {run.url} <ExternalLink className="h-3 w-3" />
            </a>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-zinc-600" />
                <span className="text-xs text-zinc-500 font-mono">{slug}</span>
                <CopyButton text={slug} />
              </div>
              <StatusBadge status={run.status} />
              {run.source && run.source !== "scrape" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    run.source === "library" && "border-violet-500/30 bg-violet-500/10 text-violet-400",
                    run.source === "volt"    && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                  )}
                >
                  {run.source}
                </Badge>
              )}
              {run.provider && (
                <Badge variant="outline" className="text-[10px]">
                  <Cpu className="h-3 w-3 mr-1" /> {run.provider}/{run.model ?? "?"}
                </Badge>
              )}
              {run.durationMs && (
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="h-3 w-3 mr-1" /> {formatDuration(run.durationMs)}
                </Badge>
              )}
            </div>
            {run.description && <p className="text-sm text-zinc-500 mt-2 max-w-2xl">{run.description}</p>}
            {run.error && <p className="text-sm text-red-400 mt-2 font-mono">{run.error}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { setEditTitle(run.title ?? ""); setEditDesc(run.description ?? ""); setEditOpen(true); }}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRerunOpen(true)}>
            <RotateCcw className="h-3.5 w-3.5" /> Re-scrape
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3 Tabs: Preview, Data, Raw */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</TabsTrigger>
          <TabsTrigger value="data"><Palette className="h-3.5 w-3.5 mr-1.5" /> Data</TabsTrigger>
          <TabsTrigger value="json"><Braces className="h-3.5 w-3.5 mr-1.5" /> Raw</TabsTrigger>
        </TabsList>

        {/* ── Preview Tab ── */}
        <TabsContent value="preview">
          <PreviewTab
            slug={slug}
            screenshotUrl={screenshotUrl}
            previewUrl={previewUrl}
            designMdUrl={designMdUrl}
          />
        </TabsContent>

        {/* ── Data Tab ── */}
        <TabsContent value="data">
          <DataTab run={run} scraped={scraped} />
        </TabsContent>

        {/* ── Raw JSON Tab ── */}
        <TabsContent value="json">
          <ScrollArea className="h-[600px] rounded-md border border-zinc-800 bg-zinc-950 mt-2">
            <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
              {JSON.stringify({ run, scraped }, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Run</DialogTitle>
            <DialogDescription className="font-mono text-xs">{run.runId}</DialogDescription>
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
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Run</DialogTitle>
            <DialogDescription>
              Delete <span className="font-mono text-zinc-300">{slug}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rerun Dialog */}
      <Dialog open={rerunOpen} onOpenChange={setRerunOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-scrape</DialogTitle>
            <DialogDescription>
              Queue a fresh scrape for <span className="font-mono text-zinc-300">{run.url}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRerunOpen(false)}>Cancel</Button>
            <Button onClick={handleRerun} disabled={rerunning}>
              {rerunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Re-scrape
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Preview Tab with live HTML editor ── */

type PreviewMode = "preview" | "edit";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function PreviewTab({
  slug,
  screenshotUrl,
  previewUrl,
  designMdUrl,
}: {
  slug: string;
  screenshotUrl?: string | null;
  previewUrl?: string | null;
  designMdUrl?: string | null;
}) {
  const [mode, setMode] = useState<PreviewMode>("preview");
  const [html, setHtml] = useState("");
  const [htmlLoading, setHtmlLoading] = useState(true);
  const [htmlError, setHtmlError] = useState("");
  const [htmlSaving, setHtmlSaving] = useState(false);
  const [htmlDirty, setHtmlDirty] = useState(false);
  const [htmlSaved, setHtmlSaved] = useState(false);
  const debouncedHtml = useDebounce(html, 400);

  useEffect(() => {
    setHtmlLoading(true);
    setHtmlError("");
    apiFetch<{ ok: boolean; html: string }>(
      `/api/admin/runs/by-slug/${encodeURIComponent(slug)}/html`,
    )
      .then((res) => { setHtml(res.html); })
      .catch((e) => setHtmlError(e instanceof Error ? e.message : String(e)))
      .finally(() => setHtmlLoading(false));
  }, [slug]);

  const saveHtml = async () => {
    setHtmlSaving(true);
    try {
      await apiFetch(`/api/admin/runs/by-slug/${encodeURIComponent(slug)}/html`, {
        method: "PUT",
        body: JSON.stringify({ html }),
      });
      setHtmlDirty(false);
      setHtmlSaved(true);
      setTimeout(() => setHtmlSaved(false), 2000);
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    finally { setHtmlSaving(false); }
  };

  return (
    <div className="space-y-4 mt-2">
      {/* Toggle bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button
            variant={mode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("edit")}
          >
            <Code className="h-3.5 w-3.5" /> Edit HTML
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <>
              {htmlSaved && <span className="text-xs text-emerald-400">Saved to R2</span>}
              <Button size="sm" onClick={saveHtml} disabled={htmlSaving || !htmlDirty}>
                {htmlSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save to R2
              </Button>
            </>
          )}
          {mode === "preview" && previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
              Open full page <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {htmlLoading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading HTML...
        </div>
      ) : htmlError ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-red-400 text-sm">Failed to load HTML</p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{htmlError}</p>
        </div>
      ) : mode === "edit" ? (
        /* ── Split: Code editor left + live preview right ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ height: "650px" }}>
          <div className="flex flex-col h-full">
            <textarea
              value={html}
              onChange={(e) => { setHtml(e.target.value); setHtmlDirty(true); }}
              className="w-full flex-1 rounded-lg border border-zinc-800 bg-black p-4 text-xs text-zinc-300 font-mono resize-none outline-none focus:ring-1 focus:ring-zinc-600"
              spellCheck={false}
              placeholder="HTML source..."
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              {htmlDirty ? "Unsaved changes" : "No changes"} · {html.length.toLocaleString()} chars · Preview updates as you type
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800/60 overflow-hidden bg-white h-full">
            {debouncedHtml ? (
              <iframe srcDoc={debouncedHtml} title="Live Preview" className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts" />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400 text-sm">No HTML to preview</div>
            )}
          </div>
        </div>
      ) : (
        /* ── Visual Preview ── */
        <div className="space-y-4">
          {screenshotUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Screenshot</h3>
              <div className="rounded-lg border border-zinc-800/60 bg-zinc-900 p-2 flex justify-center">
                <img src={screenshotUrl} alt="Screenshot" className="max-h-[400px] rounded object-contain" />
              </div>
            </div>
          )}
          {previewUrl && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Live Preview</h3>
              <div className="rounded-lg border border-zinc-800/60 overflow-hidden bg-white" style={{ height: "600px" }}>
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
          {!screenshotUrl && !previewUrl && (
            <p className="text-sm text-zinc-600 py-8 text-center">No preview available.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Data Tab (merged: artifacts, tokens, source, usage) ── */

function DataTab({ run, scraped }: { run: Run; scraped: ScrapedDoc | null }) {
  const palette = (run.designTokens?.palette as Array<{ name: string; hex: string }>) ?? [];
  const fonts = (run.designTokens?.fonts as Array<{ name: string; role: string }>) ?? [];
  const brandAssets = scraped?.brandAssets;
  const assetEntries = brandAssets ? Object.entries(brandAssets).filter(([, v]) => v) : [];

  return (
    <div className="space-y-6 mt-2">
      {/* Artifacts */}
      {run.r2 && (
        <Section title="Artifacts">
          <ArtifactsGrid r2={run.r2} />
        </Section>
      )}

      {/* Colors */}
      {palette.length > 0 && (
        <Section title="Color Palette">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
        </Section>
      )}

      {/* Fonts */}
      {fonts.length > 0 && (
        <Section title="Fonts">
          <div className="flex flex-wrap gap-2">
            {fonts.map((f, i) => (
              <Badge key={i} variant="outline">{f.name} — {f.role}</Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Brand Assets */}
      {assetEntries.length > 0 && (
        <Section title="Brand Assets">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {assetEntries.map(([key, src]) => (
              <div key={key} className="rounded-lg border border-zinc-800/60 bg-black/50 p-3 text-center">
                <div className="h-12 flex items-center justify-center mb-2">
                  <img src={String(src)} alt={key} className="max-h-12 max-w-full object-contain rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <p className="text-[10px] text-zinc-500 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Source Metadata */}
      {scraped && (
        <Section title="Source Metadata">
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
        </Section>
      )}

      {/* Summary Metrics */}
      {run.summary && (run.summary.confidenceScore || run.summary.scannedElements || run.summary.sectionCount) ? (
        <Section title="Quality Metrics">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Confidence", value: run.summary.confidenceScore != null ? `${Math.round(run.summary.confidenceScore * 100)}%` : null },
              { label: "Scanned", value: run.summary.scannedElements?.toLocaleString() ?? null },
              { label: "Sections", value: run.summary.sectionCount?.toLocaleString() ?? null },
              { label: "Components", value: run.summary.componentCount?.toLocaleString() ?? null },
            ].filter(m => m.value).map((m) => (
              <div key={m.label} className="rounded-lg border border-zinc-800/60 bg-black/50 p-3 text-center">
                <p className="text-lg font-bold text-zinc-100">{m.value}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Pipeline Info */}
      {(run.pipelineVersion || run.workerVersion || run.storageVersion || (run.userIds && run.userIds.length > 0)) && (
        <Section title="Pipeline">
          <div className="rounded-lg border border-zinc-800/60 bg-black/50 p-4 space-y-2">
            {[
              { label: "Pipeline Version", value: run.pipelineVersion },
              { label: "Worker Version", value: run.workerVersion },
              { label: "Storage Version", value: run.storageVersion },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-zinc-500">{label}</span>
                <span className="text-zinc-300 font-mono text-xs">{value}</span>
              </div>
            ))}
            {run.userIds && run.userIds.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Initiated by</span>
                <span className="text-zinc-300 font-mono text-xs">{run.userIds.length} user{run.userIds.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Usage */}
      {(run.tokenUsage || run.costEstimate) && (
        <Section title="Usage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {run.tokenUsage && (
              <div className="rounded-lg border border-zinc-800/60 bg-black/50 p-4 space-y-2">
                <h4 className="text-[10px] text-zinc-600 uppercase tracking-wider">Tokens</h4>
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
                <h4 className="text-[10px] text-zinc-600 uppercase tracking-wider">Cost</h4>
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
          </div>
        </Section>
      )}
    </div>
  );
}

/* ── Section wrapper ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

/* ── Artifacts Grid ── */

function ArtifactsGrid({ r2 }: { r2: R2Keys }) {
  const items = [
    { label: "Preview HTML", key: r2.previewHtml, icon: FileCode2, color: "text-blue-400" },
    { label: "Design.md", key: r2.designMd, icon: FileText, color: "text-emerald-400" },
    { label: "Screenshot", key: r2.screenshot, icon: ImageIcon, color: "text-purple-400" },
    { label: "Semantic Structure", key: r2.semanticStructure, icon: Braces, color: "text-yellow-400" },
    { label: "Design Tokens", key: r2.designTokens, icon: Palette, color: "text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
