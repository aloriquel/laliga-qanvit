import { getEcosystemOrgForCurrentUser } from "@/lib/ecosystem/owner";
import EcosystemBridgeBannerClient from "./EcosystemBridgeBannerClient";

type Props = {
  variant?: "liga" | "dashboard";
  surface?: string;
};

export default async function EcosystemBridgeBannerWrapper({
  variant = "liga",
  surface,
}: Props) {
  const ctx = await getEcosystemOrgForCurrentUser();
  if (!ctx) return null;

  return (
    <EcosystemBridgeBannerClient
      orgType={ctx.orgType}
      orgName={ctx.orgName}
      variant={variant}
      surface={surface}
    />
  );
}
