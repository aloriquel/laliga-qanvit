type Props = {
  isRaising: boolean;
};

export default function RaisingBadge({ isRaising }: Props) {
  if (!isRaising) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-sora font-medium text-xs bg-green-50 text-green-800 border border-green-200">
      🟢 Levantando ronda
    </span>
  );
}
