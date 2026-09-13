// Criminal Intelligence Bureau (CIB) — archive and calculation layer types.
// Pure data types only; no Angular dependencies here.

export type SuspectId = 'le-criminel' | 'pikette' | 'sawito';

export type OffenceId =
  | 'snack-theft'
  | 'property-damage'
  | 'public-disturbance'
  | 'obstruction';

export interface CibIncident {
  readonly id: string; // CIB-001 through CIB-048; separate from blog CASE LOG IDs
  readonly date: string; // YYYY-MM-DD in the fixed archive
  readonly hour: number; // integer 0..23, fictional local wall-clock hour
  readonly suspectIds: readonly SuspectId[]; // one or more unique participants
  readonly duoRelationship: 'allied' | 'rivals' | 'truce' | 'not-applicable';
  readonly offenceId: OffenceId; // exactly one primary category
  readonly status: 'open' | 'closed';
  readonly image?: string; // public assets/images path, never a LocalPics path
  readonly storyRoute?: string; // existing internal route without locale prefix
}

export interface CibFilters {
  readonly suspect: SuspectId | 'all';
  readonly offence: OffenceId | 'all';
}

export interface CibMetrics {
  readonly total: number;
  readonly open: number;
  readonly closureRate: number | null; // percentage, rounded to nearest integer
  readonly peakHour: number | null;
}

export interface CibBucket {
  readonly key: string;
  readonly count: number;
}

export interface CibIncidentCopy {
  title: string;
  summary: string;
  imageAlt: string; // empty only when this incident has no image
}
