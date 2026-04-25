"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

type Props = { startupSlug?: string };

export default function SubscribedToast({ startupSlug }: Props = {}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (startupSlug) {
      track(EVENTS.FOLLOW_CONFIRMATION_CLICKED, {
        startup_slug: startupSlug,
        // Backend would need to thread the actual delta; client cannot know
        // when the email was sent. Conservative default keeps the funnel
        // queryable; a future iteration can pass it as URL param.
        hours_to_confirm: 0,
      });
    }
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [startupSlug]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-navy text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 font-body text-sm"
    >
      <CheckCircle2 size={16} className="text-brand-salmon" />
      <span>Suscripción confirmada</span>
    </div>
  );
}
