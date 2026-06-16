"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScrapedRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/runs"); }, [router]);
  return (
    <p className="text-zinc-500 mt-16 text-center text-sm">
      Scraped data has been merged into the Designs page. Redirecting...
    </p>
  );
}
