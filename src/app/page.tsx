"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { setR2Base } from "@/lib/r2";
import { formatBytes, getDomain, urlToSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ProbeIcon } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Globe,
  HardDrive,
  ArrowRight,
  Clock,
  Zap,
  Timer,
  Loader2,
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

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [queue, setQueue] = useState<QueueStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      apiFetch<{ ok: boolean; data: DashboardData }>("/api/admin/stats")
        .then((r) => {
          setData(r.data);
          if (r.data.r2PublicBase) setR2Base(r.data.r2PublicBase);
        }),
      apiFetch<{ ok: boolean; counts: QueueStats }>("/api/admin/queues/stats")
        .then((r) => setQueue(r.counts))
        .catch(() => {}),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSigningIn(false);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-sm space-y-6 text-center">
          <ProbeIcon size={40} className="text-white mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Design Probe Admin</h2>
            <p className="text-sm text-zinc-500">Sign in with your Google account to continue</p>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            className="w-full gap-2 bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200"
            onClick={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
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
