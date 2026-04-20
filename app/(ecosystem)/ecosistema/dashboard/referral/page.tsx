import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CopyReferralLink from "@/components/ecosystem/CopyReferralLink";

export default async function ReferralPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ecosistema/aplicar");

  const { data: org } = await supabase
    .from("ecosystem_organizations")
    .select("id, referral_code")
    .eq("owner_id", user.id)
    .single();
  if (!org) redirect("/ecosistema/aplicar");

  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://laliga.qanvit.com"}/play?ref=${org.referral_code}`;

  // Get referral stats
  const { data: referredStartups } = await supabase
    .from("startups")
    .select("id, name, created_at")
    .eq("referred_by_org_id", org.id)
    .order("created_at", { ascending: false });

  const { data: referralPoints } = await supabase
    .from("ecosystem_points_log")
    .select("id, event_type, points, created_at")
    .eq("org_id", org.id)
    .in("event_type", ["startup_referred_signup", "startup_referred_top10", "startup_referred_phase_up"])
    .order("created_at", { ascending: false });

  const totalReferralPoints = (referralPoints ?? []).reduce((acc, p) => acc + p.points, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sora text-2xl font-bold text-brand-navy">Programa de referrals</h1>
        <p className="font-body text-ink-secondary mt-1">Refiere startups y gana puntos por cada hito que consigan.</p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-border-soft p-6">
        <h2 className="font-sora font-semibold text-brand-navy mb-4">Cómo funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { pts: 100, label: "Primera evaluación", desc: "Cuando la startup referida sube su primer deck." },
            { pts: 250, label: "Sube de fase", desc: "Cuando la startup referida asciende de división." },
            { pts: 500, label: "Top 10 vertical", desc: "Cuando la startup referida entra en el top 10 de su vertical." },
          ].map(({ pts, label, desc }) => (
            <div key={label} className="bg-brand-lavender rounded-xl p-4 text-center">
              <p className="font-sora text-3xl font-bold text-brand-salmon">+{pts}</p>
              <p className="font-sora font-semibold text-brand-navy text-sm mt-1">{label}</p>
              <p className="font-body text-xs text-ink-secondary mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral link */}
      <div className="bg-brand-navy rounded-2xl p-6 text-white">
        <p className="font-body text-white/60 text-sm mb-2">Tu enlace de referral</p>
        <CopyReferralLink url={referralUrl} />
        <p className="font-body text-white/40 text-xs mt-3">El código expira a los 180 días de uso.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border-soft p-5 text-center">
          <p className="font-sora text-4xl font-bold text-brand-navy">{(referredStartups ?? []).length}</p>
          <p className="font-body text-sm text-ink-secondary mt-1">Startups referidas</p>
        </div>
        <div className="bg-white rounded-2xl border border-border-soft p-5 text-center">
          <p className="font-sora text-4xl font-bold text-brand-salmon">{totalReferralPoints}</p>
          <p className="font-body text-sm text-ink-secondary mt-1">Puntos de referrals</p>
        </div>
      </div>

      {/* Referred startups list */}
      {(referredStartups ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-border-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border-soft">
            <h2 className="font-sora font-semibold text-brand-navy">Startups referidas</h2>
          </div>
          <ul className="divide-y divide-border-soft">
            {(referredStartups ?? []).map((s) => (
              <li key={s.id} className="px-5 py-3 flex items-center justify-between">
                <span className="font-body text-sm text-brand-navy">{s.name}</span>
                <span className="font-body text-xs text-ink-secondary">
                  {new Date(s.created_at).toLocaleDateString("es-ES")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
