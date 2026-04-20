import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import DeckErrorActions from "./DeckErrorActions";

export const metadata: Metadata = { title: "Deck Errors — Admin" };
export const revalidate = 0;

type ErrorDeck = {
  id: string;
  version: number;
  file_size_bytes: number;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
  startup_id: string;
  startup_name: string | null;
  startup_slug: string | null;
};

export default async function DeckErrorsPage() {
  const supabase = createClient();

  // Fetch error decks, then join startup info manually to avoid type issues with nested select
  const { data: errorDecks } = await supabase
    .from("decks")
    .select("id, version, file_size_bytes, error_message, uploaded_at, processed_at, startup_id")
    .eq("status", "error")
    .order("uploaded_at", { ascending: false })
    .limit(100);

  let rows: ErrorDeck[] = [];

  if (errorDecks && errorDecks.length > 0) {
    const startupIds = Array.from(new Set(errorDecks.map((d) => d.startup_id)));
    const { data: startups } = await supabase
      .from("startups")
      .select("id, name, slug")
      .in("id", startupIds);

    const startupMap = new Map(startups?.map((s) => [s.id, s]) ?? []);

    rows = errorDecks.map((deck) => {
      const startup = startupMap.get(deck.startup_id);
      return {
        ...deck,
        startup_name: startup?.name ?? null,
        startup_slug: startup?.slug ?? null,
      };
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-sora font-bold text-2xl text-brand-navy">Deck Errors</h1>
        <p className="font-body text-ink-secondary text-sm mt-1">
          {rows.length} deck{rows.length !== 1 ? "s" : ""} con errores de evaluación
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-card border border-border-soft p-12 text-center">
          <p className="font-mono text-ink-secondary text-sm">{"{ no hay errores }"} — todo bien por aquí.</p>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-border-soft overflow-hidden shadow-card">
          {/* Header */}
          <div className="bg-brand-navy/5 px-6 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 text-xs font-semibold text-ink-secondary uppercase tracking-wider">
            <span>Startup</span>
            <span>Versión</span>
            <span className="hidden md:block">Fecha</span>
            <span className="hidden lg:block">Error</span>
            <span>Acciones</span>
          </div>

          {rows.map((deck) => (
            <div
              key={deck.id}
              className="px-6 py-4 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center border-t border-border-soft"
            >
              <div className="min-w-0">
                <p className="font-sora font-semibold text-sm text-brand-navy truncate">
                  {deck.startup_name ?? deck.startup_id}
                </p>
                <p className="font-mono text-xs text-ink-secondary">{deck.id.slice(0, 8)}…</p>
              </div>
              <span className="font-mono text-sm text-ink-secondary">v{deck.version}</span>
              <span className="hidden md:block font-body text-xs text-ink-secondary whitespace-nowrap">
                {new Date(deck.uploaded_at).toLocaleDateString("es-ES")}
              </span>
              <span className="hidden lg:block font-mono text-xs text-red-500 max-w-[200px] truncate">
                {deck.error_message ?? "—"}
              </span>
              <DeckErrorActions deckId={deck.id} startupSlug={deck.startup_slug} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
