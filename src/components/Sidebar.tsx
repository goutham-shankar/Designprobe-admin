"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  ListOrdered,
  Database,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Designs", icon: Layers },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/collections", label: "Collections", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-zinc-950 border-r border-zinc-800/60 flex flex-col z-50">
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black text-xs font-bold">DP</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">Design Probe</h1>
            <p className="text-[10px] text-zinc-500 leading-tight">Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-2">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-md transition-colors mb-0.5",
                active
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-3 border-t border-zinc-800/60">
        <p className="text-[10px] text-zinc-600">Design Probe v2.1</p>
      </div>
    </aside>
  );
}
