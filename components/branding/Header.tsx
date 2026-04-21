import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { UserMenu } from "./UserMenu";
import { NavMenu } from "./NavMenu";
import type { DivisionItem, VerticalItem } from "./NavMenu";

function getInitials(email?: string | null, fullName?: string | null): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

const DIVISIONS: DivisionItem[] = [
  { key: "ideation", icon: "🥚", label: "Ideation" },
  { key: "seed",     icon: "🌱", label: "Seed" },
  { key: "growth",   icon: "🚀", label: "Growth" },
  { key: "elite",    icon: "👑", label: "Elite" },
];

const VERTICALS: VerticalItem[] = [
  { key: "deeptech_ai",             label: "Deeptech & AI" },
  { key: "robotics_automation",     label: "Robotics & Automation" },
  { key: "mobility",                label: "Mobility" },
  { key: "energy_cleantech",        label: "Energy & Cleantech" },
  { key: "agrifood",                label: "AgriFood" },
  { key: "healthtech_medtech",      label: "HealthTech & MedTech" },
  { key: "industrial_manufacturing",label: "Industrial & Manufacturing" },
  { key: "space_aerospace",         label: "Space & Aerospace" },
  { key: "materials_chemistry",     label: "Materials & Chemistry" },
  { key: "cybersecurity",           label: "Cybersecurity" },
];

export async function Header() {
  const [t, ht, ct, supabase] = await Promise.all([
    getTranslations("nav"),
    getTranslations("header"),
    getTranslations("common"),
    Promise.resolve(createClient()),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  const initials = user
    ? getInitials(user.email, user.user_metadata?.full_name as string | null)
    : "?";
  const avatarUrl: string | null =
    (user?.user_metadata?.avatar_url as string | null) ??
    (user?.user_metadata?.picture as string | null) ??
    null;

  const navLabels = {
    liga:      t("liga"),
    divisions: t("divisiones"),
    verticals: t("verticales"),
    ecosystem: t("ecosistema"),
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-navy">
      <div className="container-brand flex h-16 items-center justify-between">
        {/* Isotipo + wordmark */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
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

        {/* Nav (desktop inline, mobile via NavMenu's hamburger) */}
        <NavMenu
          labels={navLabels}
          divisions={DIVISIONS}
          verticals={VERTICALS}
        />

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu initials={initials} avatarUrl={avatarUrl} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block font-body text-sm text-white/80 hover:text-white transition-colors px-3 py-2"
              >
                {ht("sign_in")}
              </Link>
              <Link
                href="/play"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl px-5 py-2.5 text-sm"
                )}
              >
                {ct("cta_startup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
