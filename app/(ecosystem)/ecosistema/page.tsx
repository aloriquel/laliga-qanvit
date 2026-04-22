import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Trophy, Star, ThumbsUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ecosistema",
  description:
    "Parques, clusters y asociaciones: accede al mapa de startups técnicas españolas y gana posiciones contribuyendo.",
};

export default async function EcosistemaLandingPage() {
  const t = await getTranslations("ecosystem_landing");

  // Check if the logged-in user has ecosystem role
  let isEcosystemUser = false;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isEcosystemUser = profile?.role === "ecosystem";
    }
  } catch {
    // Supabase not configured in dev
  }

  const CARDS = [
    { icon: ArrowRight, title: t("card1_title"), body: t("card1_body") },
    { icon: Trophy, title: t("card2_title"), body: t("card2_body") },
    { icon: ThumbsUp, title: t("card3_title"), body: t("card3_body") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-24 md:py-32">
        <div className="container-brand max-w-3xl flex flex-col gap-6">
          <p className="font-sora text-brand-salmon text-sm font-semibold tracking-widest uppercase">
            {t("hero_eyebrow")}
          </p>
          <h1 className="font-sora font-bold text-4xl md:text-6xl leading-tight">
            {t("hero_title")}
          </h1>
          <p className="font-body text-lg text-white/70 max-w-2xl leading-relaxed">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/ecosistema/aplicar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl text-base px-8 py-4 h-auto"
              )}
            >
              {t("cta_apply")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            {isEcosystemUser && (
              <Link
                href="/ecosistema/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base px-8 py-4 h-auto border border-white/20"
                )}
              >
                {t("cta_dashboard")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="bg-brand-lavender py-20 md:py-28">
        <div className="container-brand">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CARDS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-navy/5 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-brand-navy" />
                </div>
                <h2 className="font-sora font-bold text-lg text-brand-navy">
                  {title}
                </h2>
                <p className="font-body text-sm text-ink-secondary leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/ecosistema/aplicar"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-navy text-white hover:bg-brand-navy/90 font-semibold rounded-xl text-base px-10 py-4 h-auto"
              )}
            >
              {t("cta_apply")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
