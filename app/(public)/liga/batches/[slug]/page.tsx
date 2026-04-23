import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getBatchBySlug } from "@/lib/batches";
import { getCaById, type CaId } from "@/lib/spain-regions";

export const revalidate = 300;

type Props = { params: { slug: string } };

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
};
const DIVISIONS = ["ideation", "seed", "growth", "elite"] as const;

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const batch = await getBatchBySlug(params.slug);
  if (!batch) return { title: "Batch no encontrado" };
  return {
    title: `${batch.display_name} — Hall of Fame`,
    description: `Podium + campeones del batch ${batch.display_name} de La Liga Qanvit.`,
    openGraph: { images: [`/api/og/batch/${batch.slug}/top3`] },
    twitter: { card: "summary_large_image", images: [`/api/og/batch/${batch.slug}/top3`] },
  };
}

type WinnerJoined = {
  category: string;
  segment_key: string | null;
  final_score: number;
  startup: { id: string; name: string; slug: string; logo_url: string | null; current_division: string | null; current_vertical: string | null };
};

type ParticipationJoined = {
  startup_id: string;
  final_score: number | null;
  rank_national: number | null;
  startup: { name: string; slug: string; logo_url: string | null; current_division: string | null; current_vertical: string | null; region_ca: string | null };
};

export default async function BatchResultsPage({ params }: Props) {
  const batch = await getBatchBySlug(params.slug);
  if (!batch) notFound();
  if (!["closed", "archived"].includes(batch.status)) notFound();
  if (batch.quarter === "Q0_HISTORICO") notFound();

  const service = createServiceClient();

  const [{ data: winnersRaw }, { data: participationsRaw }, { count: participants }] =
    await Promise.all([
      service
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("batch_winners" as any)
        .select("category, segment_key, final_score, startup:startups!inner(id, name, slug, logo_url, current_division, current_vertical)")
        .eq("batch_id", batch.id),
      service
        .from("batch_participations")
        .select("startup_id, final_score, rank_national, startup:startups!inner(name, slug, logo_url, current_division, current_vertical, region_ca)")
        .eq("batch_id", batch.id)
        .not("rank_national", "is", null)
        .order("rank_national", { ascending: true })
        .limit(100),
      service
        .from("batch_participations")
        .select("id", { count: "exact", head: true })
        .eq("batch_id", batch.id),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winners = (winnersRaw ?? []) as any as WinnerJoined[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participations = (participationsRaw ?? []) as any as ParticipationJoined[];

  const nationalTop = (rank: number) => winners.find((w) => w.category === `national_top${rank}`);
  const top1 = nationalTop(1);
  const top2 = nationalTop(2);
  const top3 = nationalTop(3);

  const divisionWinners = DIVISIONS.map((d) => ({
    division: d,
    label: DIVISION_LABELS[d],
    winner: winners.find((w) => w.category === "division_top1" && w.segment_key === d) ?? null,
  }));

  const caWinners = winners.filter((w) => w.category === "region_ca_top1");
  const verticalWinners = winners.filter((w) => w.category === "vertical_top1");

  const shareText = encodeURIComponent(`Top 3 de ${batch.display_name} en La Liga Qanvit`);
  const shareUrl = encodeURIComponent(`https://laliga.qanvit.com/liga/batches/${batch.slug}`);

  return (
    <div className="bg-brand-lavender min-h-screen py-12">
      <div className="container-brand max-w-5xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
            Hall of Fame
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy">
            {batch.display_name}
          </h1>
          <p className="font-body text-ink-secondary mt-3">
            {participants ?? 0} startups compitieron
            {batch.closed_at && ` · cerrado el ${new Date(batch.closed_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`}
          </p>
        </div>

        {/* Podium */}
        {top1 && (
          <div className="mb-12">
            <p className="font-mono text-xs text-brand-salmon uppercase tracking-widest text-center mb-6">
              Podium Nacional
            </p>
            <div className="grid grid-cols-3 gap-4 items-end">
              <PodiumCard medal="🥈" position={2} winner={top2} color="bg-white" />
              <PodiumCard medal="🥇" position={1} winner={top1} color="bg-brand-salmon/20 border-brand-salmon" elevated />
              <PodiumCard medal="🥉" position={3} winner={top3} color="bg-white" />
            </div>
          </div>
        )}

        {/* Division winners */}
        <Section title="Campeones por División">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {divisionWinners.map(({ division, label, winner }) => (
              <div
                key={division}
                className="bg-white rounded-card shadow-card border border-border-soft p-5"
              >
                <p className="font-mono text-[10px] text-brand-salmon uppercase tracking-wider mb-2">
                  División {label}
                </p>
                {winner ? (
                  <Link href={`/startup/${winner.startup.slug}`} className="flex items-center gap-3 hover:text-brand-navy">
                    {winner.startup.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={winner.startup.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-lavender flex items-center justify-center font-sora font-bold">
                        {winner.startup.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-sora font-semibold text-brand-navy truncate">{winner.startup.name}</p>
                      <p className="font-mono text-xs text-ink-secondary">{winner.final_score.toFixed(1)}</p>
                    </div>
                  </Link>
                ) : (
                  <p className="font-body text-sm text-ink-secondary italic">Sin participantes</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* CA winners */}
        {caWinners.length > 0 && (
          <Section title="Campeones por Comunidad Autónoma">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caWinners.map((w) => {
                const caName = w.segment_key ? getCaById(w.segment_key as CaId)?.name ?? w.segment_key : "—";
                return (
                  <Link key={w.startup.id + w.segment_key} href={`/startup/${w.startup.slug}`} className="bg-white rounded-card shadow-card border border-border-soft p-5 hover:border-brand-salmon/40 transition-colors">
                    <p className="font-mono text-[10px] text-brand-salmon uppercase tracking-wider mb-2">🏆 {caName}</p>
                    <p className="font-sora font-semibold text-brand-navy">{w.startup.name}</p>
                    <p className="font-mono text-xs text-ink-secondary mt-1">{w.final_score.toFixed(1)}</p>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* Vertical winners */}
        {verticalWinners.length > 0 && (
          <Section title="Campeones por Vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verticalWinners.map((w) => {
                const vName = w.segment_key ? VERTICAL_LABELS[w.segment_key] ?? w.segment_key : "—";
                return (
                  <Link key={w.startup.id + w.segment_key} href={`/startup/${w.startup.slug}`} className="bg-white rounded-card shadow-card border border-border-soft p-5 hover:border-brand-salmon/40 transition-colors">
                    <p className="font-mono text-[10px] text-brand-salmon uppercase tracking-wider mb-2">🏆 {vName}</p>
                    <p className="font-sora font-semibold text-brand-navy">{w.startup.name}</p>
                    <p className="font-mono text-xs text-ink-secondary mt-1">{w.final_score.toFixed(1)}</p>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* Full leaderboard */}
        <Section title="Ranking completo">
          <div className="bg-white rounded-card shadow-card border border-border-soft overflow-hidden">
            {participations.map((p) => (
              <Link
                key={p.startup_id}
                href={`/startup/${p.startup.slug}`}
                className="grid grid-cols-[3rem_1fr_auto] gap-4 px-5 py-3 border-b border-border-soft last:border-0 hover:bg-brand-lavender/30 transition-colors items-center"
              >
                <span className="font-sora font-bold text-brand-navy">#{p.rank_national}</span>
                <div className="min-w-0">
                  <p className="font-sora font-semibold text-brand-navy truncate">{p.startup.name}</p>
                  <p className="font-mono text-xs text-ink-secondary">
                    {DIVISION_LABELS[p.startup.current_division ?? ""] ?? "—"} · {VERTICAL_LABELS[p.startup.current_vertical ?? ""] ?? "—"}
                  </p>
                </div>
                <span className="font-mono font-bold text-brand-navy">{p.final_score?.toFixed(1) ?? "—"}</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* Share CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mt-10">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            className="bg-brand-navy text-white font-sora font-semibold rounded-xl px-6 py-3 hover:bg-brand-navy/90 transition-colors"
          >
            Compartir en LinkedIn
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            className="bg-brand-salmon text-brand-navy font-sora font-semibold rounded-xl px-6 py-3 hover:bg-brand-salmon/80 transition-colors"
          >
            Compartir en X
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-sora font-bold text-2xl text-brand-navy mb-4">{title}</h2>
      {children}
    </section>
  );
}

function PodiumCard({
  medal, position, winner, color, elevated,
}: {
  medal: string; position: number; winner?: WinnerJoined; color: string; elevated?: boolean;
}) {
  if (!winner) {
    return (
      <div className={`rounded-card p-5 text-center border ${color} ${elevated ? "pb-10" : ""}`}>
        <span className="text-3xl">{medal}</span>
        <p className="font-mono text-xs text-ink-secondary mt-2">Sin #{position}</p>
      </div>
    );
  }
  return (
    <Link
      href={`/startup/${winner.startup.slug}`}
      className={`rounded-card p-5 text-center border ${color} ${elevated ? "pb-10 shadow-card" : ""} hover:-translate-y-1 transition-transform block`}
    >
      <div className={elevated ? "text-5xl mb-2" : "text-3xl mb-1"}>{medal}</div>
      {winner.startup.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={winner.startup.logo_url} alt="" className={`rounded-full object-cover mx-auto ${elevated ? "w-20 h-20" : "w-14 h-14"} border-2 border-brand-salmon`} />
      ) : (
        <div className={`rounded-full bg-brand-lavender flex items-center justify-center font-sora font-bold text-brand-navy mx-auto ${elevated ? "w-20 h-20 text-2xl" : "w-14 h-14"}`}>
          {winner.startup.name.charAt(0)}
        </div>
      )}
      <p className={`font-sora font-bold text-brand-navy mt-3 truncate ${elevated ? "text-xl" : "text-base"}`}>
        {winner.startup.name}
      </p>
      <p className="font-mono text-xs text-ink-secondary mt-1">{winner.final_score.toFixed(1)}</p>
    </Link>
  );
}
