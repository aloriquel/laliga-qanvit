import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="font-sora font-bold text-3xl md:text-5xl text-brand-salmon mb-4">
        {"{ esto no existe }"}
      </p>
      <p className="text-ink-secondary text-lg mb-8 max-w-sm">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link
        href="/liga"
        className="bg-brand-navy text-white font-sora font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
      >
        Volver al leaderboard
      </Link>
    </div>
  );
}
