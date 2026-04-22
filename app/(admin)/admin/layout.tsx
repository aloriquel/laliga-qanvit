import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Inicio", exact: true },
  { href: "/admin/ecosystem-applications", label: "Solicitudes eco." },
  { href: "/admin/ecosystem-organizations", label: "Organizaciones" },
  { href: "/admin/deck-errors", label: "Deck errors" },
  { href: "/admin/evaluations", label: "Evaluaciones" },
  { href: "/admin/evaluation-appeals", label: "Impugnaciones" },
  { href: "/admin/votes", label: "Votos" },
  { href: "/admin/startups", label: "Startups" },
  { href: "/admin/metrics", label: "Métricas" },
  { href: "/admin/data-export", label: "Export datos" },
  { href: "/admin/audit-log", label: "Auditoría" },
  { href: "/admin/settings", label: "Configuración" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen flex bg-brand-lavender">
      <aside className="w-56 flex-shrink-0 bg-brand-navy min-h-screen flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-mono text-brand-salmon text-xs font-semibold tracking-widest">{"{ }"}</p>
          <p className="font-sora font-bold text-white text-sm mt-1">admin</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm transition-colors",
                "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="font-body text-white/30 text-xs truncate">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
