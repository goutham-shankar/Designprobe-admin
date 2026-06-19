"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database, Loader2, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
} from "lucide-react";

interface CollectionInfo {
  name: string;
  count: number;
  size: number;
  storageSize: number;
  indexes: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: CollectionInfo[] }>("/api/admin/collections");
      setCollections(res.data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocs = useCallback(async () => {
    if (!selected) return;
    setDocsLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: Record<string, unknown>[]; total: number; pages: number }>(
        `/api/admin/collections/${selected}?page=${page}&limit=20`,
      );
      setDocs(res.data);
      setPages(res.pages);
      setTotal(res.total);
    } catch { /* ignore */ } finally {
      setDocsLoading(false);
    }
  }, [selected, page]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);
  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  return (
    <div className="space-y-4 max-w-7xl">
      <h1 className="text-xl font-semibold text-white">Collections</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {collections.map((c) => (
            <button
              key={c.name}
              onClick={() => { setSelected(c.name); setPage(1); setExpanded(null); }}
              className={cn(
                "rounded-lg border bg-zinc-950 p-4 text-left transition-colors cursor-pointer",
                selected === c.name ? "border-zinc-600 bg-zinc-900" : "border-zinc-800/60 hover:border-zinc-700",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-zinc-500" />
                <p className="font-mono text-sm font-medium text-zinc-200">{c.name}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                <span>{c.count} docs</span>
                <span>{formatBytes(c.size)}</span>
                <span>{c.indexes} idx</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-medium text-white font-mono">{selected}</h2>
              <span className="text-xs text-zinc-500">{total} docs</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}>
              <X className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>

          {docsLoading ? (
            <div className="flex items-center justify-center py-8 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {docs.map((doc, i) => {
                const id = String(doc._id ?? i);
                const isExpanded = expanded === id;
                return (
                  <div key={id} className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
                    <button
                      className="w-full px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors text-left"
                      onClick={() => setExpanded(isExpanded ? null : id)}
                    >
                      <div className="flex items-center gap-3 text-xs font-mono truncate min-w-0">
                        <span className="text-zinc-600">_id:</span>
                        <span className="text-zinc-400">{id}</span>
                        {"url" in doc && doc.url != null && (
                          <>
                            <span className="text-zinc-600">url:</span>
                            <span className="text-zinc-300 truncate max-w-[300px]">{String(doc.url)}</span>
                          </>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-600 shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-600 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-zinc-800/60">
                        <ScrollArea className="h-[400px]">
                          <pre className="p-4 text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                            {JSON.stringify(doc, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                );
              })}
              {docs.length === 0 && (
                <p className="text-zinc-600 text-center py-8 text-sm">Collection is empty.</p>
              )}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-zinc-500">{page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
