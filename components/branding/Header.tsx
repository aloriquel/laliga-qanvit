import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/liga", label: "Liga" },
  { href: "/liga?tab=divisiones", label: "Divisiones" },
  { href: "/liga?tab=verticales", label: "Verticales" },
  { href: "/ecosistema", label: "Ecosistema" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-brand-navy">
      <div className="container-brand flex h-16 items-center justify-between">
        {/* Isotipo + wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="font-sora font-bold text-brand-salmon text-xl tracking-tight select-none"
            aria-hidden="true"
          >
            {"{"}
          </span>
          <span className="font-sora font-semibold text-white text-base tracking-tight leading-none">
            La Liga Qanvit
          </span>
          <span
            className="font-sora font-bold text-brand-salmon text-xl tracking-tight select-none"
            aria-hidden="true"
          >
            {"}"}
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-body text-sm text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Button
          asChild
          className="bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl px-5 py-2.5 text-sm"
        >
          <Link href="/play">Ficha tu startup</Link>
        </Button>
      </div>
    </header>
  );
}
