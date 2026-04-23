import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import LigaTabs from "@/components/batches/LigaTabs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hall of Fame — La Liga Qanvit",
  description: "Los batches cerrados de La Liga Qanvit y sus campeones.",
};

type ClosedBatch = {
  id: string;
  slug: string;
  display_name: string;
  quarter: string;
  closed_at: string | null;
  ends_at: string;
  participants: number;
  top1: { name: string; slug: string; logo_url: string | null } | null;
};

async function fetchClosedBatches(): Promise<ClosedBatch[]> {
  const service = createServiceClient();
  const { data: batches } = await service
    .from("batches")
    .select("id, slug, display_name, quarter, closed_at, ends_at")
    .in("status", ["closed", "archived"])
    .neq("quarter", "Q0_HISTORICO")
    .order("starts_at", { ascending: false });

  if (!batches || batches.length === 0) return [];

  const enriched: ClosedBatch[] = await Promise.all(
    batches.map(async (b) => {
      const [{ count: participants }, { data: top1 }] = await Promise.all([
        service
          .from("batch_participations")
          .select("id", { count: "exact", head: true })
          .eq("batch_id", b.id),
        service
          .from("batch_winners")
          .select("startup_id, startups!inner(name, slug, logo_url)")
          .eq("batch_id", b.id)
          .eq("category", "national_top1")
          .maybeSingle(),
      ]);

      const s = (top1?.startups ?? null) as unknown as { name: string; slug: string; logo_url: string | null } | null;
      return {
        id: b.id,
        slug: b.slug,
        display_name: b.display_name,
        quarter: b.quarter,
        closed_at: b.closed_at,
        ends_at: b.ends_at,
        participants: participants ?? 0,
        top1: s ? { name: s.name, slug: s.slug, logo_url: s.logo_url } : null,
      };
    })
  );

  return enriched;
}

export default async function HistorialPage() {
  const batches = await fetchClosedBatches();

  return (
    <div className="bg-brand-lavender min-h-screen py-16">
      <div className="container-brand">
        <LigaTabs activeTab="historial" />

        <div className="mb-10">
          <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
            {"— { } —"}
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-5xl text-brand-navy">
            Hall of Fame
          </h1>
          <p className="font-body text-ink-secondary mt-2">
            Los batches cerrados de La Liga Qanvit.
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="bg-white rounded-card shadow-card border border-border-soft py-20 text-center">
            <p className="font-sora font-semibold text-brand-navy text-lg">
              Aún no hay batches cerrados.
            </p>
            <p className="font-body text-ink-secondary text-sm mt-2">
              Vuelve al terminar Q3 2026.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((b) => (
              <Link
                key={b.id}
                href={`/liga/batches/${b.slug}`}
                className="group bg-white rounded-card shadow-card border border-border-soft overflow-hidden hover:border-brand-salmon/40 transition-colors p-6 flex flex-col gap-3"
              >
                <div>
                  <p className="font-sora font-bold text-2xl text-brand-navy">
                    {b.display_name}
                  </p>
                  {b.closed_at && (
                    <p className="font-body text-xs text-ink-secondary mt-1">
                      Cerrado el {new Date(b.closed_at).toLocaleDateString("es-ES", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                <p className="font-mono text-xs text-ink-secondary">
                  {b.participants} startups participaron
                </p>

                {b.top1 && (
                  <div className="flex items-center gap-3 pt-3 border-t border-border-soft">
                    {b.top1.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.top1.logo_url}
                        alt={b.top1.name}
                        className="w-10 h-10 rounded-full object-cover border border-brand-salmon/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-lavender border border-brand-salmon/50 flex items-center justify-center font-sora font-bold text-brand-navy">
                        {b.top1.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-brand-salmon uppercase tracking-wider">
                        🏆 Campeón Nacional
                      </p>
                      <p className="font-sora font-semibold text-brand-navy truncate">
                        {b.top1.name}
                      </p>
                    </div>
                  </div>
                )}

                <p className="font-body text-xs text-brand-salmon font-semibold mt-auto group-hover:underline">
                  Ver podium completo →
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
