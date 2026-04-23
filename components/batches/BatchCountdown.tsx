"use client";

import { useEffect, useState } from "react";

type Props = {
  target: string;
  sublabel?: string | null;
  variant?: "hero" | "inline";
};

function computeTime(target: string): { days: number; hours: number; expired: boolean } {
  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, expired: true };
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: false };
}

export default function BatchCountdown({ target, sublabel, variant = "hero" }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, expired } = computeTime(target);
  const urgent = !expired && days < 2;

  const label = expired ? "en cierre…" : `${days}d ${hours}h`;

  if (variant === "inline") {
    return (
      <span
        data-tick={tick}
        className={
          urgent
            ? "font-mono text-xs font-semibold text-brand-salmon"
            : "font-mono text-xs text-ink-secondary"
        }
      >
        {label}
      </span>
    );
  }

  return (
    <div data-tick={tick} className="flex flex-col gap-1">
      <span
        className={
          urgent
            ? "font-sora font-bold text-3xl md:text-4xl text-brand-salmon"
            : "font-sora font-bold text-3xl md:text-4xl text-brand-navy"
        }
      >
        {label}
      </span>
      {sublabel && (
        <span className="font-body text-sm text-ink-secondary">{sublabel}</span>
      )}
    </div>
  );
}
