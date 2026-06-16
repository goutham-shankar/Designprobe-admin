import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function timeAgo(date: string | undefined): string {
  if (!date) return "-";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function urlToSlug(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const pathSlug = pathname.replace(/^\/+|\/+$/g, "").replace(/\//g, "_");
    const base = pathSlug ? `${hostname}_${pathSlug}` : hostname;
    return base.replace(/[^a-z0-9_\-\.]/gi, "_").slice(0, 120);
  } catch {
    return url.replace(/[^a-z0-9_\-]/gi, "_").slice(0, 120);
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
