"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Something went wrong</h2>
        <p className="text-sm text-zinc-400">{error.message || "An unexpected error occurred."}</p>
        <Button variant="outline" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
