import { auth } from "./firebase";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");

async function getBearerToken(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.getIdToken();
  }
  return "";
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit & { adminToken?: string },
): Promise<T> {
  // adminToken param kept for backward compat but ignored — always use Firebase token
  const { adminToken: _ignored, ...fetchOpts } = options ?? {};

  const token = await getBearerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((fetchOpts.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
