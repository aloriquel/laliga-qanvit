const BASE = "https://laliga.qanvit.com";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "La Liga Qanvit",
    url: BASE,
    logo: `${BASE}/brand/logo-light.svg`,
    sameAs: ["https://www.qanvit.com", "https://twitter.com/qanvit"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hola@qanvit.com",
      contactType: "customer support",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "La Liga Qanvit",
    url: BASE,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE}/liga?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function startupJsonLd(startup: {
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  division?: string | null;
  vertical?: string | null;
  score?: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: startup.name,
    url: startup.website ?? `${BASE}/startup/${startup.slug}`,
    description: startup.description ?? undefined,
  };
}
