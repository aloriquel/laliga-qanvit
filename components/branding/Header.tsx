import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { href: "/liga", label: "Liga" },
  { href: "/liga?tab=divisiones", label: "Divisiones" },
  { href: "/liga?tab=verticales", label: "Verticales" },
  { href: "/ecosistema", label: "Ecosistema" },
] as const;

function getInitials(email?: string | null, fullName?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initials = "?";
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    initials = getInitials(user.email, profile?.full_name);
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-navy">
      <div className="container-brand flex h-16 items-center justify-between">
        {/* Isotipo + wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="font-sora font-bold text-brand-salmon text-xl tracking-tight select-none"
            aria-hidden="true"
          >
            {"{"}
          </span>
          <span className="font-sora font-semibold text-white text-base tracking-tight leading-none">
            La Liga Qanvit
          </span>
          <span
            className="font-sora font-bold text-brand-salmon text-xl tracking-tight select-none"
            aria-hidden="true"
          >
            {"}"}
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-body text-sm text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu initials={initials} avatarUrl={avatarUrl} />
          ) : (
            <>
              <Link
                href="/login"
                className="font-body text-sm text-white/80 hover:text-white transition-colors px-3 py-2"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/play"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl px-5 py-2.5 text-sm"
                )}
              >
                Ficha tu startup
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
