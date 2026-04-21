import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service key bypasses RLS — consent is enforced manually in isReady check below.

export const runtime = "edge";
export const revalidate = 3600;

const DIVISION_COLORS: Record<string, string> = {
  ideation: "#b8c5d6",
  seed: "#a8d5ba",
  growth: "#f4a9aa",
  elite: "#c8a2c8",
};

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

function rankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

type Props = { params: { slug: string } };

export async function GET(_req: Request, { params }: Props) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, logo_url, current_division, current_vertical, current_score, is_public, consent_public_profile")
    .eq("slug", params.slug)
    .single();

  const { data: standing } = startup
    ? await supabase
        .from("league_standings")
        .select("rank_national, rank_division, rank_division_vertical")
        .eq("startup_id", startup.id)
        .maybeSingle()
    : { data: null };

  const isReady =
    startup &&
    startup.is_public &&
    startup.consent_public_profile &&
    startup.current_score != null &&
    startup.current_division;

  // Placeholder card for unclassified or private startups
  if (!isReady) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #22183a 0%, #2d1f4a 50%, #22183a 100%)",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#f4a9aa", fontSize: 48, fontWeight: 700 }}>{"{ sin clasificar aún }"}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 20 }}>laliga.qanvit.com</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const divisionColor = DIVISION_COLORS[startup.current_division!] ?? "#f4a9aa";
  const divisionLabel = DIVISION_LABELS[startup.current_division!] ?? startup.current_division;
  const verticalLabel = VERTICAL_LABELS[startup.current_vertical!] ?? startup.current_vertical;
  const score = Math.round(Number(startup.current_score));
  const medal = standing ? rankMedal(standing.rank_division_vertical) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #22183a 0%, #2d1f4a 50%, #22183a 100%)",
          fontFamily: "sans-serif",
          border: "3px solid #f4a9aa",
          borderRadius: 24,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Salmon radial overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 30%, rgba(244,169,170,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Medal top-right */}
        {medal && (
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 32,
              fontSize: 120,
              lineHeight: 1,
            }}
          >
            {medal}
          </div>
        )}

        {/* Header: { La Liga Qanvit } */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 48,
            color: "#f4a9aa",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {"{ La Liga Qanvit }"}
        </div>

        {/* Main content — centered column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            gap: 0,
            paddingTop: 40,
            paddingBottom: 60,
            position: "relative",
          }}
        >
          {/* Logo circle */}
          {startup.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={startup.logo_url}
              width={120}
              height={120}
              style={{
                borderRadius: "50%",
                border: "4px solid #f4a9aa",
                objectFit: "cover",
                background: "#fff",
                marginBottom: 20,
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                border: "4px solid #f4a9aa",
                background: "#f1e8f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22183a",
                fontSize: 48,
                fontWeight: 800,
                marginBottom: 20,
              }}
            >
              {startup.name.charAt(0)}
            </div>
          )}

          {/* Name */}
          <div
            style={{
              color: "#ffffff",
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: -1,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {startup.name}
          </div>

          {/* Division · Vertical pill */}
          <div
            style={{
              background: divisionColor,
              color: "#22183a",
              fontSize: 18,
              fontWeight: 600,
              padding: "6px 20px",
              borderRadius: 999,
              marginBottom: 24,
              letterSpacing: 0.5,
            }}
          >
            {divisionLabel} · {verticalLabel}
          </div>

          {/* Score */}
          <div
            style={{
              color: "#f4a9aa",
              fontSize: 160,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -4,
              marginBottom: 8,
            }}
          >
            {score}
          </div>

          {/* Rank division+vertical */}
          {standing && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  color: "#f4a9aa",
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                #{standing.rank_division_vertical} EN {divisionLabel.toUpperCase()} {(verticalLabel ?? "").toUpperCase()}
              </div>
              <div
                style={{
                  color: "rgba(241,232,244,0.55)",
                  fontSize: 14,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                #{standing.rank_division} EN {divisionLabel.toUpperCase()} · #{standing.rank_national} NACIONAL
              </div>
            </div>
          )}
        </div>

        {/* Footer right: domain */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 40,
            color: "rgba(255,255,255,0.4)",
            fontSize: 14,
            fontFamily: "monospace",
          }}
        >
          laliga.qanvit.com
        </div>

        {/* Footer left: isotipo */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            left: 40,
            color: "#f4a9aa",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {"{ }"}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
