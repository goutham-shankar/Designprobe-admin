"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Layers,
  ListOrdered,
  Users,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Designs", icon: Layers },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function ProbeIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M13.2927 23.0769V17.7314L12 16.4387L10.7073 17.7314V23.0769C10.7073 23.5867 10.2941 24 9.78425 24C9.27462 23.9998 8.86118 23.5866 8.86118 23.0769V19.5775L6.38672 22.052C6.02629 22.4123 5.44191 22.4123 5.08143 22.052C4.72097 21.6915 4.72101 21.1072 5.08143 20.7467L8.86118 16.966V15.1388H7.03395L3.25331 18.9186C2.89282 19.279 2.30848 19.279 1.94802 18.9186C1.58775 18.5581 1.58766 17.9737 1.94802 17.6133L4.42248 15.1388H0.923077C0.413396 15.1388 0.000195846 14.7254 0 14.2157C1.10039e-07 13.7059 0.413276 13.2927 0.923077 13.2927H6.26863L7.5613 12L6.26863 10.7073H0.923077C0.413276 10.7073 -1.65059e-07 10.2941 0 9.78425C0.000193268 9.27462 0.413395 8.86118 0.923077 8.86118H4.42248L1.94802 6.38672C1.58766 6.02629 1.58775 5.44191 1.94802 5.08143C2.30848 4.72097 2.89282 4.72101 3.25331 5.08143L7.03395 8.86118H8.86118V7.03305L5.08143 3.25331C4.72101 2.89282 4.72097 2.30848 5.08143 1.94802C5.44191 1.58775 6.02629 1.58766 6.38672 1.94802L8.86118 4.42248V0.923077C8.86118 0.413397 9.27462 0.000196798 9.78425 0C10.2941 1.65059e-07 10.7073 0.413276 10.7073 0.923077V6.26863L12 7.5613L13.2927 6.26863V0.923077C13.2927 0.413276 13.7059 0 14.2157 0C14.7254 0.00019453 15.1388 0.413396 15.1388 0.923077V4.42248L17.6133 1.94802C17.9737 1.58766 18.5581 1.58775 18.9186 1.94802C19.279 2.30848 19.279 2.89282 18.9186 3.25331L15.1388 7.03305V8.86118H16.966L20.7467 5.08143C21.1072 4.72101 21.6915 4.72097 22.052 5.08143C22.4123 5.44191 22.4123 6.02629 22.052 6.38672L19.5775 8.86118H23.0769C23.5866 8.86118 23.9998 9.27462 24 9.78425C24 10.2941 23.5867 10.7073 23.0769 10.7073H17.7314L16.4387 12L17.7314 13.2927H23.0769C23.5867 13.2927 24 13.7059 24 14.2157C23.9998 14.7254 23.5866 15.1388 23.0769 15.1388H19.5775L22.052 17.6133C22.4123 17.9737 22.4123 18.5581 22.052 18.9186C21.6915 19.279 21.1072 19.279 20.7467 18.9186L16.966 15.1388H15.1388V16.966L18.9186 20.7467C19.279 21.1072 19.279 21.6915 18.9186 22.052C18.5581 22.4123 17.9737 22.4123 17.6133 22.052L15.1388 19.5775V23.0769C15.1388 23.5866 14.7254 23.9998 14.2157 24C13.7059 24 13.2927 23.5867 13.2927 23.0769ZM12.6526 9.52013C12.4796 9.69308 12.2447 9.78966 12 9.78966C11.7553 9.78966 11.5204 9.69308 11.3474 9.52013L10.7073 8.87921V9.78425C10.7073 10.0291 10.61 10.2638 10.4369 10.4369C10.2638 10.61 10.0291 10.7073 9.78425 10.7073H8.88011L9.52013 11.3474C9.88027 11.7078 9.88027 12.2922 9.52013 12.6526L8.88011 13.2927H9.78425C10.2941 13.2927 10.7073 13.7059 10.7073 14.2157V15.1199L11.3474 14.4799L11.4177 14.4168C11.7801 14.1213 12.3148 14.1422 12.6526 14.4799L13.2927 15.1199V14.2157C13.2927 13.7059 13.7059 13.2927 14.2157 13.2927H15.1199L14.4799 12.6526C14.1197 12.2922 14.1197 11.7078 14.4799 11.3474L15.1199 10.7073H14.2157C13.7059 10.7073 13.2927 10.2941 13.2927 9.78425V8.87921L12.6526 9.52013Z" fill="currentColor"/>
    </svg>
  );
}

export { ProbeIcon };

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-zinc-950 border-r border-zinc-800/60 flex flex-col z-50">
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <ProbeIcon size={24} className="text-white shrink-0" />
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
