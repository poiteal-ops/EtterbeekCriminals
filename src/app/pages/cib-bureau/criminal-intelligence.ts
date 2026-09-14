import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslationService } from '../../services/translation.service';
import { CibChart, CibChartBucket } from './cib-chart';
import { CIB_ARCHIVE_DATES, CIB_INCIDENTS } from './cib.data';
import { CibFilters, CibIncident, OffenceId, SuspectId } from './cib.model';
import {
  dailyCounts,
  deriveMetrics,
  filterIncidents,
  hourlyCounts,
  offenceCounts,
  sortIncidents,
  suspectCounts,
} from './cib-selectors';

const VISIBLE_STEP = 6;

const OFFENCE_OPTIONS: readonly OffenceId[] = [
  'snack-theft',
  'property-damage',
  'public-disturbance',
  'obstruction',
];

const SUSPECT_OPTIONS: readonly SuspectId[] = ['le-criminel', 'pikette', 'sawito'];

// Corrected dossier image assignment (see task-3-context.md — overrides the
// plan's section 5 table for these page-level dossier/duo images).
const SUSPECT_DOSSIER_IMAGES: Record<SuspectId, string> = {
  'le-criminel': 'assets/images/dog-floor-portrait.jpg',
  pikette: 'assets/images/pikette-couch-visit.jpg',
  sawito: 'assets/images/sawito-dog-selfie.jpg',
};

interface SuspectCardData {
  readonly id: SuspectId;
  readonly label: string;
  readonly dossier: string;
  readonly image: string;
  readonly count: number;
}

function maxCount(buckets: readonly CibChartBucket[]): number {
  return buckets.reduce((max, bucket) => Math.max(max, bucket.count), 0);
}

@Component({
  selector: 'app-criminal-intelligence',
  imports: [RouterLink, CibChart],
  templateUrl: './criminal-intelligence.html',
  styleUrl: './criminal-intelligence.scss',
})
export class CriminalIntelligence {
  protected readonly translation = inject(TranslationService);

  // Filter/UI state lives only here (page memory) — no persistence of any kind.
  protected readonly filters = signal<CibFilters>({ suspect: 'all', offence: 'all' });
  protected readonly visibleCount = signal(VISIBLE_STEP);
  protected readonly expandedIncidentId = signal<string | null>(null);

  protected readonly offenceOptions = OFFENCE_OPTIONS;
  protected readonly suspectOptions = SUSPECT_OPTIONS;

  // The single source of truth all summary values, charts, profile counts and
  // the feed are derived from.
  protected readonly filteredIncidents = computed<readonly CibIncident[]>(() =>
    filterIncidents(CIB_INCIDENTS, this.filters()),
  );

  protected readonly metrics = computed(() => deriveMetrics(this.filteredIncidents()));

  protected readonly sortedIncidents = computed<readonly CibIncident[]>(() =>
    sortIncidents(this.filteredIncidents()),
  );

  protected readonly visibleIncidents = computed<readonly CibIncident[]>(() =>
    this.sortedIncidents().slice(0, this.visibleCount()),
  );

  protected readonly hasMore = computed(
    () => this.visibleCount() < this.sortedIncidents().length,
  );

  protected readonly resultCountText = computed(() =>
    this.translation
      .t()
      .cib.resultCountLabel.replace('{count}', String(this.filteredIncidents().length)),
  );

  protected readonly closureRateText = computed(() => {
    const rate = this.metrics().closureRate;
    return rate === null ? this.translation.t().cib.unavailableLabel : `${rate}%`;
  });

  protected readonly peakHourText = computed(() => {
    const hour = this.metrics().peakHour;
    return hour === null
      ? this.translation.t().cib.unavailableLabel
      : `${String(hour).padStart(2, '0')}:00`;
  });

  // Counts mean involvement in the filtered incidents, accomplices included,
  // so they can overlap — never derived from the unfiltered archive.
  protected readonly suspectCards = computed<readonly SuspectCardData[]>(() => {
    const t = this.translation.t().cib;
    const counts = suspectCounts(this.filteredIncidents());
    const countById = new Map(counts.map((bucket) => [bucket.key as SuspectId, bucket.count]));
    return this.suspectOptions.map((id) => ({
      id,
      label: t.suspectLabels[id],
      dossier: t.dossierDescriptions[id],
      image: SUSPECT_DOSSIER_IMAGES[id],
      count: countById.get(id) ?? 0,
    }));
  });

  protected readonly dailyBuckets = computed<readonly CibChartBucket[]>(() =>
    dailyCounts(this.filteredIncidents(), CIB_ARCHIVE_DATES).map((bucket) => ({
      key: bucket.key,
      label: new Intl.DateTimeFormat(this.translation.locale(), {
        day: 'numeric', month: 'short', timeZone: 'UTC',
      }).format(new Date(`${bucket.key}T00:00:00Z`)),
      count: bucket.count,
    })),
  );

  protected readonly dailyMaximum = computed(() => maxCount(this.dailyBuckets()));

  protected readonly offenceBuckets = computed<readonly CibChartBucket[]>(() => {
    const t = this.translation.t().cib;
    return offenceCounts(this.filteredIncidents()).map((bucket) => ({
      key: bucket.key,
      label: t.offenceLabels[bucket.key as OffenceId],
      count: bucket.count,
    }));
  });

  protected readonly offenceMaximum = computed(() => maxCount(this.offenceBuckets()));

  protected readonly hourlyBuckets = computed<readonly CibChartBucket[]>(() =>
    hourlyCounts(this.filteredIncidents()).map((bucket) => ({
      key: bucket.key,
      label: `${bucket.key}:00`,
      count: bucket.count,
    })),
  );

  protected readonly hourlyMaximum = computed(() => maxCount(this.hourlyBuckets()));

  protected setSuspectFilter(suspect: SuspectId | 'all'): void {
    this.applyFilters({ ...this.filters(), suspect });
  }

  protected setOffenceFilter(offence: OffenceId | 'all'): void {
    this.applyFilters({ ...this.filters(), offence });
  }

  protected onSuspectSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SuspectId | 'all';
    this.setSuspectFilter(value);
  }

  protected onOffenceSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as OffenceId | 'all';
    this.setOffenceFilter(value);
  }

  protected resetFilters(): void {
    this.applyFilters({ suspect: 'all', offence: 'all' });
  }

  protected showMore(): void {
    this.visibleCount.update((count) => count + VISIBLE_STEP);
  }

  protected toggleExpanded(id: string): void {
    this.expandedIncidentId.update((current) => (current === id ? null : id));
  }

  // Single write path for both the <select> controls and the suspect-card
  // buttons: whichever one changes a filter, visibleCount/expandedIncidentId
  // reset the same way.
  private applyFilters(next: CibFilters): void {
    this.filters.set(next);
    this.visibleCount.set(VISIBLE_STEP);
    this.expandedIncidentId.set(null);
  }
}
