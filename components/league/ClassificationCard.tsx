"use client";

import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import StartupAvatar from "@/components/ui/StartupAvatar";
import { cn } from "@/lib/utils";

const DIVISION_COLORS: Record<string, string> = {
  ideation: "#b8c5d6",
  seed: "#a8d5ba",
  growth: "#f4a9aa",
  elite: "#c8a2c8",
};

const DIVISION_LABELS: Record<string, string> = {
  ideation: "Ideation",
  seed: "Seed",
  growth: "Growth",
  elite: "Elite",
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

type Ranking = {
  rank_national: number;
  rank_division: number;
  rank_division_vertical: number;
};

type Props = {
  startup: {
    name: string;
    logo_url?: string | null;
    current_division?: string | null;
    current_vertical?: string | null;
    current_score?: number | null;
  };
  ranking?: Ranking | null;
  size?: "md" | "lg" | "share";
  interactive?: boolean;
};

const SIZES = {
  md: { width: 480, height: 252, scale: 0.4 },
  lg: { width: 900, height: 473, scale: 0.75 },
  share: { width: 1200, height: 630, scale: 1 },
};

function rankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function ClassificationCard({ startup, ranking, size = "lg", interactive = true }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-8, 8]), { stiffness: 200, damping: 30 });

  const { width, height, scale } = SIZES[size];
  const score = startup.current_score != null ? Math.round(Number(startup.current_score)) : null;
  const divisionColor = DIVISION_COLORS[startup.current_division ?? ""] ?? "#f4a9aa";
  const divisionLabel = DIVISION_LABELS[startup.current_division ?? ""] ?? startup.current_division ?? "—";
  const verticalLabel = VERTICAL_LABELS[startup.current_vertical ?? ""] ?? startup.current_vertical ?? "—";
  const medal = ranking ? rankMedal(ranking.rank_division_vertical) : null;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 2);
    mouseY.set(y * 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const scoreFontSize = size === "md" ? 48 : size === "lg" ? 100 : 140;
  const nameFontSize = size === "md" ? 16 : size === "lg" ? 30 : 42;
  const pillFontSize = size === "md" ? 11 : size === "lg" ? 14 : 18;
  const rankFontSize = size === "md" ? 10 : size === "lg" ? 13 : 17;

  return (
    <div style={{ width, height, flexShrink: 0 }} className="relative">
      <motion.div
        ref={cardRef}
        style={{
          width,
          height,
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
          perspective: 800,
        }}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-[24px] overflow-hidden cursor-default"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #22183a 0%, #2d1f4a 50%, #22183a 100%)",
          }}
        />

        {/* Salmon radial overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, rgba(244,169,170,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Border glow */}
        <div
          className="absolute inset-0 rounded-[24px]"
          style={{ boxShadow: "inset 0 0 0 3px #f4a9aa, 0 0 40px rgba(244,169,170,0.15)" }}
        />

        {/* Shimmer sweep animation */}
        {!prefersReducedMotion && (
          <ShimmerSweep width={width} height={height} />
        )}

        {/* Medal */}
        {medal && (
          <div
            className="absolute top-4 right-4 leading-none select-none pointer-events-none"
            style={{ fontSize: size === "md" ? 32 : size === "lg" ? 64 : 96 }}
          >
            {medal}
          </div>
        )}

        {/* Header isotipo */}
        <div
          className="absolute top-4 left-4 font-sora font-semibold"
          style={{ color: "#f4a9aa", fontSize: size === "md" ? 11 : 16 }}
        >
          {"{ La Liga Qanvit }"}
        </div>

        {/* Main content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 pt-8 pb-6">
          {/* Logo */}
          <StartupAvatar
            startup={startup}
            size={size === "md" ? 48 : size === "lg" ? 88 : 120}
            priority={size === "lg" || size === "xl"}
            style={{
              border: "3px solid #f4a9aa",
              marginBottom: size === "md" ? 4 : 8,
            }}
          />

          {/* Name */}
          <p
            className="font-sora font-bold text-white text-center leading-tight"
            style={{ fontSize: nameFontSize, maxWidth: "80%" }}
          >
            {startup.name}
          </p>

          {/* Division · Vertical pill */}
          <div
            className="font-body font-semibold rounded-full px-3 py-1"
            style={{
              background: divisionColor,
              color: "#22183a",
              fontSize: pillFontSize,
            }}
          >
            {divisionLabel} · {verticalLabel}
          </div>

          {/* Score */}
          {score != null && (
            <p
              className="font-sora font-extrabold leading-none"
              style={{ color: "#f4a9aa", fontSize: scoreFontSize, letterSpacing: -2 }}
            >
              {score}
            </p>
          )}

          {/* Rankings */}
          {ranking && (
            <div className="flex flex-col items-center gap-0.5">
              <p
                className="font-sora font-semibold uppercase tracking-widest"
                style={{ color: "#f4a9aa", fontSize: rankFontSize }}
              >
                #{ranking.rank_division_vertical} en {divisionLabel} {verticalLabel}
              </p>
              <p
                className="font-mono"
                style={{ color: "rgba(241,232,244,0.5)", fontSize: rankFontSize - 2 }}
              >
                #{ranking.rank_division} en {divisionLabel} · #{ranking.rank_national} nacional
              </p>
            </div>
          )}
        </div>

        {/* Footer domain */}
        <div
          className="absolute bottom-3 right-4 font-mono"
          style={{ color: "rgba(255,255,255,0.35)", fontSize: size === "md" ? 9 : 12 }}
        >
          laliga.qanvit.com
        </div>
      </motion.div>
    </div>
  );
}

function ShimmerSweep({ width, height }: { width: number; height: number }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      initial={{ x: -width }}
      animate={{ x: width * 2 }}
      transition={{
        duration: 1.2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 4.8,
      }}
    >
      <div
        style={{
          width: width * 0.4,
          height: height,
          background: "linear-gradient(90deg, transparent 0%, rgba(244,169,170,0.12) 50%, transparent 100%)",
          transform: "skewX(-15deg)",
        }}
      />
    </motion.div>
  );
}
