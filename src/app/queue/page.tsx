"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { useToken } from "@/lib/useToken";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  RefreshCw, MoreVertical, RotateCcw, Trash2, Loader2,
  Clock, Zap, CheckCircle2, XCircle, Timer, Pause, ChevronDown, ChevronUp,
} from "lucide-react";

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface Job {
  id: string;
  name: string;
  state: string;
  progress: number;
  attemptsMade: number;
  data: Record<string, unknown>;
  failedReason?: string | null;
  timestamp: number;
  processedOn?: number | null;
  finishedOn?: number | null;
}

const STATE_CONFIG = [
  { key: "waiting", icon: Clock, color: "text-zinc-400" },
  { key: "active", icon: Zap, color: "text-blue-400" },
  { key: "completed", icon: CheckCircle2, color: "text-emerald-400" },
  { key: "failed", icon: XCircle, color: "text-red-400" },
  { key: "delayed", icon: Timer, color: "text-yellow-400" },
  { key: "paused", icon: Pause, color: "text-zinc-500" },
];

export default function QueuePage() {
  const { token } = useToken();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobState, setJobState] = useState("active");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, j] = await Promise.all([
        apiFetch<{ ok: boolean; counts: QueueStats }>("/api/admin/queues/stats", { adminToken: token }),
        apiFetch<{ ok: boolean; jobs: Job[] }>(`/api/admin/queues/jobs?state=${jobState}&limit=50`, { adminToken: token }),
      ]);
      setStats(s.counts);
      setJobs(j.jobs);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [token, jobState]);

  useEffect(() => { refresh(); }, [refresh]);

  const retryJob = async (id: string) => {
    try {
      await apiFetch(`/api/admin/jobs/${id}/retry`, { method: "POST", adminToken: token });
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRemove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/jobs/${deleteTarget.id}`, { method: "DELETE", adminToken: token });
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  if (!token) return <p className="text-zinc-500 mt-16 text-center text-sm">Enter admin token on the dashboard first.</p>;

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Queue</h1>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {STATE_CONFIG.map((s) => {
            const Icon = s.icon;
            const count = stats[s.key as keyof QueueStats];
            return (
              <button
                key={s.key}
                onClick={() => setJobState(s.key)}
                className={cn(
                  "rounded-lg border bg-zinc-950 p-3 text-left transition-colors cursor-pointer",
                  jobState === s.key ? "border-zinc-600" : "border-zinc-800/60 hover:border-zinc-700",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.key}</p>
                  <Icon className={cn("h-3.5 w-3.5", s.color)} />
                </div>
                <p className={cn("text-xl font-bold mt-1", s.color)}>{count}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Jobs table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading jobs...
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Job ID</th>
                <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">URL</th>
                <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">State</th>
                <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <Fragment key={job.id}>
                  <tr
                    className={cn(
                      "border-b border-zinc-800/30 transition-colors cursor-pointer",
                      expanded === job.id ? "bg-zinc-900" : "hover:bg-zinc-900/50",
                    )}
                    onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{job.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 truncate max-w-[250px]">{String(job.data?.url ?? "-")}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.state} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-zinc-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${typeof job.progress === "number" ? job.progress : 0}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-500">{job.attemptsMade} tries</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {expanded === job.id ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {job.state === "failed" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); retryJob(job.id); }}>
                                <RotateCcw className="text-zinc-400" /> Retry
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={(e) => { e.stopPropagation(); setDeleteTarget(job); }}>
                              <Trash2 /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                  {expanded === job.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 bg-black/50">
                        {job.failedReason && (
                          <p className="text-xs text-red-400 mb-2 font-mono">{job.failedReason}</p>
                        )}
                        <ScrollArea className="h-[250px] rounded-md border border-zinc-800">
                          <pre className="p-3 text-xs text-zinc-400 font-mono whitespace-pre-wrap">{JSON.stringify(job, null, 2)}</pre>
                        </ScrollArea>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {jobs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-600 text-sm">No {jobState} jobs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Job</DialogTitle>
            <DialogDescription>Remove job <span className="font-mono text-zinc-300">{deleteTarget?.id}</span>?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
