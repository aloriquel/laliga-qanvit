"use client";

import { useState } from "react";
import LogoUploader from "@/components/startup/LogoUploader";

type Props = {
  initialLogoUrl: string | null;
  startupName: string;
};

export default function LogoSection({ initialLogoUrl, startupName }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);

  return (
    <LogoUploader
      currentLogoUrl={logoUrl}
      startupName={startupName}
      onUploaded={(url) => setLogoUrl(url)}
      onRemoved={() => setLogoUrl(null)}
    />
  );
}
