import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: true, follow: false },
};

const LEGAL_LINKS = [
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/terminos", label: "Términos" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/dpa", label: "DPA" },
  { href: "/legal/faq-gdpr", label: "FAQ GDPR" },
  { href: "/legal/transparencia", label: "Transparencia" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-lavender min-h-screen">
      {/* Header legal */}
      <div className="bg-brand-navy border-b border-white/10 py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="font-sora text-brand-salmon font-bold text-sm">
            {"{ La Liga Qanvit }"}
          </Link>
          <nav className="flex items-center gap-3 flex-wrap" aria-label="Legal nav">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white/60 hover:text-white text-xs font-body transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-card shadow-card border border-border-soft p-8 md:p-12 prose prose-slate max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
