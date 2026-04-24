import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Upload, Star, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import HomeLeaderboardSections from "@/components/home/HomeLeaderboardSections";
import FullLeaderboardCTA from "@/components/home/FullLeaderboardCTA";
import { getHomeCategoryRows } from "@/lib/home/top-by-category";

export const revalidate = 60;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { code?: string; next?: string };
}) {
  // Supabase PKCE code sometimes lands here if site_url was misconfigured.
  // Forward it to the real callback handler.
  if (searchParams.code) {
    const next = searchParams.next ? `&next=${encodeURIComponent(searchParams.next)}` : "";
    redirect(`/auth/callback?code=${searchParams.code}${next}`);
  }

  const [t, , tc, categoryData] = await Promise.all([
    getTranslations("landing"),
    getTranslations("leaderboard"),
    getTranslations("common"),
    getHomeCategoryRows(),
  ]);

  const HOW_IT_WORKS = [
    { step: "01", icon: Upload, title: t("step1_title"), description: t("step1_desc") },
    { step: "02", icon: Star, title: t("step2_title"), description: t("step2_desc") },
    { step: "03", icon: Trophy, title: t("step3_title"), description: t("step3_desc") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-24 md:py-36">
        <div className="container-brand flex flex-col items-start gap-8 max-w-3xl">
          <div className="font-sora text-brand-salmon text-sm font-semibold tracking-widest uppercase">
            {"{ La Liga Qanvit }"}
          </div>
          <h1 className="font-sora font-bold text-5xl md:text-7xl leading-tight">
            {t("hero_title")}
          </h1>
          <p className="font-body text-xl text-white/70 max-w-xl leading-relaxed">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/play"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-brand-salmon text-brand-navy hover:bg-brand-salmon/90 font-semibold rounded-xl text-base px-8 py-4 h-auto"
              )}
            >
              {t("hero_cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/ecosistema/aplicar"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "text-white/80 hover:text-white hover:bg-white/10 rounded-xl text-base px-8 py-4 h-auto border border-white/20"
              )}
            >
              {tc("cta_ecosystem")}
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-brand-lavender py-20 md:py-28">
        <div className="container-brand">
          <div className="text-center mb-14">
            <p className="font-sora text-brand-navy/40 text-sm font-semibold tracking-widest uppercase mb-3">
              {"— { } —"}
            </p>
            <h2 className="font-sora font-bold text-4xl text-brand-navy">
              {t("how_it_works_title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div
                key={step}
                className="bg-white rounded-card shadow-card border border-border-soft p-8 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-brand-salmon text-sm font-medium">
                    {step}
                  </span>
                  <Icon className="h-5 w-5 text-brand-navy/40" />
                </div>
                <h3 className="font-sora font-semibold text-xl text-brand-navy">
                  {title}
                </h3>
                <p className="font-body text-ink-secondary text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carruseles por división y vertical + grid de categorías vacías */}
      <HomeLeaderboardSections
        activeDivisionRows={categoryData.activeDivisionRows}
        activeVerticalRows={categoryData.activeVerticalRows}
        emptyCategories={categoryData.emptyCategories}
        totalStartups={categoryData.totalStartups}
      />

      {/* CTA al ranking completo */}
      <FullLeaderboardCTA />
    </div>
  );
}
