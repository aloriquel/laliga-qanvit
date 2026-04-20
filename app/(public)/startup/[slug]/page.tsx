import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import ClassificationCard from "@/components/league/ClassificationCard";
import Link from "next/link";

type Props = { params: { slug: string } };
type StartupRow = Database["public"]["Tables"]["startups"]["Row"];
type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"];

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: startup } = await supabase
    .from("startups")
    .select("name, one_liner, is_public, slug")
    .eq("slug", params.slug)
    .single();

  if (!startup || !startup.is_public) return { title: "Startup no encontrada" };

  return {
    title: startup.name,
    description: startup.one_liner ?? undefined,
    openGraph: {
      images: [`/api/og/startup/${startup.slug}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/startup/${startup.slug}`],
    },
  };
}

const DIVISION_LABELS: Record<string, { label: string; color: string }> = {
  ideation: { label: "🥚 Ideation", color: "bg-league-ideation text-ink-primary" },
  seed: { label: "🌱 Seed", color: "bg-league-seed text-ink-primary" },
  growth: { label: "🚀 Growth", color: "bg-league-growth text-brand-navy" },
  elite: { label: "👑 Elite", color: "bg-league-elite text-ink-primary" },
};

const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI", robotics_automation: "Robotics & Automation",
  mobility: "Mobility", energy_cleantech: "Energy & Cleantech", agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech", industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace", materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};

export default async function StartupPublicPage({ params }: Props) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_public", true)
    .single() as { data: StartupRow | null };

  if (!startup || !startup.consent_public_profile) notFound();

  const [{ data: standing }, { data: profile }] = await Promise.all([
    supabase
      .from("league_standings")
      .select("rank_national, rank_division, rank_division_vertical")
      .eq("startup_id", startup.id)
      .maybeSingle(),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  // Timeline: only if show_public_timeline is ON
  let evalTimeline: EvaluationRow[] = [];
  if (startup.show_public_timeline) {
    const { data: evals } = await supabase
      .from("evaluations")
      .select("id, assigned_division, assigned_vertical, score_total, summary, next_actions, created_at")
      .eq("startup_id", startup.id)
      .order("created_at", { ascending: false }) as { data: EvaluationRow[] | null };
    evalTimeline = evals ?? [];
  }

  // Track ecosystem view (non-blocking fire-and-forget)
  if (user && profile?.role === "ecosystem") {
    void (async () => {
      try {
        const { data: org } = await supabase
          .from("ecosystem_organizations")
          .select("id")
          .eq("owner_id", user.id)
          .single();
        if (org) {
          await supabase.rpc("track_ecosystem_view", {
            p_startup_id: startup.id,
            p_org_id: org.id,
          });
        }
      } catch {
        // non-critical
      }
    })();
  }

  const isOwner = user?.id === startup.owner_id;

  return (
    <div className="bg-brand-lavender min-h-screen py-12">
      <div className="container-brand max-w-3xl">

        {/* Owner banner */}
        {isOwner && (
          <div className="bg-brand-navy/10 border border-brand-navy/20 rounded-xl px-5 py-3 flex items-center justify-between mb-6">
            <p className="font-body text-sm text-brand-navy">Este es tu perfil público.</p>
            <Link href="/dashboard/configuracion" className="font-body text-sm text-brand-navy font-semibold underline underline-offset-2">
              Editar en dashboard →
            </Link>
          </div>
        )}

        {/* Classification card */}
        <div className="flex justify-center mb-8">
          <ClassificationCard
            startup={startup}
            ranking={standing}
            size="lg"
            interactive={false}
          />
        </div>

        {/* One-liner */}
        {startup.one_liner && (
          <div className="bg-white rounded-card border border-border-soft p-6 mb-6 text-center">
            <p className="font-body text-brand-navy leading-relaxed">&ldquo;{startup.one_liner}&rdquo;</p>
          </div>
        )}

        {/* Latest eval: summary + next actions */}
        {evalTimeline.length > 0 && evalTimeline[0].summary && (
          <div className="bg-white rounded-card border border-border-soft p-6 mb-6">
            <p className="font-body text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-2">Feedback público</p>
            <p className="font-body text-brand-navy leading-relaxed text-sm">{evalTimeline[0].summary}</p>
            {evalTimeline[0].next_actions && (evalTimeline[0].next_actions as string[]).length > 0 && (
              <div className="mt-4">
                <p className="font-body text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Próximas acciones</p>
                <ol className="flex flex-col gap-1.5">
                  {(evalTimeline[0].next_actions as string[]).map((a, i) => (
                    <li key={i} className="flex items-start gap-2 font-body text-sm text-brand-navy">
                      <span className="font-mono text-brand-salmon font-bold flex-shrink-0">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Timeline — only if show_public_timeline is ON */}
        {startup.show_public_timeline && evalTimeline.length > 1 && (
          <div className="bg-white rounded-card border border-border-soft p-6 mb-6">
            <p className="font-body text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-4">Evolución</p>
            <div className="flex flex-col gap-3">
              {evalTimeline.map((ev, idx) => {
                const prev = evalTimeline[idx + 1];
                const delta = prev ? Number(ev.score_total) - Number(prev.score_total) : null;
                return (
                  <div key={ev.id} className="flex items-center gap-4 py-2 border-b border-border-soft last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-salmon flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ev.assigned_division && (
                          <Badge className={`${DIVISION_LABELS[ev.assigned_division]?.color} text-xs font-body`}>
                            {DIVISION_LABELS[ev.assigned_division]?.label}
                          </Badge>
                        )}
                        {ev.assigned_vertical && (
                          <span className="font-body text-xs text-ink-secondary">
                            {VERTICAL_LABELS[ev.assigned_vertical]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono font-bold text-brand-navy text-lg">{Number(ev.score_total).toFixed(0)}</p>
                      {delta !== null && (
                        <p className={`font-mono text-xs ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <p className="font-body text-xs text-ink-secondary/60 flex-shrink-0 w-20 text-right">
                      {new Date(ev.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {startup.website && (
          <div className="text-center mt-4">
            <a
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors"
            >
              {startup.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
