import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi área",
  robots: { index: false },
};

// ── Label maps ────────────────────────────────────────────────────────────────

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation League",
  seed: "Seed League",
  growth: "Growth League",
  elite: "Elite League",
};

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI",
  robotics_automation: "Robotics & Automation",
  mobility: "Mobility",
  energy_cleantech: "Energy & Cleantech",
  agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech",
  industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace",
  materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

const TIER_BADGE: Record<string, string> = {
  rookie: "🥉 Rookie",
  pro: "🥈 Pro",
  elite: "🥇 Elite",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Startup = {
  id: string;
  name: string;
  current_division: string | null;
  current_vertical: string | null;
  current_score: number | null;
};

type Org = {
  id: string;
  name: string;
  is_verified: boolean;
  tier?: string | null;
  total_points?: number | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstName(fullName?: string | null, email?: string | null): string {
  if (fullName) return fullName.trim().split(/\s+/)[0];
  return email ? email.split("@")[0] : "tú";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HubCard({
  children,
  href,
  cta,
  muted,
}: {
  children: React.ReactNode;
  href?: string;
  cta?: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-brand-lavender border border-border-soft rounded-2xl p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-200">
      {children}
      {href && cta && (
        <Link
          href={href}
          className="mt-auto inline-flex items-center justify-center bg-brand-navy text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-brand-navy/90 transition-colors"
        >
          {cta}
        </Link>
      )}
      {muted && (
        <span className="mt-auto inline-flex items-center gap-1.5 text-xs text-ink-secondary font-medium bg-white/60 border border-border-soft rounded-full px-3 py-1 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-salmon animate-pulse" />
          En revisión
        </span>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-6">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-xs text-white/40 font-body">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HubPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All queries in parallel
  const [profile, { data: startups }, { data: orgs }] = await Promise.all([
    ensureProfile(user),
    supabase
      .from("startups")
      .select("id, name, current_division, current_vertical, current_score")
      .eq("owner_id", user.id),
    supabase
      .from("ecosystem_organizations")
      .select("id, name, is_verified")
      .eq("owner_id", user.id),
  ]);

  // Enrich verified orgs with totals
  const enrichedOrgs: Org[] = await Promise.all(
    (orgs ?? []).map(async (org) => {
      if (!org.is_verified) return { ...org, tier: null, total_points: null };
      const { data: totals } = await supabase
        .from("ecosystem_totals")
        .select("tier, total_points")
        .eq("org_id", org.id)
        .maybeSingle();
      return { ...org, tier: totals?.tier ?? "rookie", total_points: totals?.total_points ?? 0 };
    })
  );

  // ── Flags ──────────────────────────────────────────────────────────────────
  const hasStartup = (startups ?? []).length > 0;
  const hasOrg = enrichedOrgs.length > 0;
  const orgVerified = hasOrg && enrichedOrgs.some((o) => o.is_verified);
  const orgPending = hasOrg && !orgVerified;
  const isAdmin = profile?.role === "admin";
  const isNewcomer = !hasStartup && !hasOrg && !isAdmin;

  const name = firstName(profile?.full_name, user.email);
  const startup = startups?.[0] ?? null;
  const verifiedOrg = enrichedOrgs.find((o) => o.is_verified) ?? null;
  const pendingOrg = enrichedOrgs.find((o) => !o.is_verified) ?? null;

  return (
    <div className="min-h-screen bg-brand-navy py-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="font-sora font-bold text-3xl md:text-4xl text-white tracking-tight">
            <span className="text-brand-salmon">{"{ "}</span>
            Hola, {name}
            <span className="text-brand-salmon">{" }"}</span>
          </h1>
          <p className="font-body text-white/50 mt-2 text-sm">Tu área en La Liga Qanvit</p>
        </div>

        {/* ── Newcomer: 2 hero cards ── */}
        {isNewcomer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HubCard href="/play" cta="Ficha tu startup">
              <div className="text-3xl">🚀</div>
              <div>
                <h2 className="font-sora font-bold text-lg text-brand-navy">Soy una startup</h2>
                <p className="font-body text-sm text-ink-secondary mt-1 leading-relaxed">
                  Sube tu deck y recibe una posición en la liga nacional.
                </p>
              </div>
            </HubCard>
            <HubCard href="/ecosistema/aplicar" cta="Aplicar al ecosistema">
              <div className="text-3xl">🏛️</div>
              <div>
                <h2 className="font-sora font-bold text-lg text-brand-navy">
                  Soy un parque, cluster o asociación
                </h2>
                <p className="font-body text-sm text-ink-secondary mt-1 leading-relaxed">
                  Descubre startups de tu ecosistema con acceso gamificado.
                </p>
              </div>
            </HubCard>
          </div>
        )}

        {/* ── Cards grid for non-newcomers ── */}
        {!isNewcomer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Admin card */}
            {isAdmin && (
              <HubCard href="/admin" cta="Ir al panel admin">
                <div className="text-3xl">⚙️</div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-brand-navy">Panel admin</h2>
                  <p className="font-body text-sm text-ink-secondary mt-1">
                    Operación de La Liga Qanvit.
                  </p>
                </div>
              </HubCard>
            )}

            {/* Startup card */}
            {hasStartup && startup && (
              <HubCard href="/dashboard" cta="Ir a mi dashboard">
                <div className="text-3xl">🚀</div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-brand-navy line-clamp-1">
                    {startup.name}
                  </h2>
                  {startup.current_score != null && startup.current_division ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="bg-brand-navy/10 text-brand-navy text-xs font-semibold rounded-full px-2.5 py-0.5">
                        {DIVISION_LABELS[startup.current_division] ?? startup.current_division}
                      </span>
                      {startup.current_vertical && (
                        <span className="bg-brand-salmon/20 text-brand-navy text-xs font-semibold rounded-full px-2.5 py-0.5">
                          {VERTICAL_LABELS[startup.current_vertical] ?? startup.current_vertical}
                        </span>
                      )}
                      <span className="bg-brand-lavender border border-border-soft text-brand-navy text-xs font-bold rounded-full px-2.5 py-0.5">
                        {Math.round(Number(startup.current_score))}/100
                      </span>
                    </div>
                  ) : (
                    <p className="font-body text-xs text-ink-secondary mt-1.5">
                      Evaluación pendiente
                    </p>
                  )}
                </div>
              </HubCard>
            )}

            {/* Org pending card */}
            {orgPending && pendingOrg && (
              <HubCard muted>
                <div className="text-3xl">⏳</div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-brand-navy">
                    Tu aplicación al ecosistema
                  </h2>
                  <p className="font-body text-sm text-ink-secondary mt-1 leading-relaxed">
                    Estamos revisando tu solicitud. Te avisamos por email en cuanto esté aprobada.
                  </p>
                </div>
              </HubCard>
            )}

            {/* Org verified card */}
            {orgVerified && verifiedOrg && (
              <HubCard href="/ecosistema/dashboard" cta="Ir al dashboard del ecosistema">
                <div className="text-3xl">🏛️</div>
                <div>
                  <h2 className="font-sora font-bold text-lg text-brand-navy line-clamp-1">
                    {verifiedOrg.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-brand-navy/10 text-brand-navy text-xs font-semibold rounded-full px-2.5 py-0.5">
                      {TIER_BADGE[verifiedOrg.tier ?? "rookie"]}
                    </span>
                    <span className="text-xs text-ink-secondary">
                      {(verifiedOrg.total_points ?? 0).toLocaleString("es-ES")} pts
                    </span>
                  </div>
                </div>
              </HubCard>
            )}
          </div>
        )}

        {/* ── Cross-role suggestions ── */}
        {hasStartup && !hasOrg && (
          <>
            <SectionDivider label="¿También representas a una organización?" />
            <div className="text-center mt-4">
              <Link
                href="/ecosistema/aplicar"
                className="font-body text-sm text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
              >
                Aplicar al ecosistema →
              </Link>
            </div>
          </>
        )}

        {hasOrg && !hasStartup && (
          <>
            <SectionDivider label="¿También quieres fichar una startup?" />
            <div className="text-center mt-4">
              <Link
                href="/play"
                className="font-body text-sm text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
              >
                Fichar startup →
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
