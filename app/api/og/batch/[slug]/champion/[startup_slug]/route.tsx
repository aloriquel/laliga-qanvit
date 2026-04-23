import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const runtime = "edge";
export const revalidate = 3600;

type Props = { params: { slug: string; startup_slug: string } };

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation", seed: "Seed", growth: "Growth", elite: "Elite",
};
const VERTICAL_LABELS: Record<string, string> = {
  deeptech_ai: "Deeptech & AI", robotics_automation: "Robotics & Automation",
  mobility: "Mobility", energy_cleantech: "Energy & Cleantech", agrifood: "AgriFood",
  healthtech_medtech: "HealthTech & MedTech", industrial_manufacturing: "Industrial & Manufacturing",
  space_aerospace: "Space & Aerospace", materials_chemistry: "Materials & Chemistry",
  cybersecurity: "Cybersecurity",
};
const CA_LABELS: Record<string, string> = {};

function categoryPill(category: string, segmentKey: string | null): string {
  switch (category) {
    case "national_top1": return "🏆 Campeón Nacional";
    case "national_top2": return "🥈 Subcampeón";
    case "national_top3": return "🥉 Tercero";
    case "division_top1":
      return `🏆 División ${segmentKey ? DIVISION_LABELS[segmentKey] ?? segmentKey : ""}`;
    case "region_ca_top1":
      return `🏆 ${segmentKey ? CA_LABELS[segmentKey] ?? segmentKey : ""}`;
    case "vertical_top1":
      return `🏆 ${segmentKey ? VERTICAL_LABELS[segmentKey] ?? segmentKey : ""}`;
    default: return "🏆 Ganador";
  }
}

export async function GET(_req: Request, { params }: Props) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [{ data: batch }, { data: startup }] = await Promise.all([
    supabase.from("batches").select("id, display_name").eq("slug", params.slug).maybeSingle(),
    supabase.from("startups").select("id, name, logo_url").eq("slug", params.startup_slug).maybeSingle(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winners = batch && startup
    ? await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("batch_winners" as any)
        .select("category, segment_key, final_score")
        .eq("batch_id", batch.id)
        .eq("startup_id", startup.id)
    : { data: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wArr = (winners.data ?? []) as any[];
  const pills = wArr.map((w) => categoryPill(w.category, w.segment_key));
  const score = wArr.length > 0 ? Math.max(...wArr.map((w) => Number(w.final_score))) : 0;

  const displayName = batch?.display_name ?? params.slug;
  const name = startup?.name ?? "—";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630, display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #22183a 0%, #2d1f4a 50%, #22183a 100%)",
          fontFamily: "sans-serif", padding: 56, position: "relative",
        }}
      >
        <div style={{ color: "#f4a9aa", fontSize: 22, fontWeight: 600, letterSpacing: 2 }}>
          {"{ La Liga Qanvit }"}
        </div>
        <div style={{ color: "#ffffff", fontSize: 36, fontWeight: 800, marginTop: 4 }}>
          🏆 Campeón · {displayName}
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            marginTop: 20,
          }}
        >
          {startup?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={startup.logo_url}
              width={200}
              height={200}
              style={{
                borderRadius: "50%",
                border: "4px solid #f4a9aa",
                objectFit: "cover",
                background: "#fff",
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 200, height: 200, borderRadius: "50%", background: "#f1e8f4",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#22183a", fontSize: 80, fontWeight: 800,
                border: "4px solid #f4a9aa",
              }}
            >
              {name.charAt(0)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 600 }}>
            <div style={{ color: "#ffffff", fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>
              {name}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {pills.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(244,169,170,0.2)",
                    color: "#f4a9aa",
                    border: "1px solid rgba(244,169,170,0.5)",
                    padding: "6px 16px",
                    borderRadius: 999,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
            {score > 0 && (
              <div style={{ color: "#f4a9aa", fontSize: 96, fontWeight: 800, lineHeight: 1, marginTop: 8 }}>
                {score.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.45)",
            fontSize: 16,
            fontFamily: "monospace",
          }}
        >
          <span style={{ color: "#f4a9aa", fontWeight: 700 }}>{"{ }"}</span>
          <span>laliga.qanvit.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
