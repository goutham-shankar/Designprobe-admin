const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit & { adminToken?: string },
): Promise<T> {
  const { adminToken, ...fetchOpts } = options ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
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
