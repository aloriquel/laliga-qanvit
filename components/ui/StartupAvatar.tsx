"use client";

import { useState } from "react";

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 96,
  xl: 160,
} as const;

type SizeKey = keyof typeof SIZE_MAP;

type AvatarStartup = {
  name: string;
  logo_url?: string | null;
};

type Props = {
  startup: AvatarStartup;
  size?: SizeKey | number;
  className?: string;
  /** Pass true for above-the-fold avatars to hint browser preload */
  priority?: boolean;
  /** Extra inline style for the container (e.g. border) */
  style?: React.CSSProperties;
};

/**
 * Renders a startup's logo when available; falls back to the first-letter
 * circle (same bg-brand-lavender / text-brand-navy pattern used across the
 * app) when logo_url is null or the image fails to load.
 *
 * This component is the single source of truth for startup avatars. Use it
 * everywhere instead of inline conditionals.
 */
export default function StartupAvatar({
  startup,
  size = "md",
  className = "",
  priority: _priority = false,
  style,
}: Props) {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const [imgError, setImgError] = useState(false);

  const containerBase: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    ...style,
  };

  if (startup.logo_url && !imgError) {
    return (
      <div style={containerBase} className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={startup.logo_url}
          alt={`Logo de ${startup.name}`}
          width={px}
          height={px}
          loading={_priority ? "eager" : "lazy"}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  // Fallback: initial circle
  const fontSize = Math.round(px * 0.4);
  return (
    <div
      style={{ ...containerBase, fontSize }}
      className={`bg-brand-lavender flex items-center justify-center text-brand-navy font-sora font-bold ${className}`}
    >
      {startup.name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}
