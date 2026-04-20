"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/types";

type ChallengeStatus = Database["public"]["Enums"]["challenge_status"];
type Challenge = Database["public"]["Tables"]["challenges"]["Row"];

type Props = { challenge: Challenge };

const STATUS_OPTIONS: ChallengeStatus[] = ["draft", "voting", "approved", "active", "completed", "cancelled"];

const STATUS_COLORS: Record<ChallengeStatus, string> = {
  draft:     "bg-gray-100 text-gray-600",
  voting:    "bg-blue-100 text-blue-700",
  approved:  "bg-yellow-100 text-yellow-700",
  active:    "bg-green-100 text-green-700",
  completed: "bg-brand-lavender text-brand-navy",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminChallengeRow({ challenge }: Props) {
  const [status, setStatus] = useState<ChallengeStatus>(challenge.status);
  const [saving, setSaving] = useState(false);

  async function updateStatus(newStatus: ChallengeStatus) {
    setSaving(true);
    const res = await fetch(`/api/admin/challenges/${challenge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    if (res.ok) setStatus(newStatus);
  }

  return (
    <tr className="hover:bg-brand-lavender/20 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-brand-navy">{challenge.title}</p>
        <p className="text-xs text-ink-secondary mt-0.5 line-clamp-1">{challenge.description}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">
        {new Date(challenge.created_at).toLocaleDateString("es-ES")}
      </td>
      <td className="px-4 py-3">
        <select
          value={status}
          disabled={saving}
          onChange={(e) => updateStatus(e.target.value as ChallengeStatus)}
          className="text-xs font-body border border-border-soft rounded-lg px-2 py-1.5 bg-white focus:outline-none disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}
