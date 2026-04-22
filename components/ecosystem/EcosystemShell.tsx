"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  ThumbsUp,
  Bell,
  Link2,
  Settings,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/ecosistema/dashboard",              label: "Inicio",    icon: LayoutDashboard, exact: true },
  { href: "/ecosistema/dashboard/startups",     label: "Startups",  icon: Search },
  { href: "/ecosistema/dashboard/votos",        label: "Votos",     icon: ThumbsUp },
  { href: "/ecosistema/dashboard/puntos",       label: "Puntos",    icon: Star },
  { href: "/ecosistema/dashboard/alertas",      label: "Alertas",   icon: Bell },
  { href: "/ecosistema/dashboard/referral",     label: "Referral",  icon: Link2 },
  { href: "/ecosistema/dashboard/configuracion",label: "Config.",   icon: Settings },
];

const APP_QANVIT_URL = process.env.NEXT_PUBLIC_APP_QANVIT_URL ?? "https://app.qanvit.com";

type Props = {
  children: React.ReactNode;
  orgName: string;
  unreadAlerts?: number;
  tier: "rookie" | "pro" | "elite";
};

const TIER_BADGE: Record<string, string> = {
  rookie: "bg-gray-200 text-gray-700",
  pro:    "bg-brand-salmon/30 text-brand-navy",
  elite:  "bg-yellow-200 text-yellow-800",
};

export default function EcosystemShell({ children, orgName, unreadAlerts = 0, tier }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-lavender flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-brand-navy text-white shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-sora text-brand-salmon text-sm font-semibold">{"{ Ecosistema }"}</p>
          <p className="font-body text-white/50 text-xs mt-0.5 truncate">{orgName}</p>
          <span className={cn("inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", TIER_BADGE[tier])}>
            {tier}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
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
                {href === "/ecosistema/dashboard/alertas" && unreadAlerts > 0 && (
                  <span className="ml-auto bg-brand-salmon text-brand-navy text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {unreadAlerts > 99 ? "99+" : unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* External CTA to app.qanvit.com */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <a
            href={`${APP_QANVIT_URL}?utm_source=laliga&utm_medium=sidebar&utm_campaign=cta`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-body font-medium text-brand-salmon/80 hover:text-brand-salmon hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={13} />
            Gestionar retos en app.qanvit.com
          </a>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-border-soft px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <p className="font-sora font-bold text-brand-navy md:hidden">{"{ }"}</p>
          <p className="font-sora font-semibold text-brand-navy hidden md:block">{orgName}</p>
          <div className="flex items-center gap-3">
            {/* CTA header — visible on medium+ */}
            <a
              href={`${APP_QANVIT_URL}?utm_source=laliga&utm_medium=cta&utm_campaign=header`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold font-body bg-brand-salmon text-brand-navy px-3 py-1.5 rounded-xl hover:bg-brand-salmon/90 transition-colors whitespace-nowrap"
            >
              ¿Gestionas retos de innovación? → app.qanvit.com
              <ExternalLink size={10} />
            </a>
            <Link href="/ecosistema/dashboard/alertas" className="relative">
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

        {/* Footer */}
        <footer className="border-t border-border-soft px-6 py-3 bg-white flex items-center justify-between">
          <p className="text-xs text-ink-secondary font-body">La Liga Qanvit</p>
          <a
            href={`${APP_QANVIT_URL}?utm_source=laliga&utm_medium=cta&utm_campaign=footer`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors flex items-center gap-1"
          >
            Para lanzar retos reales → app.qanvit.com
            <ExternalLink size={10} />
          </a>
        </footer>

        {/* Bottom tab bar — mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-soft px-2 py-2 flex justify-around z-20">
          {NAV.slice(0, 5).map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-body",
                  active ? "text-brand-navy" : "text-ink-secondary"
                )}
              >
                <div className="relative">
                  <Icon size={18} />
                  {href === "/ecosistema/dashboard/alertas" && unreadAlerts > 0 && (
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
