import Link from "next/link";
import { Trophy } from "lucide-react";

import type { StartupAward } from "@/lib/awards/queries";

type Props = { awards: StartupAward[] };

export function StartupAwardsBadge({ awards }: Props) {
  if (awards.length === 0) return null;
  const single = awards.length === 1;
  const text = single
    ? `Premiada en ${awards[0].award_name} ${awards[0].edition_year}`
    : `${awards.length} premios`;
  return (
    <a
      href="#premios"
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-sora font-semibold border transition-colors"
      style={{
        background: "rgba(201,169,110,0.12)",
        borderColor: "#c9a96e",
        color: "#1a1f3a",
      }}
    >
      <Trophy size={14} style={{ color: "#1a1f3a" }} />
      <span>{text}</span>
    </a>
  );
}

export default function StartupAwardsSection({ awards }: Props) {
  if (awards.length === 0) return null;

  return (
    <section
      id="premios"
      className="bg-white rounded-card border border-border-soft p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={16} className="text-brand-navy/70" />
        <h2 className="font-sora font-bold text-lg text-brand-navy">
          Premios y reconocimientos
        </h2>
      </div>
      <div
        className="w-8 h-0.5 rounded-full mb-4"
        style={{ background: "#c9a96e" }}
      />
      <ul className="flex flex-col gap-3">
        {awards.map((a) => (
          <li
            key={a.recipient_id}
            className="flex flex-wrap items-center justify-between gap-2 border border-border-soft rounded-xl px-4 py-3"
          >
            <div>
              <p className="font-sora font-semibold text-sm text-brand-navy">
                <Link
                  href={`/premios/${a.award_slug}`}
                  className="hover:underline"
                >
                  {a.award_name}
                </Link>{" "}
                · {a.edition_year}
              </p>
              <p className="font-body text-xs text-ink-secondary mt-0.5">
                {a.category_value} ·{" "}
                <span className="font-semibold uppercase tracking-wider">
                  {a.result === "winner"
                    ? "Ganadora"
                    : a.result === "beneficiary"
                    ? "Beneficiaria"
                    : "Finalista"}
                </span>
              </p>
            </div>
            <Link
              href={`/premios/recipient/${a.recipient_id}`}
              className="font-body text-xs font-semibold hover:underline"
              style={{ color: "#1a1f3a" }}
            >
              Ver detalle →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
