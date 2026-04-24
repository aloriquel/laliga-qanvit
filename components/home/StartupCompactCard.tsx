import Link from "next/link";
import StartupAvatar from "@/components/ui/StartupAvatar";
import {
  DIVISION_LABELS,
  VERTICAL_LABELS,
  DIVISION_TINT,
  type Division,
  type Vertical,
} from "@/lib/home/categories";
import type { RankedStartup } from "@/lib/home/top-by-category";

type Props = {
  startup: RankedStartup;
  categoryType: "division" | "vertical";
};

function rankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function StartupCompactCard({ startup, categoryType }: Props) {
  const tint = DIVISION_TINT[startup.division as Division] ?? "#f4a9aa";
  const divLabel = DIVISION_LABELS[startup.division as Division] ?? startup.division;
  const vertLabel = VERTICAL_LABELS[startup.vertical as Vertical] ?? startup.vertical;
  const medal = rankMedal(startup.current_rank_in_category);
  const contextLabel =
    categoryType === "division" ? `${divLabel}` : `${vertLabel}`;

  return (
    <Link
      href={`/startup/${startup.slug}`}
      aria-label={`${startup.name} · #${startup.current_rank_in_category} en ${contextLabel}`}
      className="snap-start shrink-0 w-[200px] h-[280px] md:w-[240px] md:h-[320px] lg:w-[280px] lg:h-[360px] rounded-[20px] overflow-hidden relative group focus:outline-none focus:ring-2 focus:ring-brand-salmon transition-transform duration-200 hover:scale-[1.03]"
    >
      {/* Navy gradient backdrop with a coloured wash from the division tint. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #22183a 0%, #2d1f4a 55%, #22183a 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${tint} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 2px rgba(244,169,170,0.35)" }}
      />

      {/* Header badge */}
      <div className="absolute top-3 left-4 font-sora text-[11px] font-semibold text-brand-salmon tracking-wide">
        {"{ La Liga Qanvit }"}
      </div>
      {medal && (
        <div className="absolute top-2 right-3 text-2xl leading-none select-none">
          {medal}
        </div>
      )}

      {/* Body */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pt-8 pb-5">
        <StartupAvatar
          startup={{ name: startup.name, logo_url: startup.logo_url }}
          size={56}
          style={{ border: "2px solid #f4a9aa" }}
        />
        <p className="font-sora font-bold text-white text-center text-base md:text-lg leading-tight line-clamp-2 max-w-[90%]">
          {startup.name}
        </p>
        <div
          className="font-body font-semibold rounded-full px-2.5 py-0.5 text-[10px] md:text-[11px]"
          style={{ background: tint, color: "#22183a" }}
        >
          {divLabel} · {vertLabel}
        </div>
        <p
          className="font-sora font-extrabold leading-none mt-1 text-brand-salmon text-4xl md:text-5xl"
          style={{ letterSpacing: -1.5 }}
        >
          {Math.round(startup.current_score)}
        </p>
        <p className="font-sora uppercase tracking-widest text-[10px] md:text-[11px] text-brand-salmon/90 text-center mt-0.5">
          #{startup.current_rank_in_category} en {contextLabel}
        </p>
      </div>

      {/* Domain footer */}
      <div className="absolute bottom-2 right-3 font-mono text-[9px] md:text-[10px] text-white/30">
        laliga.qanvit.com
      </div>
    </Link>
  );
}
