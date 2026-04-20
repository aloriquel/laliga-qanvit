import type { Metadata } from "next";
import { Sora, Open_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/branding/Header";
import { Footer } from "@/components/branding/Footer";
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
  title: {
    default: "La Liga Qanvit — La liga de startups de España",
    template: "%s | La Liga Qanvit",
  },
  description:
    "Sube tu deck. Recibe feedback experto automatizado. Entra en la clasificación nacional de startups españolas.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com"
  ),
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com",
    siteName: "La Liga Qanvit",
    title: "La Liga Qanvit — La liga de startups de España",
    description:
      "Sube tu deck. Recibe feedback experto automatizado. Entra en la clasificación nacional.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@qanvit",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${openSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground font-body antialiased">
        <TooltipProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
