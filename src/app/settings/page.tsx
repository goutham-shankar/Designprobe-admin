"use client";

import { Server, Info } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {/* API Connection */}
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-white">API Connection</h2>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">API URL</label>
          <div className="flex items-center gap-2">
            <Input value={apiUrl} disabled className="font-mono text-xs opacity-60" />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">
            Set via NEXT_PUBLIC_API_URL in .env.local. Restart dev server after changing.
          </p>
        </div>

        <p className="text-xs text-zinc-500">
          Authentication is handled via Firebase. Sign in with your admin Google account.
        </p>
      </div>

      {/* About */}
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-white">About</h2>
        </div>
        <div className="space-y-2 text-sm">
          {[
            ["Admin Panel", "v2.0"],
            ["Storage Version", "v2.1"],
            ["Framework", "Next.js 16"],
            ["Backend", "Design Probe API"],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between">
              <span className="text-zinc-500">{k}</span>
              <span className="text-zinc-300 font-mono text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
