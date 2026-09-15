import {
  deriveMetrics,
  filterIncidents,
  hourlyCounts,
  monthlyCounts,
  offenceCounts,
  sortIncidents,
  suspectCounts,
} from './cib-selectors';
import { CibIncident } from './cib.model';

// Focused 3-row fixture from the task brief:
// - dog+Pikette / snack-theft / open / allied at 09:00 on Aug 1
// - Sawito / obstruction / closed / not-applicable at 09:00 on Aug 1
// - dog / snack-theft / closed / not-applicable at 10:00 on Aug 2
const fixture: readonly CibIncident[] = [
  {
    id: 'FIX-001',
    date: '2026-08-01',
    hour: 9,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'snack-theft',
    status: 'open',
  },
  {
    id: 'FIX-002',
    date: '2026-08-01',
    hour: 9,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'closed',
  },
  {
    id: 'FIX-003',
    date: '2026-08-02',
    hour: 10,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'closed',
  },
];

describe('deriveMetrics', () => {
  it('computes totals, open count, closure rate, and peak hour on the fixture', () => {
    expect(deriveMetrics(fixture)).toEqual({
      total: 3,
      open: 1,
      closureRate: 67,
      peakHour: 9,
    });
  });

  it('keeps empty results mathematically honest', () => {
    expect(deriveMetrics([])).toEqual({
      total: 0,
      open: 0,
      closureRate: null,
      peakHour: null,
    });
    expect(hourlyCounts([])).toHaveLength(24);
    expect(hourlyCounts([]).every((bucket) => bucket.count === 0)).toBe(true);
  });

  it('breaks a tied peak hour by picking the earliest hour', () => {
    const tied: readonly CibIncident[] = [
      { ...fixture[2], id: 'TIE-001', date: '2026-08-01', hour: 5 },
      { ...fixture[2], id: 'TIE-002', date: '2026-08-02', hour: 5 },
      { ...fixture[2], id: 'TIE-003', date: '2026-08-03', hour: 3 },
      { ...fixture[2], id: 'TIE-004', date: '2026-08-04', hour: 3 },
    ];

    expect(deriveMetrics(tied).peakHour).toBe(3);
  });
});

describe('filterIncidents', () => {
  it('returns two incidents for dog + snack-theft, with one open case and 50% closure', () => {
    const result = filterIncidents(fixture, { suspect: 'le-criminel', offence: 'snack-theft' });

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual(['FIX-001', 'FIX-003']);

    const metrics = deriveMetrics(result);
    expect(metrics.open).toBe(1);
    expect(metrics.closureRate).toBe(50);
  });

  it('returns zero incidents for Sawito + snack-theft', () => {
    const result = filterIncidents(fixture, { suspect: 'sawito', offence: 'snack-theft' });

    expect(result).toHaveLength(0);
    expect(deriveMetrics(result)).toEqual({
      total: 0,
      open: 0,
      closureRate: null,
      peakHour: null,
    });
  });

  it('returns the single joint incident for Pikette + snack-theft without duplicating it elsewhere', () => {
    const result = filterIncidents(fixture, { suspect: 'pikette', offence: 'snack-theft' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FIX-001');

    // The all-suspect, all-offence total still counts the joint row once.
    const allTotal = filterIncidents(fixture, { suspect: 'all', offence: 'all' });
    expect(allTotal).toHaveLength(3);

    // Involvement counts overlap (dog appears in two rows, cat in one, sawito in one)
    // but the joint row is never expanded into duplicate rows anywhere.
    const counts = suspectCounts(fixture);
    expect(counts).toEqual([
      { key: 'le-criminel', count: 2 },
      { key: 'pikette', count: 1 },
      { key: 'sawito', count: 1 },
    ]);

    expect(sortIncidents(fixture)).toHaveLength(3);
    const totalAcrossOffenceBuckets = offenceCounts(fixture).reduce((sum, b) => sum + b.count, 0);
    expect(totalAcrossOffenceBuckets).toBe(3);
    const totalAcrossHourBuckets = hourlyCounts(fixture).reduce((sum, b) => sum + b.count, 0);
    expect(totalAcrossHourBuckets).toBe(3);
  });
});

describe('monthlyCounts', () => {
  it('groups full ISO incident dates into ordered month buckets and zero-fills missing months', () => {
    const rows: readonly CibIncident[] = [
      { ...fixture[2], id: 'MONTH-001', date: '2024-07-01' },
      { ...fixture[2], id: 'MONTH-002', date: '2024-07-31' },
      { ...fixture[2], id: 'MONTH-003', date: '2024-08-15' },
    ];

    expect(monthlyCounts(rows, ['2024-07', '2024-08', '2024-09'])).toEqual([
      { key: '2024-07', count: 2 },
      { key: '2024-08', count: 1 },
      { key: '2024-09', count: 0 },
    ]);
  });
});

describe('offenceCounts', () => {
  it('returns all four fixed categories in order, including zeros', () => {
    expect(offenceCounts(fixture)).toEqual([
      { key: 'snack-theft', count: 2 },
      { key: 'property-damage', count: 0 },
      { key: 'public-disturbance', count: 0 },
      { key: 'obstruction', count: 1 },
    ]);
  });
});

describe('hourlyCounts', () => {
  it('returns all 24 hours in order, including zeros', () => {
    const result = hourlyCounts(fixture);

    expect(result).toHaveLength(24);
    expect(result[9]).toEqual({ key: '9', count: 2 });
    expect(result[10]).toEqual({ key: '10', count: 1 });
    expect(result[0]).toEqual({ key: '0', count: 0 });
  });
});

describe('sortIncidents', () => {
  it('orders by date descending, then hour descending, then ID ascending for deterministic ties', () => {
    const result = sortIncidents(fixture);

    expect(result.map((r) => r.id)).toEqual(['FIX-003', 'FIX-001', 'FIX-002']);
  });
});

describe('no mutation of inputs', () => {
  it('does not mutate or reorder the frozen input array across all selectors', () => {
    const frozen: readonly CibIncident[] = Object.freeze([...fixture]);
    const idsBefore = frozen.map((r) => r.id);

    expect(() => sortIncidents(frozen)).not.toThrow();
    expect(() => filterIncidents(frozen, { suspect: 'all', offence: 'all' })).not.toThrow();
    expect(() => deriveMetrics(frozen)).not.toThrow();
    expect(() => monthlyCounts(frozen, ['2026-08'])).not.toThrow();
    expect(() => offenceCounts(frozen)).not.toThrow();
    expect(() => hourlyCounts(frozen)).not.toThrow();
    expect(() => suspectCounts(frozen)).not.toThrow();

    expect(frozen.map((r) => r.id)).toEqual(idsBefore);
  });
});
