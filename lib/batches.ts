export const CURRENT_BATCH_STATUSES = ['active', 'upcoming'] as const;

export type BatchStatus = 'upcoming' | 'active' | 'closed' | 'archived';
export type BatchQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q0_HISTORICO';

export function batchDisplayLabel(quarter: BatchQuarter, year: number): string {
  if (quarter === 'Q0_HISTORICO') return 'Batch 0 (Histórico)';
  return `${quarter} ${year}`;
}

export function batchSlug(quarter: BatchQuarter, year: number): string {
  if (quarter === 'Q0_HISTORICO') return 'batch-0-historico';
  return `${quarter.toLowerCase()}-${year}`;
}

// Placeholder — la lógica real de obtener el batch activo se implementa
// en PROMPT_12B contra la DB (requiere tipos regenerados post-0038).
