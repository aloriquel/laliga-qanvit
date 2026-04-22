import { ExternalLink } from "lucide-react";

const APP_QANVIT_URL = process.env.NEXT_PUBLIC_APP_QANVIT_URL ?? "https://app.qanvit.com";

type Variant = "header" | "tile" | "inline" | "footer";

type Props = {
  variant: Variant;
  context?: { startupName?: string };
};

const COPY: Record<Variant, string> = {
  header:  "¿Gestionas retos de innovación? → app.qanvit.com",
  tile:    "Lanza retos reales con startups del ecosistema en app.qanvit.com",
  inline:  "¿Quieres lanzar un reto con esta startup? → Gestiónalo en app.qanvit.com",
  footer:  "La Liga es tu ventana al ecosistema. Para lanzar retos reales →  app.qanvit.com",
};

export default function CTAToAppQanvit({ variant, context }: Props) {
  const rawCopy = COPY[variant];
  const copy = context?.startupName
    ? rawCopy.replace("esta startup", context.startupName)
    : rawCopy;

  const url = `${APP_QANVIT_URL}?utm_source=laliga&utm_medium=cta&utm_campaign=${variant}`;

  if (variant === "header") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex items-center gap-1.5 text-xs font-semibold font-body bg-brand-salmon text-brand-navy px-3 py-1.5 rounded-xl hover:bg-brand-salmon/90 transition-colors whitespace-nowrap"
      >
        {copy}
        <ExternalLink size={11} />
      </a>
    );
  }

  if (variant === "tile") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-brand-salmon rounded-2xl p-5 hover:bg-brand-salmon/90 transition-colors group"
      >
        <p className="font-sora font-bold text-brand-navy text-sm">{copy}</p>
        <p className="font-body text-brand-navy/70 text-xs mt-1 flex items-center gap-1">
          app.qanvit.com <ExternalLink size={10} />
        </p>
      </a>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-brand-salmon text-brand-navy font-semibold font-body text-sm px-4 py-3 rounded-xl hover:bg-brand-salmon/90 transition-colors"
      >
        {copy} <ExternalLink size={12} className="inline mb-0.5 ml-1" />
      </a>
    );
  }

  // footer
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-body text-xs text-ink-secondary hover:text-brand-navy transition-colors flex items-center gap-1"
    >
      {copy} <ExternalLink size={10} />
    </a>
  );
}
