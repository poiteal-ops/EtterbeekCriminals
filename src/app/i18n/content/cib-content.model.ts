// Criminal Intelligence Bureau (CIB) — page content model.
//
// Every supported content locale supplies this complete shape, including
// every incident ID; the translation service does not deep-merge dictionaries.

import { CibIncidentCopy, OffenceId, SuspectId } from '../../pages/cib-bureau/cib.model';

export type { CibIncidentCopy };

export interface CibChartCopy {
  peakSummary: string;
  emptySummary: string;
  viewTable: string;
  fullData: string;
  category: string;
  incidents: string;
}

export interface CibContent {
  chart: CibChartCopy;
  title: string;
  subtitle: string;
  /** The "Fictional incident data..." disclaimer line. */
  archiveNote: string;
  /** e.g. "CASE ARCHIVE / JUL 2024–AUG 2026". */
  archiveWindowLabel: string;
  /** Plain SEO description string; wiring it into the SEO generator is a later task. */
  seoDescription: string;

  suspectFilterLabel: string;
  offenceFilterLabel: string;
  allSuspectsLabel: string;
  allOffencesLabel: string;
  resetLabel: string;
  /** Contains a literal "{count}" placeholder, substituted by the page component. */
  resultCountLabel: string;

  metricTotalLabel: string;
  metricOpenLabel: string;
  metricClosureRateLabel: string;
  metricPeakHourLabel: string;
  /** Shown in place of a null closure rate / peak hour — never render "null" or "NaN". */
  unavailableLabel: string;

  dailyChartTitle: string;
  dailyChartDescription: string;
  offenceChartTitle: string;
  offenceChartDescription: string;
  hourlyChartTitle: string;
  hourlyChartDescription: string;

  offenceLabels: Record<OffenceId, string>;
  statusLabels: Record<'open' | 'closed', string>;
  suspectLabels: Record<SuspectId, string>;
  relationshipLabels: Record<'allied' | 'rivals' | 'truce' | 'not-applicable', string>;

  /** One dossier description per suspect card, shown regardless of the active filter. */
  dossierDescriptions: Record<SuspectId, string>;
  /** Explains near the suspect cards that counts can exceed the incident total. */
  overlapNote: string;
  /** Status shown when a dossier remains visible before its next archive visit. */
  nextVisitLabel: string;

  showMoreLabel: string;
  viewDetailsLabel: string;
  hideDetailsLabel: string;
  viewCaseLabel: string;
  /** Shown in the expanded incident details in place of an image, when the incident has none. */
  noEvidenceLabel: string;

  emptyStateTitle: string;
  emptyStateBody: string;

  methodologyTitle: string;
  methodologyBody: string;

  /** Per-incident copy authored in Task 2's cib.data.ts — re-referenced here, not re-authored. */
  incidents: Record<string, CibIncidentCopy>;

  // Home-page teaser fields. This task defines them for completeness; wiring
  // them into home.html is a later task.
  cibKicker: string;
  cibTitle: string;
  cibBody: string;
  cibCta: string;
}
