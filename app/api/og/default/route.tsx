import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 86400;

export async function GET() {
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
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 40%, rgba(244,169,170,0.12) 0%, transparent 65%)",
          }}
        />

        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(241,232,244,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(241,232,244,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Isotipo */}
          <div
            style={{
              color: "#f4a9aa",
              fontSize: 100,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -4,
              marginBottom: 24,
            }}
          >
            {"{ }"}
          </div>

          {/* Title */}
          <div
            style={{
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -2,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            La Liga Qanvit
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "rgba(241,232,244,0.6)",
              fontSize: 24,
              fontWeight: 400,
              textAlign: "center",
              letterSpacing: 0.5,
              maxWidth: 700,
            }}
          >
            La liga nacional de startups técnicas de España
          </div>

          {/* Divider */}
          <div
            style={{
              width: 80,
              height: 3,
              background: "#f4a9aa",
              borderRadius: 2,
              marginTop: 32,
              marginBottom: 32,
            }}
          />

          {/* Pills row */}
          <div style={{ display: "flex", gap: 16 }}>
            {["Evaluación IA", "Ranking nacional", "Ecosistema"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(244,169,170,0.15)",
                  border: "1px solid rgba(244,169,170,0.4)",
                  color: "#f4a9aa",
                  fontSize: 16,
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: 999,
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Domain footer */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            color: "rgba(255,255,255,0.35)",
            fontSize: 16,
            fontFamily: "monospace",
            letterSpacing: 1,
          }}
        >
          laliga.qanvit.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
