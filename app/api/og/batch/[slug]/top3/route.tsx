import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const runtime = "edge";
export const revalidate = 3600;

type Props = { params: { slug: string } };

type WinnerData = {
  name: string;
  logo_url: string | null;
  score: number;
};

function EmptySlot({ position }: { position: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: 0.4,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "3px dashed rgba(244,169,170,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f4a9aa",
          fontSize: 40,
        }}
      >
        #{position}
      </div>
    </div>
  );
}

export async function GET(_req: Request, { params }: Props) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: batch } = await supabase
    .from("batches")
    .select("id, display_name")
    .eq("slug", params.slug)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: winnersRaw } = batch
    ? await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("batch_winners" as any)
        .select("category, final_score, startups!inner(name, logo_url)")
        .eq("batch_id", batch.id)
        .in("category", ["national_top1", "national_top2", "national_top3"])
    : { data: null };

  const byCategory = new Map<string, WinnerData>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const w of (winnersRaw ?? []) as any[]) {
    byCategory.set(w.category, {
      name: w.startups?.name ?? "—",
      logo_url: w.startups?.logo_url ?? null,
      score: Number(w.final_score),
    });
  }

  const w1 = byCategory.get("national_top1");
  const w2 = byCategory.get("national_top2");
  const w3 = byCategory.get("national_top3");

  const displayName = batch?.display_name ?? params.slug;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #22183a 0%, #2d1f4a 50%, #22183a 100%)",
          fontFamily: "sans-serif",
          padding: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div style={{ color: "#f4a9aa", fontSize: 22, fontWeight: 600, letterSpacing: 2 }}>
            {"{ La Liga Qanvit }"}
          </div>
          <div style={{ color: "#ffffff", fontSize: 52, fontWeight: 800, marginTop: 12 }}>
            Top 3 · {displayName}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 48,
            marginTop: 24,
          }}
        >
          {/* #2 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {w2 ? <WinnerNode winner={w2} size={120} medal="🥈" /> : <EmptySlot position={2} />}
          </div>
          {/* #1 elevated */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transform: "translateY(-30px)" }}>
            {w1 ? <WinnerNode winner={w1} size={180} medal="🥇" elevated /> : <EmptySlot position={1} />}
          </div>
          {/* #3 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {w3 ? <WinnerNode winner={w3} size={120} medal="🥉" /> : <EmptySlot position={3} />}
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

function WinnerNode({
  winner, size, medal, elevated,
}: { winner: WinnerData; size: number; medal: string; elevated?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: elevated ? 72 : 48, lineHeight: 1 }}>{medal}</div>
      {winner.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={winner.logo_url}
          width={size}
          height={size}
          style={{
            borderRadius: "50%",
            border: `3px solid ${elevated ? "#f4a9aa" : "rgba(244,169,170,0.7)"}`,
            objectFit: "cover",
            background: "#fff",
          }}
          alt=""
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#f1e8f4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#22183a",
            fontSize: size * 0.4,
            fontWeight: 800,
            border: `3px solid ${elevated ? "#f4a9aa" : "rgba(244,169,170,0.7)"}`,
          }}
        >
          {winner.name.charAt(0)}
        </div>
      )}
      <div
        style={{
          color: "#ffffff",
          fontSize: elevated ? 28 : 20,
          fontWeight: 700,
          maxWidth: size * 1.4,
          textAlign: "center",
        }}
      >
        {winner.name}
      </div>
      <div
        style={{
          color: "#f4a9aa",
          fontSize: elevated ? 24 : 18,
          fontFamily: "monospace",
        }}
      >
        {winner.score.toFixed(1)}
      </div>
    </div>
  );
}
