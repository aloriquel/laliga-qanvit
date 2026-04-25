type Props = { result: "winner" | "finalist" | "beneficiary" };

export default function ResultBadge({ result }: Props) {
  if (result === "winner") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-sora font-semibold uppercase tracking-widest"
        style={{ background: "#c9a96e", color: "#1a1f3a" }}
      >
        🏆 Ganadora
      </span>
    );
  }
  if (result === "beneficiary") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-sora font-semibold uppercase tracking-widest border"
        style={{ borderColor: "#003F7F", color: "#9bb5d6" }}
        title="Beneficiaria de subvención pública"
      >
        Beneficiaria
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-sora font-semibold uppercase tracking-widest border"
      style={{ borderColor: "#c9a96e", color: "#e8d9b8" }}
    >
      Finalista
    </span>
  );
}
