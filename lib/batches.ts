import { createServiceClient } from "@/lib/supabase/server";
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
