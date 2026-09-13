import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CriminalIntelligence } from './criminal-intelligence';
import { filterIncidents } from './cib-selectors';
import { CIB_INCIDENTS } from './cib.data';

// Note: the fixed 48-incident archive deliberately covers every
// suspect x offence combination at least once, so a zero-match filter state
// can't be reached from this file's real dataset. That code path (rule 8) is
// covered separately in criminal-intelligence-empty.spec.ts, which mocks the
// data module with a single-incident archive to exercise it for real.

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

    instance['setSuspectFilter']('pikette');
    instance['setOffenceFilter']('snack-theft');

    const expected = filterIncidents(CIB_INCIDENTS, { suspect: 'pikette', offence: 'snack-theft' });
    expect(instance['filters']()).toEqual({ suspect: 'pikette', offence: 'snack-theft' });
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

    instance['setSuspectFilter']('pikette');
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

  it('never renders a broken image for incidents without one', () => {
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

    instance['toggleExpanded'](incidentWithoutImage!.id);
    fixture.detectChanges();

    const card = Array.from(fixture.nativeElement.querySelectorAll('.incident-card') as NodeListOf<HTMLElement>).find(
      (el) => el.textContent?.includes(incidentWithoutImage!.id),
    );
    expect(card?.querySelector('.incident-details img')).toBeNull();
  });
});
