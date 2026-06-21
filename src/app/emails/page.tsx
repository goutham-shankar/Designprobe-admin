"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  RefreshCw, Loader2, Send, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Mail, AlertTriangle, Eye,
} from "lucide-react";

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event: string;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  scheduled_at: string | null;
}

interface EmailDetail extends Email {
  html: string | null;
  text: string | null;
}

const EVENT_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  delivered: { icon: CheckCircle2, color: "text-emerald-400", label: "Delivered" },
  sent: { icon: Send, color: "text-blue-400", label: "Sent" },
  opened: { icon: Eye, color: "text-violet-400", label: "Opened" },
  clicked: { icon: CheckCircle2, color: "text-cyan-400", label: "Clicked" },
  bounced: { icon: XCircle, color: "text-red-400", label: "Bounced" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  complained: { icon: AlertTriangle, color: "text-orange-400", label: "Complained" },
  queued: { icon: Clock, color: "text-zinc-400", label: "Queued" },
  scheduled: { icon: Clock, color: "text-yellow-400", label: "Scheduled" },
  delivery_delayed: { icon: AlertTriangle, color: "text-yellow-400", label: "Delayed" },
  suppressed: { icon: XCircle, color: "text-zinc-500", label: "Suppressed" },
  canceled: { icon: XCircle, color: "text-zinc-500", label: "Canceled" },
};

function EventBadge({ event }: { event: string }) {
  const cfg = EVENT_CONFIG[event] ?? { icon: Mail, color: "text-zinc-400", label: event };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function EmailsPage() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Test email dialog
  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ ok: boolean; data: { data: Email[] } }>("/api/admin/emails");
      setEmails(res.data?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function loadDetail(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    setDetailLoading(true);
    try {
      const res = await apiFetch<{ ok: boolean; data: EmailDetail }>(`/api/admin/emails/${id}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleTestSend() {
    if (!testTo.trim()) return;
    setTestSending(true);
    setTestResult(null);
    try {
      await apiFetch("/api/admin/emails/test", {
        method: "POST",
        body: JSON.stringify({ to: testTo.trim() }),
      });
      setTestResult("sent");
      setTimeout(() => { setTestOpen(false); setTestResult(null); setTestTo(""); refresh(); }, 1500);
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "Failed");
    } finally {
      setTestSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Emails</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setTestTo(""); setTestResult(null); setTestOpen(true); }}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Send Test
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Stats summary */}
      {emails.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total", value: emails.length, color: "text-white" },
            { label: "Delivered", value: emails.filter((e) => e.last_event === "delivered").length, color: "text-emerald-400" },
            { label: "Opened", value: emails.filter((e) => e.last_event === "opened" || e.last_event === "clicked").length, color: "text-violet-400" },
            { label: "Bounced / Failed", value: emails.filter((e) => e.last_event === "bounced" || e.last_event === "failed").length, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Email list */}
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950">
        <div className="px-4 py-3 border-b border-zinc-800/60">
          <h3 className="text-sm font-medium text-white">Recent Emails</h3>
        </div>

        {loading && emails.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : emails.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">No emails found</div>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {emails.map((email) => {
              const isExpanded = expanded === email.id;
              return (
                <div key={email.id}>
                  <div
                    className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                    onClick={() => loadDetail(email.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-zinc-200 truncate">{email.subject}</p>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        To: {email.to.join(", ")}
                      </p>
                    </div>
                    <EventBadge event={email.last_event} />
                    <span className="text-xs text-zinc-600 shrink-0 w-16 text-right">
                      {timeAgo(email.created_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-600 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-600 shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-800/30">
                      {detailLoading ? (
                        <div className="py-6 flex justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        </div>
                      ) : detail ? (
                        <div className="pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="text-zinc-500">From:</span>{" "}
                              <span className="text-zinc-300">{detail.from}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">To:</span>{" "}
                              <span className="text-zinc-300">{detail.to.join(", ")}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">ID:</span>{" "}
                              <span className="text-zinc-400 font-mono text-xs">{detail.id}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Sent:</span>{" "}
                              <span className="text-zinc-300">
                                {new Date(detail.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {detail.html && (
                            <div className="rounded border border-zinc-800/60 overflow-hidden">
                              <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800/60">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Preview</span>
                              </div>
                              <iframe
                                srcDoc={detail.html}
                                title="Email preview"
                                className="w-full bg-white"
                                style={{ minHeight: 300 }}
                                sandbox=""
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="py-4 text-sm text-zinc-500">Failed to load details</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Test Email Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send a test email to verify Resend is working.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTestSend()}
            />
          </div>
          {testResult && testResult !== "sent" && (
            <p className="text-sm text-red-400">{testResult}</p>
          )}
          {testResult === "sent" && (
            <p className="text-sm text-emerald-400">Test email sent successfully!</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button onClick={handleTestSend} disabled={testSending || !testTo.trim()}>
              {testSending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
