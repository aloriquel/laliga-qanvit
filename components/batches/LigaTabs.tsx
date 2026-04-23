import Link from "next/link";

type Props = {
  activeTab: "actual" | "historial";
};

export default function LigaTabs({ activeTab }: Props) {
  const tab = (key: "actual" | "historial", href: string, label: string) => {
    const isActive = activeTab === key;
    return (
      <Link
        href={href}
        className={
          isActive
            ? "font-sora font-semibold text-brand-navy border-b-2 border-brand-salmon pb-2 px-1"
            : "font-sora font-medium text-ink-secondary hover:text-brand-navy pb-2 px-1 border-b-2 border-transparent transition-colors"
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex items-center gap-6 mb-8 border-b border-border-soft">
      {tab("actual", "/liga", "Liga actual")}
      {tab("historial", "/liga/historial", "Hall of Fame")}
    </div>
  );
}
