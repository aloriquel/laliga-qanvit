import type { Metadata } from "next";
import Link from "next/link";
import UnsubscribeTracker from "./UnsubscribeTracker";

export const metadata: Metadata = {
  title: "Baja realizada",
  description: "Has cancelado la suscripción a novedades de esta startup.",
};

export default function BajaExitosaPage() {
  return (
    <>
      <UnsubscribeTracker />
      <h1>Baja realizada</h1>
      <p>
        Te hemos dado de baja de las novedades por email de esta startup.
        No recibirás más avisos sobre sus actualizaciones.
      </p>
      <p>
        Si fue un error, puedes volver a suscribirte desde el perfil público
        de la startup en cualquier momento.
      </p>
      <div className="mt-8">
        <Link
          href="/liga"
          className="inline-block bg-brand-navy text-white font-body text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-brand-navy/90 transition-colors"
        >
          Volver al ranking
        </Link>
      </div>
    </>
  );
}
