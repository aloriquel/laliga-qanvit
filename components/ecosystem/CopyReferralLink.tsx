"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-white/10 px-4 py-2.5 rounded-xl text-sm font-mono text-white truncate">
        {url}
      </code>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-salmon text-brand-navy rounded-xl font-semibold text-sm font-body hover:bg-brand-salmon/90 transition-colors shrink-0"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
