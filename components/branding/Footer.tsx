import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Footer({ locale = "es" }: { locale?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-brand-navy py-8">
      <div className="container-brand flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50 font-body">
        {/* Branding */}
        <div className="flex items-center gap-2">
          <span className="font-sora text-brand-salmon font-bold">{"{ }"}</span>
          <span>
            &copy; {year}{" "}
            <Link
              href="https://www.qanvit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Qanvit
            </Link>
            . Todos los derechos reservados.
          </span>
        </div>

        {/* Legal links + locale switcher */}
        <nav className="flex items-center gap-4 flex-wrap justify-center" aria-label="Legal">
          <Link href="/como-funciona" className="hover:text-white transition-colors">
            Cómo funciona
          </Link>
          <Link href="/legal/privacidad" className="hover:text-white transition-colors">
            Privacidad
          </Link>
          <Link href="/legal/terminos" className="hover:text-white transition-colors">
            Términos
          </Link>
          <Link href="/legal/cookies" className="hover:text-white transition-colors">
            Cookies
          </Link>
          <Link href="/legal/transparencia" className="hover:text-white transition-colors">
            Transparencia
          </Link>
          <Link
            href="https://www.qanvit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            qanvit.com
          </Link>
          <LocaleSwitcher currentLocale={locale} />
        </nav>
      </div>
    </footer>
  );
}
