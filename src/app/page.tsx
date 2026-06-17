"use client";

import { useEffect, useState } from "react";
import { useToken } from "@/lib/useToken";
import { apiFetch } from "@/lib/api";
import { setR2Base } from "@/lib/r2";
import { formatBytes, getDomain, urlToSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { ProbeIcon } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Globe,
  HardDrive,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  Zap,
  Timer,
  Pause,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function SiteFavicon({ url, size = 16 }: { url: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const domain = getDomain(url);
  if (errored) return <Globe className="h-4 w-4 text-zinc-600 shrink-0" />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`}
      width={size} height={size} alt="" className="rounded-sm shrink-0"
      onError={() => setErrored(true)}
    />
  );
}

interface DashboardData {
  runs: { total: number; byStatus: Record<string, number> };
  scraped: { total: number; byStatus: Record<string, number> };
  recentRuns: Array<{
    runId: string;
    url: string;
    slug?: string;
    status?: string;
    durationMs?: number;
    createdAt?: string;
  }>;
  db: {
    name: string;
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    indexSize: number;
  };
  r2PublicBase?: string | null;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, save } = useToken();
  const [data, setData] = useState<DashboardData | null>(null);
  const [queue, setQueue] = useState<QueueStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiFetch<{ ok: boolean; data: DashboardData }>("/api/admin/stats", { adminToken: token })
        .then((r) => {
          setData(r.data);
          if (r.data.r2PublicBase) setR2Base(r.data.r2PublicBase);
        }),
      apiFetch<{ ok: boolean; counts: QueueStats }>("/api/admin/queues/stats", { adminToken: token })
        .then((r) => setQueue(r.counts))
        .catch(() => {}),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1">
            <ProbeIcon size={40} className="text-white mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white">Connect to Admin API</h2>
            <p className="text-sm text-zinc-500">Enter your admin token to continue</p>
          </div>
          <div className="relative">
            <Input
              type={showToken ? "text" : "password"}
              placeholder="ADMIN_TOKEN"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tokenInput && save(tokenInput)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button className="w-full" onClick={() => tokenInput && save(tokenInput)}>
            Connect
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4 space-y-3">
              <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-4 rounded" /></div>
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-5 w-16 rounded-full" /></div>
            ))}
          </div>
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 rounded-lg border border-red-900/50 bg-red-950/20 p-6">
        <p className="text-red-400 text-sm font-medium">Failed to load dashboard</p>
        <p className="text-xs text-zinc-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Total Runs", value: data.runs.total, icon: Activity, color: "text-white" },
    { label: "Completed", value: data.runs.byStatus.completed ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Failed", value: data.runs.byStatus.failed ?? 0, icon: XCircle, color: "text-red-400" },
  ];

  const queueItems = queue ? [
    { label: "Waiting", value: queue.waiting, icon: Clock, color: "text-zinc-400" },
    { label: "Active", value: queue.active, icon: Zap, color: "text-blue-400" },
    { label: "Failed", value: queue.failed, icon: XCircle, color: "text-red-400" },
    { label: "Delayed", value: queue.delayed, icon: Timer, color: "text-yellow-400" },
  ] : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-xl font-semibold text-white">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Queue status */}
      {queue && (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950">
          <div className="px-4 py-3 border-b border-zinc-800/60">
            <h3 className="text-sm font-medium text-white">Queue</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-zinc-800/40">
            {queueItems.map((q) => {
              const Icon = q.icon;
              return (
                <div key={q.label} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{q.label}</p>
                    <Icon className={`h-3.5 w-3.5 ${q.color}`} />
                  </div>
                  <p className={`text-xl font-bold mt-1 ${q.color}`}>{q.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent runs */}
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950">
          <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Recent Runs</h3>
            <Link href="/runs" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {data.recentRuns.map((run) => {
              const slug = run.slug || urlToSlug(run.url);
              return (
                <div
                  key={run.runId}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors"
                  onClick={() => router.push(`/runs/${encodeURIComponent(slug)}`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SiteFavicon url={run.url} size={16} />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{getDomain(run.url)}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "-"}
                        {run.createdAt && ` · ${new Date(run.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
              );
            })}
          </div>
        </div>

        {/* MongoDB */}
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-medium text-white">MongoDB</h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Database", data.db.name],
              ["Collections", data.db.collections],
              ["Data Size", formatBytes(data.db.dataSize)],
              ["Storage", formatBytes(data.db.storageSize)],
              ["Indexes", `${data.db.indexes} (${formatBytes(data.db.indexSize)})`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-200 font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
