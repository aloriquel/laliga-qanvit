"use client";

import { useEffect, useState } from "react";
import EcosystemBridgeBannerClient from "./EcosystemBridgeBannerClient";
import type { EcosystemOrgType } from "@/lib/ecosystem/owner";

type OrgPayload = { orgType: EcosystemOrgType; orgName: string } | null;

type Props = {
  variant?: "liga" | "dashboard";
  surface?: string;
};

/**
 * Client loader used on ISR/static pages (like /liga) where we cannot read
 * cookies() server-side without opting out of static generation. Fetches the
 * ecosystem-org context from /api/ecosystem/bridge after hydration.
 */
export default function EcosystemBridgeBannerLoader({ variant = "liga", surface }: Props) {
  const [org, setOrg] = useState<OrgPayload | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ecosystem/bridge", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { org: null }))
      .then((data: { org: OrgPayload }) => {
        if (!cancelled) setOrg(data.org);
      })
      .catch(() => {
        if (!cancelled) setOrg(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!org) return null;

  return (
    <EcosystemBridgeBannerClient
      orgType={org.orgType}
      orgName={org.orgName}
      variant={variant}
      surface={surface}
    />
  );
}
