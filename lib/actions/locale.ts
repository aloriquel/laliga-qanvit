"use server";

import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

export async function setLocaleAction(locale: string) {
  const valid = (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", valid, {
    path: "/",
    maxAge: 365 * 24 * 3600,
    sameSite: "lax",
  });
}
