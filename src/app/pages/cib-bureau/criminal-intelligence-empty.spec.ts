import { provideHttpClient } from '@angular/common/http';
import { Component, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';

import { CibChart } from './cib-chart';
import { CriminalIntelligence } from './criminal-intelligence';
import { dailyCounts } from './cib-selectors';
import { CIB_ARCHIVE_DATES, CIB_INCIDENTS } from './cib.data';
import { CibIncident } from './cib.model';

// The real 48-incident fixed archive deliberately covers every
// suspect x offence combination at least once (verified while writing this
// suite — every one of the 12 combinations has between 1 and 9 matches), so
// the zero-match state (rule 8) can never be reached by driving the real
// component's filters through its public API. This repo's Angular/Vitest
// integration also refuses `vi.mock` for relative imports ("Please use
// Angular TestBed for mocking dependencies"), so the data module can't be
// swapped that way either.
//
// Instead, this harness subclasses the real component and overrides only
// `filteredIncidents` — the single computed every other summary/chart/feed
// value is derived from — to always resolve to an empty list. Every other
// computed (`metrics`, `sortedIncidents`, `suspectCards`, the chart buckets,
// etc.) still runs its real, unmodified logic against that empty input, so
// this exercises the actual production null/zero-handling code, not a
// reimplementation of it.
@Component({
  selector: 'app-criminal-intelligence-empty-harness',
  imports: [RouterLink, CibChart],
  templateUrl: './criminal-intelligence.html',
  styleUrl: './criminal-intelligence.scss',
})
class CriminalIntelligenceEmptyHarness extends CriminalIntelligence {
  protected override readonly filteredIncidents = computed<readonly CibIncident[]>(() => []);
}

function createComponent() {
  TestBed.configureTestingModule({
    imports: [CriminalIntelligenceEmptyHarness],
    providers: [provideHttpClient(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(CriminalIntelligenceEmptyHarness);
  fixture.detectChanges();
  return fixture;
}

describe('CriminalIntelligence — zero-match rendering (rule 8)', () => {
  it('produces zero counts, null-safe metric text, and an empty-feed message with a reset path', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    expect(instance['filteredIncidents']().length).toBe(0);
    expect(instance['metrics']()).toEqual({ total: 0, open: 0, closureRate: null, peakHour: null });
    expect(instance['closureRateText']()).toBe(instance['translation'].t().cib.unavailableLabel);
    expect(instance['peakHourText']()).toBe(instance['translation'].t().cib.unavailableLabel);

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toMatch(/\bNaN\b/);
    expect(text).not.toMatch(/\bnull\b/i);

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.incident-card')).toBeNull();

    // The empty state offers a way back — reset restores the real archive's
    // full count on the base (non-harness) component, but here we only need
    // to confirm the button calls resetFilters() without throwing and the
    // filters end up back at 'all'/'all'.
    const resetButton = emptyState.querySelector('button') as HTMLButtonElement;
    resetButton.click();
    fixture.detectChanges();
    expect(instance['filters']()).toEqual({ suspect: 'all', offence: 'all' });
  });

  it('still renders labelled, zero-filled charts and never a broken image with no matches', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    expect(instance['dailyBuckets']().length).toBe(28);
    expect(instance['dailyBuckets']().every((b) => b.count === 0)).toBe(true);
    expect(instance['offenceBuckets']().length).toBe(4);
    expect(instance['hourlyBuckets']().length).toBe(24);
    // Final whole-branch review, Finding 1: the chart ceiling is a fixed
    // full-archive value, so it must stay pinned to the real archive's daily
    // maximum here too — never collapse to 0 just because this harness's
    // filtered set is empty (that would also make the old NaN-guard
    // assertion this replaced trivially true for the wrong reason).
    const fullArchiveDailyMax = Math.max(
      ...dailyCounts(CIB_INCIDENTS, CIB_ARCHIVE_DATES).map((bucket) => bucket.count),
    );
    expect(fullArchiveDailyMax).toBeGreaterThan(0);
    expect(instance['dailyMaximum']()).toBe(fullArchiveDailyMax);

    const charts = fixture.nativeElement.querySelectorAll('app-cib-chart') as NodeListOf<HTMLElement>;
    expect(charts.length).toBe(3);
    for (const chart of charts) expect(chart.querySelector('svg rect.bar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img[src=""]')).toBeNull();
    expect((fixture.nativeElement.textContent as string)).not.toMatch(/\bNaN\b/);
  });
});
