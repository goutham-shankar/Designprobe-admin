"use client";

import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Show sidebar only once we know the user is authenticated.
  // During the loading phase keep the layout sidebar-less to avoid a flash.
  const showSidebar = !loading && !!user;

  return (
    <>
      {showSidebar && <Sidebar />}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          showSidebar ? "ml-[220px]" : ""
        }`}
      >
        <main className="flex-1 p-6 overflow-auto">{children}</main>
        <footer className="px-6 py-4 border-t border-zinc-800/60 text-center">
          <p className="text-[11px] text-zinc-600">Design Probe</p>
        </footer>
      </div>
    </>
  );
}
