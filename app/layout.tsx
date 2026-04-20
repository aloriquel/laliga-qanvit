import type { Metadata } from "next";
import { Sora, Open_Sans, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Header } from "@/components/branding/Header";
import { Footer } from "@/components/branding/Footer";
import { CookieBanner } from "@/components/branding/CookieBanner";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com"
  ),
  title: {
    default: "La Liga Qanvit · La liga de startups de España",
    template: "%s · La Liga Qanvit",
  },
  description:
    "Sube tu deck. Recibe feedback de expertos. Entra en la clasificación nacional de startups por División y Vertical.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com",
    siteName: "La Liga Qanvit",
    title: "La Liga Qanvit · La liga de startups de España",
    description:
      "Sube tu deck. Recibe feedback de expertos. Entra en la clasificación nacional.",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@qanvit",
    creator: "@qanvit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${sora.variable} ${openSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
          <TooltipProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
            <Toaster richColors position="bottom-right" />
            <CookieBanner />
          </TooltipProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
