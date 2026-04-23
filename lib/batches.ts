import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// ── Pure helpers (safe to import anywhere) ────────────────────────────────────

export const CURRENT_BATCH_STATUSES = ['active', 'upcoming'] as const;
export const DECK_UPLOAD_LIMIT_PER_BATCH = 2;

export type BatchStatus = 'upcoming' | 'active' | 'closed' | 'archived';
export type BatchQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q0_HISTORICO';

export type Batch = {
  id: string;
  slug: string;
  quarter: BatchQuarter;
  year: number;
  display_name: string;
  starts_at: string;
  ends_at: string;
  status: BatchStatus;
  closed_at: string | null;
  winners_computed_at: string | null;
};

export function batchDisplayLabel(quarter: BatchQuarter, year: number): string {
  if (quarter === 'Q0_HISTORICO') return 'Batch 0 (Histórico)';
  return `${quarter} ${year}`;
}

/** Returns true when the batch is the pre-launch warm-up period (never gets winners). */
export function isPreLaunchBatch(batch: Batch): boolean {
  if (batch.quarter !== 'Q0_HISTORICO') return false;
  if (!batch.winners_computed_at) return false;
  return new Date(batch.winners_computed_at).getFullYear() === 1970;
}

export function batchSlug(quarter: BatchQuarter, year: number): string {
  if (quarter === 'Q0_HISTORICO') return 'batch-0-historico';
  return `${quarter.toLowerCase()}-${year}`;
}

// ── Server-only DB functions (import only in Server Components / API Routes) ──

type BatchRow = Database["public"]["Tables"]["batches"]["Row"];

function toBatch(row: BatchRow): Batch {
  return {
    id: row.id,
    slug: row.slug,
    quarter: row.quarter as BatchQuarter,
    year: row.year,
    display_name: row.display_name,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status as BatchStatus,
    closed_at: row.closed_at,
    winners_computed_at: row.winners_computed_at,
  };
}

export async function getActiveBatch(): Promise<Batch | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("batches")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  return data ? toBatch(data) : null;
}

export async function getBatchBySlug(slug: string): Promise<Batch | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("batches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? toBatch(data) : null;
}

/** Returns the next upcoming non-Q0_HISTORICO batch (i.e. the first official batch). */
export async function getNextUpcomingBatch(): Promise<Batch | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("batches")
    .select("*")
    .eq("status", "upcoming")
    .neq("quarter", "Q0_HISTORICO" as BatchQuarter)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ? toBatch(data) : null;
}

/** Returns the batch to display in the leaderboard.
 *  Priority: explicit slug → active batch → most recent closed non-Q0_HISTORICO → null. */
export async function getBatchForLeaderboard(slug?: string | null): Promise<Batch | null> {
  if (slug) return getBatchBySlug(slug);
  const active = await getActiveBatch();
  if (active) return active;
  const service = createServiceClient();
  const { data } = await service
    .from("batches")
    .select("*")
    .eq("status", "closed")
    .neq("quarter", "Q0_HISTORICO" as BatchQuarter)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toBatch(data) : null;
}

/** Count non-archived decks a startup has uploaded within a given batch date range. */
export async function getDeckCountForStartupInBatch(
  startupId: string,
  batchStartsAt: string,
  batchEndsAt: string,
): Promise<number> {
  const service = createServiceClient();
  const { count } = await service
    .from("decks")
    .select("id", { count: "exact", head: true })
    .eq("startup_id", startupId)
    .neq("status", "archived")
    .gte("uploaded_at", batchStartsAt)
    .lt("uploaded_at", batchEndsAt);
  return count ?? 0;
}

/** Pure countdown helper — days + hours remaining until a target date. */
export function getTimeToDeadline(
  targetDate: string | Date,
  now: Date = new Date(),
): { days: number; hours: number; expired: boolean } {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { days: 0, hours: 0, expired: true };
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, expired: false };
}

export type CountdownLabel = {
  label: string;
  sublabel: string | null;
  target: string;
  is_urgent: boolean;
};

function formatEsMadrid(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Derives the countdown label/sublabel/target for a batch based on its status. */
export function getCountdownLabel(
  batch: Batch,
  nextBatch?: Batch | null,
): CountdownLabel {
  const preLaunch = isPreLaunchBatch(batch);
  if (preLaunch && nextBatch) {
    const { days, hours, expired } = getTimeToDeadline(nextBatch.starts_at);
    return {
      label: expired ? 'en cierre…' : `${days}d ${hours}h`,
      sublabel: `${nextBatch.display_name} arranca el ${formatEsMadrid(nextBatch.starts_at)}`,
      target: nextBatch.starts_at,
      is_urgent: !expired && days < 2,
    };
  }
  if (batch.status === 'upcoming') {
    const { days, hours, expired } = getTimeToDeadline(batch.starts_at);
    return {
      label: expired ? 'arrancando…' : `${days}d ${hours}h`,
      sublabel: `${batch.display_name} arranca el ${formatEsMadrid(batch.starts_at)}`,
      target: batch.starts_at,
      is_urgent: !expired && days < 2,
    };
  }
  if (batch.status === 'active') {
    const { days, hours, expired } = getTimeToDeadline(batch.ends_at);
    return {
      label: expired ? 'en cierre…' : `${days}d ${hours}h`,
      sublabel: `${batch.display_name} cierra el ${formatEsMadrid(batch.ends_at)}`,
      target: batch.ends_at,
      is_urgent: !expired && days < 2,
    };
  }
  return {
    label: 'cerrado',
    sublabel: batch.closed_at ? `Cerrado el ${formatEsMadrid(batch.closed_at)}` : null,
    target: batch.ends_at,
    is_urgent: false,
  };
}

/** True if at least one batch has been closed with winners computed. */
export async function hasAnyClosedBatchWithWinners(): Promise<boolean> {
  const service = createServiceClient();
  const { count } = await service
    .from('batch_winners')
    .select('id', { count: 'exact', head: true });
  return (count ?? 0) > 0;
}

export type ChampionBadgeData = {
  id: string;
  category: string;
  segment_key: string | null;
  final_score: number;
  batch: {
    slug: string;
    display_name: string;
    quarter: BatchQuarter;
    year: number;
    status: BatchStatus;
  };
};

/** All public champion badges for a startup (only from closed/archived batches). */
export async function getChampionBadgesForStartup(
  startupId: string,
): Promise<ChampionBadgeData[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('batch_winners')
    .select('id, category, segment_key, final_score, created_at, batches!inner(slug, display_name, quarter, year, status)')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .filter((w) => ['closed', 'archived'].includes(w.batches.status))
    .map((w) => ({
      id: w.id,
      category: w.category,
      segment_key: w.segment_key,
      final_score: Number(w.final_score),
      batch: {
        slug: w.batches.slug,
        display_name: w.batches.display_name,
        quarter: w.batches.quarter as BatchQuarter,
        year: w.batches.year,
        status: w.batches.status as BatchStatus,
      },
    }));
}

/** Next quarter start date for display purposes (pure computation). */
export function calculateNextBatchStart(quarter: BatchQuarter, year: number): Date {
  if (quarter === 'Q0_HISTORICO') return new Date(`${year + 1}-01-01T00:00:00`);
  const STARTS: Record<string, string> = {
    Q1: `${year}-04-01T00:00:00+02:00`,
    Q2: `${year}-07-01T00:00:00+02:00`,
    Q3: `${year}-10-01T00:00:00+02:00`,
    Q4: `${year + 1}-01-01T00:00:00+01:00`,
  };
  return new Date(STARTS[quarter]);
}
