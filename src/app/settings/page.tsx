"use client";

import { useToken } from "@/lib/useToken";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, LogOut, Save, Server, Key, Info } from "lucide-react";

export default function SettingsPage() {
  const { token, save, clear } = useToken();
  const [draft, setDraft] = useState("");
  const [showToken, setShowToken] = useState(false);
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

        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block flex items-center gap-1.5">
            <Key className="h-3 w-3" /> Admin Token
          </label>
          {token ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={token}
                  readOnly
                  className="font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Button variant="destructive" size="sm" onClick={clear}>
                <LogOut className="h-3.5 w-3.5" /> Disconnect
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) save(draft.trim()); }} className="flex gap-2">
              <Input
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Enter ADMIN_TOKEN..."
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
            </form>
          )}
        </div>
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
