// Criminal Intelligence Bureau (CIB) — pure selector/aggregation functions.
// No mutation of inputs, no Angular dependencies. Plain filter/reduce/map only.

import { CibBucket, CibFilters, CibIncident, CibMetrics, OffenceId, SuspectId } from './cib.model';

// Fixed display order for offence categories — never derived from the data,
// so a category with zero incidents still appears in offenceCounts().
const OFFENCE_ORDER: readonly OffenceId[] = [
  'snack-theft',
  'property-damage',
  'public-disturbance',
  'obstruction',
];

// Fixed display order for suspects — Le Criminel, then Pikette, then Sawito.
const SUSPECT_ORDER: readonly SuspectId[] = ['le-criminel', 'pikette', 'sawito'];

export function filterIncidents(
  rows: readonly CibIncident[],
  filters: CibFilters
): CibIncident[] {
  return rows.filter((row) => {
    const matchesSuspect = filters.suspect === 'all' || row.suspectIds.includes(filters.suspect);
    const matchesOffence = filters.offence === 'all' || row.offenceId === filters.offence;
    return matchesSuspect && matchesOffence;
  });
}

export function deriveMetrics(rows: readonly CibIncident[]): CibMetrics {
  const total = rows.length;
  const open = rows.filter((row) => row.status === 'open').length;
  const closed = total - open;
  const closureRate = total === 0 ? null : Math.round((100 * closed) / total);
  const peakHour = findPeakHour(rows);

  return { total, open, closureRate, peakHour };
}

function findPeakHour(rows: readonly CibIncident[]): number | null {
  if (rows.length === 0) {
    return null;
  }

  const countsByHour = new Map<number, number>();
  for (const row of rows) {
    countsByHour.set(row.hour, (countsByHour.get(row.hour) ?? 0) + 1);
  }

  let peakHour: number | null = null;
  let peakCount = 0;
  // Iterate hours ascending so the earliest hour wins ties.
  for (let hour = 0; hour <= 23; hour++) {
    const count = countsByHour.get(hour) ?? 0;
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  }

  return peakHour;
}

export function dailyCounts(
  rows: readonly CibIncident[],
  dates: readonly string[]
): CibBucket[] {
  return dates.map((date) => ({
    key: date,
    count: rows.filter((row) => row.date === date).length,
  }));
}

export function offenceCounts(rows: readonly CibIncident[]): CibBucket[] {
  return OFFENCE_ORDER.map((offenceId) => ({
    key: offenceId,
    count: rows.filter((row) => row.offenceId === offenceId).length,
  }));
}

export function hourlyCounts(rows: readonly CibIncident[]): CibBucket[] {
  const buckets: CibBucket[] = [];
  for (let hour = 0; hour <= 23; hour++) {
    buckets.push({
      key: String(hour),
      count: rows.filter((row) => row.hour === hour).length,
    });
  }
  return buckets;
}

export function suspectCounts(rows: readonly CibIncident[]): CibBucket[] {
  return SUSPECT_ORDER.map((suspectId) => ({
    key: suspectId,
    count: rows.filter((row) => row.suspectIds.includes(suspectId)).length,
  }));
}

export function sortIncidents(rows: readonly CibIncident[]): CibIncident[] {
  // Sort a copy — never mutate the input array.
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1; // date descending
    }
    if (a.hour !== b.hour) {
      return a.hour < b.hour ? 1 : -1; // hour descending
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; // ID ascending for deterministic ties
  });
}
