"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  identifyUser,
  resetIdentifiedUser,
  type AnalyticsRole,
  type AnalyticsUser,
} from "@/lib/analytics/identify";

/**
 * Mounts client-side and reacts to Supabase auth state to call
 * identifyUser / resetIdentifiedUser. Reads role from the `profiles` row and
 * tier from `ecosystem_totals` (only when role === 'ecosystem_org').
 *
 * Identification is a no-op when the user has not granted consent yet.
 */
export function AnalyticsIdentifier() {
  useEffect(() => {
    const supabase = createClient();

    let cancelled = false;

    async function fetchAndIdentify(userId: string, email: string | null) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled || !profile) return;

        const role: AnalyticsRole =
          profile.role === "admin"
            ? "admin"
            : profile.role === "ecosystem"
              ? "ecosystem_org"
              : "startup_founder";

        const u: AnalyticsUser = {
          id: userId,
          email: email ?? undefined,
          role,
        };

        if (role === "ecosystem_org") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sb = supabase as any;
          const { data: org } = await sb
            .from("ecosystem_organizations")
            .select("id")
            .eq("owner_id", userId)
            .maybeSingle();
          if (org?.id) {
            const { data: totals } = await sb
              .from("ecosystem_totals")
              .select("tier")
              .eq("org_id", org.id)
              .maybeSingle();
            if (totals?.tier === "rookie" || totals?.tier === "pro" || totals?.tier === "elite") {
              u.tier = totals.tier;
            }
          }
        }

        identifyUser(u);
      } catch {
        /* swallow — analytics never breaks UX */
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      void fetchAndIdentify(user.id, user.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          void fetchAndIdentify(session.user.id, session.user.email ?? null);
        } else {
          resetIdentifiedUser();
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
