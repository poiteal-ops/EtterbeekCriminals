import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EN_CONTENT } from '../../i18n/content/en.content';
import { TranslationService } from '../../services/translation.service';
import { CriminalIntelligence } from './criminal-intelligence';
import { filterIncidents, hourlyCounts, monthlyCounts, offenceCounts } from './cib-selectors';
import { CIB_ARCHIVE_MONTHS, CIB_INCIDENTS } from './cib.data';

// The zero-match feed state is covered separately in
// criminal-intelligence-empty.spec.ts. Pikette has no August incidents, but
// her pending-visitation controls are deliberately disabled rather than used
// as an empty-state shortcut.

// Local mirror of the component's private maxCount() helper, used only to
// compute the expected full-archive ceiling independently in these tests.
function maxOf(buckets: readonly { count: number }[]): number {
  return buckets.reduce((max, bucket) => Math.max(max, bucket.count), 0);
}

function createComponent() {
  TestBed.configureTestingModule({
    imports: [CriminalIntelligence],
    providers: [provideHttpClient(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(CriminalIntelligence);
  fixture.detectChanges();
  return fixture;
}

describe('CriminalIntelligence', () => {
  it('presents Sawito as the secondary dossier while keeping his filter usable', () => {
    const fixture = createComponent();
    const secondary = fixture.nativeElement.querySelector('.suspect-card--secondary') as HTMLButtonElement;
    expect(secondary?.textContent).toContain('SAWITO');
    expect(secondary.querySelector('img')?.getAttribute('src')).toBe('assets/images/sawito-dossier.jpg');
    expect(fixture.nativeElement.querySelectorAll('.suspect-card:not(.suspect-card--secondary)')).toHaveLength(2);
    secondary.click();
    fixture.detectChanges();
    expect(secondary.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance['metrics']().total).toBe(6);
  });

  it('keeps Pikette historically filterable and shows her next visit', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;
    const cards = Array.from(
      fixture.nativeElement.querySelectorAll('.suspect-card') as NodeListOf<HTMLButtonElement>,
    );
    const piketteCard = cards.find((card) => card.textContent?.includes('PIKETTE'));
    const piketteOption = fixture.nativeElement.querySelector(
      '#cib-suspect-filter option[value="pikette"]',
    ) as HTMLOptionElement;

    expect(piketteCard).toBeDefined();
    expect(piketteCard?.disabled).toBe(false);
    expect(piketteCard?.classList.contains('suspect-card--pending')).toBe(false);
    expect(piketteCard?.textContent).toContain('NEXT VISIT: DECEMBER');
    expect(piketteOption.disabled).toBe(false);

    instance['setSuspectFilter']('pikette');
    expect(instance['filters']()).toEqual({ suspect: 'pikette', offence: 'all' });
    expect(instance['metrics']().total).toBe(10);
  });

  it('opens with all suspects/offences selected and six incidents visible', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    expect(instance['filters']()).toEqual({ suspect: 'all', offence: 'all' });
    expect(instance['visibleCount']()).toBe(6);
    expect(instance['expandedIncidentId']()).toBeNull();
    expect(instance['filteredIncidents']().length).toBe(CIB_INCIDENTS.length);
  });

  it('updates metrics and feed together when both filters are set', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    instance['setSuspectFilter']('le-criminel');
    instance['setOffenceFilter']('snack-theft');

    const expected = filterIncidents(CIB_INCIDENTS, { suspect: 'le-criminel', offence: 'snack-theft' });
    expect(instance['filters']()).toEqual({ suspect: 'le-criminel', offence: 'snack-theft' });
    expect(instance['filteredIncidents']().length).toBe(expected.length);
    expect(instance['metrics']().total).toBe(expected.length);
    expect(instance['sortedIncidents']().length).toBe(expected.length);
  });

  it('drives the suspect card click through the same filter state as the select', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    // Simulate the native <select> change event.
    instance['onSuspectSelectChange']({ target: { value: 'sawito' } } as unknown as Event);
    const afterSelect = instance['filters']();

    instance['resetFilters']();

    // Simulate the suspect-card button click, which calls the same setter.
    instance['setSuspectFilter']('sawito');
    const afterCardClick = instance['filters']();

    expect(afterSelect).toEqual({ suspect: 'sawito', offence: 'all' });
    expect(afterCardClick).toEqual(afterSelect);
  });

  it('reflects the active suspect filter as aria-pressed on the matching suspect card', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    instance['setSuspectFilter']('le-criminel');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.suspect-card') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
    const pressedStates = Array.from(buttons).map((button) => button.getAttribute('aria-pressed'));
    expect(pressedStates).toEqual(['true', 'false', 'false']);
  });

  it('resets both filters, visibleCount and expandedIncidentId together', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    instance['setSuspectFilter']('le-criminel');
    instance['showMore']();
    const firstVisibleId = instance['visibleIncidents']()[0]?.id;
    if (firstVisibleId) instance['toggleExpanded'](firstVisibleId);

    instance['resetFilters']();

    expect(instance['filters']()).toEqual({ suspect: 'all', offence: 'all' });
    expect(instance['visibleCount']()).toBe(6);
    expect(instance['expandedIncidentId']()).toBeNull();
  });

  it('resets visibleCount and expandedIncidentId when a filter changes', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    instance['showMore'](); // visibleCount -> 12
    const firstId = instance['sortedIncidents']()[0].id;
    instance['toggleExpanded'](firstId);
    expect(instance['visibleCount']()).toBe(12);
    expect(instance['expandedIncidentId']()).toBe(firstId);

    instance['setOffenceFilter']('obstruction');

    expect(instance['visibleCount']()).toBe(6);
    expect(instance['expandedIncidentId']()).toBeNull();
  });

  it('increases visibleCount by six per "show more" click, hiding it once all matches are visible', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;
    const total = instance['filteredIncidents']().length;

    expect(instance['visibleCount']()).toBe(6);

    let expectedVisible = 6;
    while (expectedVisible < total) {
      expect(instance['hasMore']()).toBe(true);
      instance['showMore']();
      expectedVisible += 6;
      expect(instance['visibleCount']()).toBe(expectedVisible);
    }

    expect(instance['hasMore']()).toBe(false);
  });

  it('shows no-evidence text directly and no evidence toggle when an incident has no image', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    const incidentWithoutImage = CIB_INCIDENTS.find((incident) => !incident.image);
    expect(incidentWithoutImage).toBeDefined();

    // Filter down to just that suspect/offence combo won't necessarily isolate
    // it, so expand it directly if it's within the initial visible window;
    // otherwise page through "show more" until it appears.
    let target = instance['visibleIncidents']().find((i) => i.id === incidentWithoutImage!.id);
    while (!target && instance['hasMore']()) {
      instance['showMore']();
      target = instance['visibleIncidents']().find((i) => i.id === incidentWithoutImage!.id);
    }
    expect(target).toBeDefined();

    fixture.detectChanges();

    const card = Array.from(fixture.nativeElement.querySelectorAll('.incident-card') as NodeListOf<HTMLElement>).find(
      (el) => el.textContent?.includes(incidentWithoutImage!.id),
    );
    expect(card?.querySelector('.details-toggle')).toBeNull();
    expect(card?.querySelector('.incident-details')).toBeNull();
    expect(card?.querySelector('.no-evidence')?.textContent?.trim()).toBe('NO EVIDENCE ON FILE');
  });

  // Final whole-branch review, Finding 1: chart axis ceilings must come from
  // the full archive, not the currently-filtered incidents, so a narrow
  // filter doesn't make its own smaller counts fill the whole chart.
  it('keeps chart maximums pinned to the full archive when a filter narrows the results', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    const fullArchiveMonthlyMax = maxOf(monthlyCounts(CIB_INCIDENTS, CIB_ARCHIVE_MONTHS));
    const fullArchiveOffenceMax = maxOf(offenceCounts(CIB_INCIDENTS));
    const fullArchiveHourlyMax = maxOf(hourlyCounts(CIB_INCIDENTS));

    // Baseline: at 'all'/'all' the filtered set *is* the full archive, so this
    // alone wouldn't distinguish correct from buggy behaviour.
    expect(instance['monthlyMaximum']()).toBe(fullArchiveMonthlyMax);
    expect(instance['offenceMaximum']()).toBe(fullArchiveOffenceMax);
    expect(instance['hourlyMaximum']()).toBe(fullArchiveHourlyMax);

    instance['setSuspectFilter']('sawito');
    fixture.detectChanges();

    // Sanity check: filtering to Sawito must actually shrink the real counts,
    // otherwise the assertions below would pass trivially either way.
    const filteredIncidents = instance['filteredIncidents']();
    const filteredHourlyMax = maxOf(hourlyCounts(filteredIncidents));
    expect(filteredHourlyMax).toBeLessThan(fullArchiveHourlyMax);

    expect(instance['monthlyMaximum']()).toBe(fullArchiveMonthlyMax);
    expect(instance['offenceMaximum']()).toBe(fullArchiveOffenceMax);
    expect(instance['hourlyMaximum']()).toBe(fullArchiveHourlyMax);

    // Also confirm the fixed ceiling reaches the chart itself, not just the
    // component's internal signal.
    const dailyChart = fixture.nativeElement.querySelectorAll('app-cib-chart')[0];
    expect(dailyChart).toBeDefined();
  });

  // Final whole-branch review, Finding 2: the feed must render the same
  // localized date format as the daily chart, and zero-pad the hour the same
  // way peakHourText already does.
  it('zero-pads a single-digit incident hour the same way peakHourText already does', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    expect(instance['formatIncidentHour'](7)).toBe('07:00');
    expect(instance['formatIncidentHour'](14)).toBe('14:00');
  });

  it('renders visible incident feed dates using the helper output, never the raw ISO string', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;

    const dateSpans = fixture.nativeElement.querySelectorAll('.incident-date') as NodeListOf<HTMLElement>;
    const visible = instance['visibleIncidents']();
    expect(dateSpans.length).toBe(visible.length);

    dateSpans.forEach((span, i) => {
      const incident = visible[i];
      const expectedDate = instance['formatIncidentDate'](incident.date);
      const expectedHour = instance['formatIncidentHour'](incident.hour);
      expect(span.textContent).toBe(`${expectedDate} · ${expectedHour}`);
      expect(span.textContent).not.toContain(incident.date);
    });
  });

  it('formats an incident date the same way the daily chart does, matching the active locale', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const translation = TestBed.inject(TranslationService);
    const activation = translation.activate('fr');
    TestBed.inject(HttpTestingController).expectOne('i18n/fr.json').flush(EN_CONTENT);
    await activation;

    const fixture = TestBed.createComponent(CriminalIntelligence);
    fixture.detectChanges();
    const instance = fixture.componentInstance;

    const expected = new Intl.DateTimeFormat('fr', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date('2026-08-01T00:00:00Z'));

    expect(instance['formatIncidentDate']('2026-08-01')).toBe(expected);
    expect(instance['formatIncidentDate']('2026-08-01')).not.toBe('2026-08-01');
  });

  it('formats archive month labels with month and two-digit year in the active locale', () => {
    const fixture = createComponent();
    const instance = fixture.componentInstance;
    const expected = new Intl.DateTimeFormat('en', {
      month: 'short', year: '2-digit', timeZone: 'UTC',
    }).format(new Date('2024-07-01T00:00:00Z'));

    expect(instance['formatArchiveMonth']('2024-07')).toBe(expected);
  });
});
