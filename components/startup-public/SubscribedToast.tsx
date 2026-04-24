"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SubscribedToast() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

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
