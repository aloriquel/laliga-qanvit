import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { isChallengeActive, isChallengeVoting, OBJECTIVE_LABELS } from "@/lib/ecosystem/challenge-logic";
import ChallengeVoteButton from "@/components/ecosystem/ChallengeVoteButton";
import type { Database } from "@/lib/supabase/types";

type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];

export default async function RetosPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!org) redirect("/ecosistema/aplicar");

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, title, description, objective_type, objective_params, duration_days, prize_structure, status, voting_starts_at, voting_ends_at, active_starts_at, active_ends_at")
    .in("status", ["voting", "approved", "active", "completed"])
    .order("created_at", { ascending: false });

  const { data: myVotes } = await supabase
    .from("challenge_votes")
    .select("challenge_id")
    .eq("org_id", org.id);

  const votedIds = new Set((myVotes ?? []).map((v) => v.challenge_id));

  const active = (challenges ?? []).filter((c) => isChallengeActive(c as ChallengeRow));
  const voting = (challenges ?? []).filter((c) => isChallengeVoting(c as ChallengeRow));
  const completed = (challenges ?? []).filter((c) => c.status === "completed");

  function prizeTop(prize: Record<string, number>) {
    return Math.max(...Object.values(prize), 0);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sora text-2xl font-bold text-brand-navy">Retos comunitarios</h1>
          <p className="font-body text-ink-secondary mt-1">Compite con el ecosistema y gana puntos extra.</p>
        </div>
        <Link
          href="/ecosistema/dashboard/retos/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-salmon text-brand-navy rounded-xl font-semibold text-sm font-body hover:bg-brand-salmon/90 transition-colors"
        >
          <Plus size={16} />
          Proponer reto
        </Link>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <section>
          <h2 className="font-sora font-semibold text-brand-navy mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-brand-salmon" />
            En curso
          </h2>
          <div className="grid gap-4">
            {active.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-brand-salmon/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sora font-bold text-brand-navy">{c.title}</p>
                    <p className="font-body text-sm text-ink-secondary mt-1">{c.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-brand-lavender text-brand-navy text-xs font-body px-2 py-0.5 rounded-full">
                        {OBJECTIVE_LABELS[c.objective_type]}
                      </span>
                      <span className="bg-brand-lavender text-brand-navy text-xs font-body px-2 py-0.5 rounded-full">
                        {c.duration_days} días
                      </span>
                      {c.active_ends_at && (
                        <span className="bg-brand-lavender text-brand-navy text-xs font-body px-2 py-0.5 rounded-full">
                          Termina {new Date(c.active_ends_at).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body text-xs text-ink-secondary">Premio máx.</p>
                    <p className="font-sora font-bold text-brand-salmon text-xl">{prizeTop(c.prize_structure as Record<string, number>)} pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Voting */}
      {voting.length > 0 && (
        <section>
          <h2 className="font-sora font-semibold text-brand-navy mb-3">En votación</h2>
          <div className="grid gap-4">
            {voting.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-border-soft p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-sora font-bold text-brand-navy">{c.title}</p>
                    <p className="font-body text-sm text-ink-secondary mt-1">{c.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="bg-brand-lavender text-brand-navy text-xs font-body px-2 py-0.5 rounded-full">
                        {OBJECTIVE_LABELS[c.objective_type]}
                      </span>
                    </div>
                  </div>
                  <ChallengeVoteButton
                    challengeId={c.id}
                    alreadyVoted={votedIds.has(c.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="font-sora font-semibold text-brand-navy mb-3">Completados</h2>
          <div className="grid gap-3">
            {completed.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-border-soft p-4 opacity-70">
                <p className="font-sora font-semibold text-brand-navy">{c.title}</p>
                <p className="font-body text-xs text-ink-secondary mt-1">Completado</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && voting.length === 0 && completed.length === 0 && (
        <div className="bg-white rounded-2xl border border-border-soft p-12 text-center">
          <Trophy size={32} className="text-brand-salmon mx-auto mb-3" />
          <p className="font-body text-ink-secondary">No hay retos activos. ¡Propón el primero!</p>
        </div>
      )}
    </div>
  );
}
