import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/ecosistema/dashboard/",
          "/play/evaluando/",
          "/play/resultado/",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://laliga.qanvit.com/sitemap.xml",
  };
}
