import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Database } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import ClassificationCard from "@/components/league/ClassificationCard";
import Link from "next/link";
import EcosystemMomentumBadge from "@/components/ecosystem/EcosystemMomentumBadge";
import PublicStrengthsHighlights from "@/components/public/PublicStrengthsHighlights";
import PublicTopDimensions from "@/components/public/PublicTopDimensions";
import DeckPreviewCarousel from "@/components/public/DeckPreviewCarousel";
import { getPublicProfileData, getTopDimensions } from "@/lib/public/profile-helpers";
import StartupRegionBadge from "@/components/ui/StartupRegionBadge";
import FundingStageBadge from "@/components/ui/FundingStageBadge";
import RaisingBadge from "@/components/ui/RaisingBadge";
import type { CaId } from "@/lib/spain-regions";
import ChampionBadge from "@/components/startup/ChampionBadge";
import { getChampionBadgesForStartup } from "@/lib/batches";
import AnonymousVoteButton from "@/components/startup-public/AnonymousVoteButton";
import SubscribedToast from "@/components/startup-public/SubscribedToast";

type Props = { params: { slug: string }; searchParams: { subscribed?: string } };
type EvaluationRow = Database["public"]["Tables"]["evaluations"]["Row"];

export const revalidate = 60;

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfileData(params.slug);
  if (!profile) return { title: "Startup no encontrada" };

  const { startup, evaluation } = profile;
  const rawDesc = evaluation?.summary || (startup.one_liner as string | null) || null;
  const description = rawDesc
    ? rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc
    : undefined;

  // If startup is a national champion in any closed batch, use the champion OG card.
  const badges = await getChampionBadgesForStartup(startup.id);
  const championBadge = badges.find((b) => b.category === "national_top1");
  const ogImage = championBadge
    ? `/api/og/batch/${championBadge.batch.slug}/champion/${startup.slug}`
    : `/api/og/startup/${startup.slug}`;

  return {
    title: startup.name as string,
    description,
    openGraph: { images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage] },
  };
}

export default async function StartupPublicPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const service = createServiceClient();
  const t = await getTranslations("startup_profile");
  const justSubscribed = searchParams?.subscribed === "1";

  const { data: { user } } = await supabase.auth.getUser();

  const profileData = await getPublicProfileData(params.slug);
  if (!profileData) notFound();

  const { startup, evaluation, highlights } = profileData;
  const topDimensions = evaluation ? getTopDimensions(evaluation.dimensions) : [];
  const championBadges = await getChampionBadgesForStartup(startup.id);

  const [
    { data: standing },
    { data: profile },
    { data: momentumData },
    { data: anonVoteCount },
    { data: followerCount },
  ] = await Promise.all([
    supabase
      .from("league_standings")
      .select("rank_national, rank_division, rank_division_vertical")
      .eq("startup_id", startup.id)
      .maybeSingle(),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    service
      .from("startup_momentum")
      .select("momentum_score, up_count, down_count, distinct_voters, last_vote_at")
      .eq("startup_id", startup.id)
      .maybeSingle(),
    service.rpc("get_anon_vote_count", { p_startup_id: startup.id }),
    service.rpc("get_follower_count", { p_startup_id: startup.id }),
  ]);

  const voteCount = typeof anonVoteCount === "number" ? anonVoteCount : 0;
  const followersCount = typeof followerCount === "number" ? followerCount : 0;

  let evalTimeline: EvaluationRow[] = [];
  if (startup.show_public_timeline) {
    const { data: evals } = await supabase
      .from("evaluations")
      .select("id, assigned_division, assigned_vertical, score_total, summary, next_actions, created_at")
      .eq("startup_id", startup.id)
      .order("created_at", { ascending: false }) as { data: EvaluationRow[] | null };
    evalTimeline = evals ?? [];
  }

  // Track ecosystem view — non-blocking
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
            <p className="font-body text-sm text-brand-navy">{t("owner_banner")}</p>
            <Link href="/dashboard/configuracion" className="font-body text-sm text-brand-navy font-semibold underline underline-offset-2">
              {t("edit_in_dashboard")}
            </Link>
          </div>
        )}

        {/* Hero */}
        <div className="flex justify-center mb-8">
          <ClassificationCard
            startup={startup as any}
            ranking={standing}
            size="lg"
            interactive={false}
          />
        </div>

        {/* Champion badges */}
        {championBadges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 -mt-2">
            {championBadges.map((b) => (
              <ChampionBadge key={b.id} badge={b} />
            ))}
          </div>
        )}

        {/* Region + funding badges */}
        {(startup.region_ca || startup.funding_stage || startup.is_raising) && (
          <div className="flex flex-wrap justify-center gap-2 mb-4 -mt-4">
            {startup.region_ca && (
              <StartupRegionBadge
                regionCa={startup.region_ca as CaId}
                regionProvince={startup.region_province}
                variant="full"
              />
            )}
            <FundingStageBadge stage={startup.funding_stage} />
            {startup.consent_public_profile && (
              <RaisingBadge isRaising={startup.is_raising === true} />
            )}
          </div>
        )}

        {/* Anonymous vote + follow (only if startup is publicly visible) */}
        {startup.is_public && startup.consent_public_profile && (
          <AnonymousVoteButton
            slug={startup.slug as string}
            startupName={startup.name as string}
            initialVoteCount={voteCount}
            initialFollowerCount={followersCount}
          />
        )}

        {justSubscribed && <SubscribedToast />}

        {/* One-liner */}
        {startup.one_liner && (
          <div className="bg-white rounded-card border border-border-soft p-6 mb-6 text-center">
            <p className="font-body text-brand-navy leading-relaxed">&ldquo;{startup.one_liner as string}&rdquo;</p>
          </div>
        )}

        {/* Community momentum */}
        {momentumData && (momentumData.distinct_voters ?? 0) > 0 && (
          <div className="mb-6">
            <EcosystemMomentumBadge
              startupId={startup.id}
              variant="full"
              initialMomentum={{
                momentum_score: momentumData.momentum_score ?? 0,
                up_count: momentumData.up_count ?? 0,
                down_count: momentumData.down_count ?? 0,
                distinct_voters: momentumData.distinct_voters ?? 0,
                last_vote_at: momentumData.last_vote_at,
              }}
            />
          </div>
        )}

        {/* Strengths highlights */}
        <PublicStrengthsHighlights highlights={highlights} />

        {/* Top scoring dimensions */}
        <PublicTopDimensions dimensions={topDimensions} />

        {/* Deck preview carousel */}
        {startup.consent_public_deck && (
          <DeckPreviewCarousel startupId={startup.id} />
        )}

        {/* Eval summary + next actions */}
        {evalTimeline.length > 0 && evalTimeline[0].summary && (
          <div className="bg-white rounded-card border border-border-soft p-6 mb-6">
            <p className="font-body text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-2">{t("public_feedback")}</p>
            <p className="font-body text-brand-navy leading-relaxed text-sm">{evalTimeline[0].summary}</p>
            {evalTimeline[0].next_actions && (evalTimeline[0].next_actions as string[]).length > 0 && (
              <div className="mt-4">
                <p className="font-body text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">{t("next_actions")}</p>
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

        {/* Timeline */}
        {startup.show_public_timeline && evalTimeline.length > 1 && (
          <div className="bg-white rounded-card border border-border-soft p-6 mb-6">
            <p className="font-body text-xs text-ink-secondary uppercase tracking-wider font-semibold mb-4">{t("evolution")}</p>
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
              href={startup.website as string}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-ink-secondary hover:text-brand-navy transition-colors"
            >
              {(startup.website as string).replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
