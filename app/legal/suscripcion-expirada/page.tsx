import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Enlace expirado",
  description: "El link de confirmación de suscripción ha expirado.",
};

export default function SuscripcionExpiradaPage() {
  return (
    <>
      <h1>El enlace ha expirado</h1>
      <p>
        Por seguridad, los enlaces de confirmación caducan a los 7 días.
        El enlace que intentaste usar ya no es válido.
      </p>
      <p>
        Puedes volver a suscribirte desde el perfil público de la startup.
      </p>
      <div className="mt-8">
        <Link
          href="/liga"
          className="inline-block bg-brand-navy text-white font-body text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-brand-navy/90 transition-colors"
        >
          Explorar startups
        </Link>
      </div>
    </>
  );
}
