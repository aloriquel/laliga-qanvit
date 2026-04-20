import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminChallengeRow from "@/components/admin/AdminChallengeRow";

export default async function AdminChallengesPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/");

  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-sora text-2xl font-bold text-brand-navy">Gestión de retos</h1>

      {!challenges || challenges.length === 0 ? (
        <p className="text-ink-secondary font-body">No hay retos aún.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-border-soft overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border-soft bg-brand-lavender/50">
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Título</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-navy hidden md:table-cell">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {challenges.map((c) => (
                <AdminChallengeRow key={c.id} challenge={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
