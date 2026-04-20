export function formatDistanceToNow(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "0 días";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0 && hours > 0) return `${days} día${days !== 1 ? "s" : ""} y ${hours} hora${hours !== 1 ? "s" : ""}`;
  if (days > 0) return `${days} día${days !== 1 ? "s" : ""}`;
  return `${hours} hora${hours !== 1 ? "s" : ""}`;
}
