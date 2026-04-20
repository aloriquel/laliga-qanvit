import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://laliga.qanvit.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const { data: startups } = await supabase
    .from("startups")
    .select("slug, updated_at")
    .eq("is_public", true)
    .eq("consent_public_profile", true);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), priority: 1, changeFrequency: "daily" },
    { url: `${BASE}/liga`, lastModified: new Date(), priority: 0.9, changeFrequency: "hourly" },
    { url: `${BASE}/como-funciona`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/ecosistema/aplicar`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/legal/privacidad`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE}/legal/terminos`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE}/legal/cookies`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE}/legal/aviso-legal`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE}/legal/dpa`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${BASE}/legal/faq-gdpr`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE}/legal/transparencia`, priority: 0.4, changeFrequency: "monthly" },
  ];

  const startupRoutes: MetadataRoute.Sitemap = (startups ?? []).map((s) => ({
    url: `${BASE}/startup/${s.slug}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    priority: 0.5,
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...startupRoutes];
}
