"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart2, Eye, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",                label: "Home",          icon: LayoutDashboard },
  { href: "/dashboard/evaluaciones",   label: "Evaluaciones",  icon: BarChart2 },
  { href: "/dashboard/visibilidad",    label: "Visibilidad",   icon: Eye },
  { href: "/dashboard/configuracion",  label: "Config.",       icon: Settings },
];

type Props = {
  children: React.ReactNode;
  unreadAlerts: number;
  startupName: string;
};

export default function DashboardShell({ children, unreadAlerts, startupName }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-lavender flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-brand-navy text-white shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-sora text-brand-salmon text-sm font-semibold">{"{ La Liga Qanvit }"}</p>
          <p className="font-body text-white/50 text-xs mt-0.5 truncate">{startupName}</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors",
                  active
                    ? "bg-brand-salmon text-brand-navy"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon size={16} />
                {label}
                {href === "/dashboard/visibilidad" && unreadAlerts > 0 && (
                  <span className="ml-auto bg-brand-salmon text-brand-navy text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {unreadAlerts > 99 ? "99+" : unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <Link
            href="/play/re-subir"
            className="block text-center bg-brand-salmon/20 hover:bg-brand-salmon/30 text-brand-salmon rounded-xl px-3 py-2 text-xs font-semibold font-body transition-colors"
          >
            Re-subir deck
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-border-soft px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <p className="font-sora font-bold text-brand-navy md:hidden">{ "{ }" }</p>
          <p className="font-sora font-semibold text-brand-navy hidden md:block">{startupName}</p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/visibilidad" className="relative">
              <Bell size={20} className="text-ink-secondary hover:text-brand-navy transition-colors" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-salmon text-brand-navy text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadAlerts > 9 ? "9+" : unreadAlerts}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
          {children}
        </main>

        {/* Bottom tab bar — mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-soft px-4 py-2 flex justify-around z-20">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-body",
                  active ? "text-brand-navy" : "text-ink-secondary"
                )}
              >
                <div className="relative">
                  <Icon size={20} />
                  {href === "/dashboard/visibilidad" && unreadAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-salmon text-brand-navy text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {unreadAlerts > 9 ? "9+" : unreadAlerts}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
