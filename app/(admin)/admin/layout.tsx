import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/admin/deck-errors", label: "Deck Errors", badge: true },
  { href: "/admin/evaluations", label: "Evaluations", badge: false },
  { href: "/admin/organizations", label: "Organizations", badge: false },
  { href: "/admin/metrics", label: "Metrics", badge: false },
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
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-brand-navy min-h-screen flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-mono text-brand-salmon text-xs font-semibold tracking-widest">{ "{ }" }</p>
          <p className="font-sora font-bold text-white text-sm mt-1">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
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
          <p className="font-body text-white/30 text-xs">{user.email}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
