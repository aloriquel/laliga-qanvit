import { createClient } from "@/lib/supabase/server";

export type Award = {
  id: string;
  slug: string;
  name: string;
  organizer: string;
  organizer_url: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  brand_color: string | null;
  scope: string;
  start_year: number | null;
  active: boolean;
};

export type AwardEdition = {
  id: string;
  award_id: string;
  edition_year: number;
  edition_number: number | null;
  category_type: string;
  category_value: string;
  source_url: string | null;
};

export type AwardRecipient = {
  id: string;
  edition_id: string;
  result: "winner" | "finalist";
  company_name: string;
  company_name_normalized: string;
  company_website: string | null;
  company_domain_root: string | null;
  company_description_short: string | null;
  current_status: "active" | "acquired" | "closed" | "pivoted" | "unknown";
  current_status_evidence: string | null;
  current_status_updated_at: string | null;
  startup_id: string | null;
  source_url: string | null;
  source_type: string | null;
  external_id: string | null;
};

export type AwardWithCounts = Award & {
  recipients_total: number;
  editions_total: number;
};

export type RecipientWithEdition = AwardRecipient & {
  edition: AwardEdition;
  award: Award;
  startup_slug?: string | null;
  startup_name?: string | null;
};

function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient() as any;
}

export async function getAwards(): Promise<Award[]> {
  const sb = getClient();
  const { data } = await sb.from("awards").select("*").order("name");
  return (data ?? []) as Award[];
}

export async function getAwardBySlug(slug: string): Promise<Award | null> {
  const sb = getClient();
  const { data } = await sb.from("awards").select("*").eq("slug", slug).maybeSingle();
  return (data as Award | null) ?? null;
}

export async function getGlobalStats() {
  const sb = getClient();
  const [recipientsRes, statusRes] = await Promise.all([
    sb.from("award_recipients").select("id", { count: "exact", head: true }),
    sb.from("award_recipients").select("current_status"),
  ]);
  const total = recipientsRes.count ?? 0;
  const status: Record<string, number> = {};
  for (const r of (statusRes.data ?? []) as Array<{ current_status: string }>) {
    status[r.current_status] = (status[r.current_status] ?? 0) + 1;
  }
  return {
    total,
    active: status.active ?? 0,
    acquired: status.acquired ?? 0,
    closed: status.closed ?? 0,
    pivoted: status.pivoted ?? 0,
    unknown: status.unknown ?? 0,
  };
}

export async function getAwardWithCounts(slug: string): Promise<AwardWithCounts | null> {
  const award = await getAwardBySlug(slug);
  if (!award) return null;
  const sb = getClient();
  const [editionsRes, recipientsRes] = await Promise.all([
    sb
      .from("award_editions")
      .select("id", { count: "exact", head: true })
      .eq("award_id", award.id),
    sb
      .from("award_recipients")
      .select("id, edition:award_editions!inner(award_id)", { count: "exact", head: true })
      .eq("edition.award_id", award.id),
  ]);
  return {
    ...award,
    editions_total: editionsRes.count ?? 0,
    recipients_total: recipientsRes.count ?? 0,
  };
}

export async function getRecipientsForAward(slug: string): Promise<RecipientWithEdition[]> {
  const award = await getAwardBySlug(slug);
  if (!award) return [];
  const sb = getClient();
  const { data } = await sb
    .from("award_recipients")
    .select(
      "*, edition:award_editions!inner(*), startup:startups(slug, name)"
    )
    .eq("edition.award_id", award.id)
    .order("edition(edition_year)", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    ...r,
    award,
    startup_slug: r.startup?.slug ?? null,
    startup_name: r.startup?.name ?? null,
  })) as RecipientWithEdition[];
}

export async function getRecipientById(id: string): Promise<RecipientWithEdition | null> {
  const sb = getClient();
  const { data } = await sb
    .from("award_recipients")
    .select(
      "*, edition:award_editions!inner(*, award:awards!inner(*)), startup:startups(slug, name)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;
  return {
    ...r,
    award: r.edition.award,
    startup_slug: r.startup?.slug ?? null,
    startup_name: r.startup?.name ?? null,
  } as RecipientWithEdition;
}

export type StartupAward = {
  recipient_id: string;
  award_slug: string;
  award_name: string;
  edition_year: number;
  edition_number: number | null;
  category_type: string;
  category_value: string;
  result: "winner" | "finalist";
};

export async function getStartupAwards(startupId: string): Promise<StartupAward[]> {
  const sb = getClient();
  const { data } = await sb.rpc("get_startup_awards", { p_startup_id: startupId });
  return (data ?? []) as StartupAward[];
}

export type SpotlightRecipient = {
  id: string;
  company_name: string;
  company_description_short: string | null;
  edition_year: number;
  category_value: string;
  result: "winner" | "finalist";
  current_status: string;
  award_slug: string;
  award_name: string;
};

export async function getSpotlightRecipients(limit = 5): Promise<SpotlightRecipient[]> {
  const sb = getClient();

  const { data: matched } = await sb
    .from("award_recipients")
    .select(
      "id, company_name, company_description_short, result, current_status, edition:award_editions!inner(edition_year, category_value, award:awards!inner(slug, name))"
    )
    .not("startup_id", "is", null)
    .limit(limit);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchedRows = ((matched ?? []) as any[]).map(toSpotlight);
  if (matchedRows.length >= limit) return matchedRows.slice(0, limit);

  const { data: actives } = await sb
    .from("award_recipients")
    .select(
      "id, company_name, company_description_short, result, current_status, edition:award_editions!inner(edition_year, category_value, award:awards!inner(slug, name))"
    )
    .eq("current_status", "active")
    .not("company_website", "is", null)
    .order("edition(edition_year)", { ascending: false })
    .limit(limit * 4);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidates = ((actives ?? []) as any[]).map(toSpotlight);

  const seen = new Set<number>();
  const mixed: SpotlightRecipient[] = [];
  const fallback: SpotlightRecipient[] = [];
  for (const r of candidates) {
    if (!seen.has(r.edition_year)) {
      seen.add(r.edition_year);
      mixed.push(r);
    } else {
      fallback.push(r);
    }
    if (mixed.length >= limit) break;
  }
  while (mixed.length < limit && fallback.length) {
    const next = fallback.shift();
    if (next) mixed.push(next);
  }

  return [...matchedRows, ...mixed].slice(0, limit);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSpotlight(r: any): SpotlightRecipient {
  return {
    id: r.id,
    company_name: r.company_name,
    company_description_short: r.company_description_short,
    edition_year: r.edition?.edition_year ?? 0,
    category_value: r.edition?.category_value ?? "",
    result: r.result,
    current_status: r.current_status,
    award_slug: r.edition?.award?.slug ?? "",
    award_name: r.edition?.award?.name ?? "",
  };
}
