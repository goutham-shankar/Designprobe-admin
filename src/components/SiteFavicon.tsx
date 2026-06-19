"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { getDomain } from "@/lib/utils";

export function SiteFavicon({ url, size = 16 }: { url: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  const domain = getDomain(url);
  if (errored) return <Globe className="text-zinc-600 shrink-0" style={{ width: size, height: size }} />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`}
      width={size} height={size} alt="" className="rounded-sm shrink-0"
      onError={() => setErrored(true)}
    />
  );
}
