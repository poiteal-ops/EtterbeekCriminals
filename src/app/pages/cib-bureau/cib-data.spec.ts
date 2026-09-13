import { routes } from '../../app.routes';
import { dailyCounts, hourlyCounts, offenceCounts, suspectCounts } from './cib-selectors';
import { CIB_ARCHIVE_DATES, CIB_INCIDENTS, CIB_INCIDENT_COPY_EN } from './cib.data';
import { CibIncident, OffenceId, SuspectId } from './cib.model';

const ALLOWED_SUSPECTS: readonly SuspectId[] = ['le-criminel', 'pikette', 'sawito'];
const ALLOWED_OFFENCES: readonly OffenceId[] = [
  'snack-theft',
  'property-damage',
  'public-disturbance',
  'obstruction',
];
const ALLOWED_STATUSES = ['open', 'closed'];
const ALLOWED_RELATIONSHIPS = ['allied', 'rivals', 'truce', 'not-applicable'];

// Only these existing, eye-bar-verified images may be referenced — see
// task-2-context.md. pikette-closeup.jpg is explicitly excluded.
const KNOWN_SAFE_IMAGES = [
  'assets/images/sawito-dog-selfie.jpg',
  'assets/images/dog-floor-portrait.jpg',
  'assets/images/pikette-couch-visit.jpg',
  'assets/images/pikette-dog-couch.jpg',
  'assets/images/couch-crime-scene.jpg',
  'assets/images/theft-bread.jpg',
  'assets/images/theft-shoe.jpg',
];

const existingRoutePaths = new Set(
  (routes[0].children ?? []).map((r) => r.path).filter((p): p is string => typeof p === 'string')
);

function hasDuoParticipants(incident: CibIncident): boolean {
  return incident.suspectIds.includes('le-criminel') && incident.suspectIds.includes('pikette');
}

describe('CIB_ARCHIVE_DATES', () => {
  it('contains exactly the 28 fixed archive dates, ascending', () => {
    expect(CIB_ARCHIVE_DATES).toHaveLength(28);
    expect(CIB_ARCHIVE_DATES[0]).toBe('2026-08-01');
    expect(CIB_ARCHIVE_DATES[27]).toBe('2026-08-28');
    expect([...CIB_ARCHIVE_DATES].sort()).toEqual(CIB_ARCHIVE_DATES);
  });
});

describe('CIB_INCIDENTS — per-row validation', () => {
  it('has exactly 48 incidents', () => {
    expect(CIB_INCIDENTS).toHaveLength(48);
  });

  it('has unique IDs formatted CIB-001 through CIB-048', () => {
    const ids = CIB_INCIDENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    const expectedIds = Array.from(
      { length: 48 },
      (_, i) => `CIB-${String(i + 1).padStart(3, '0')}`
    );
    expect([...ids].sort()).toEqual(expectedIds);
  });

  it('uses only dates within the fixed 28-day archive', () => {
    for (const incident of CIB_INCIDENTS) {
      expect(CIB_ARCHIVE_DATES).toContain(incident.date);
    }
  });

  it('uses integer hours between 0 and 23 inclusive', () => {
    for (const incident of CIB_INCIDENTS) {
      expect(Number.isInteger(incident.hour)).toBe(true);
      expect(incident.hour).toBeGreaterThanOrEqual(0);
      expect(incident.hour).toBeLessThanOrEqual(23);
    }
  });

  it('has a nonempty, unique participant array per incident', () => {
    for (const incident of CIB_INCIDENTS) {
      expect(incident.suspectIds.length).toBeGreaterThan(0);
      expect(new Set(incident.suspectIds).size).toBe(incident.suspectIds.length);
    }
  });

  it('only uses allowed suspects, offence categories, and statuses', () => {
    for (const incident of CIB_INCIDENTS) {
      for (const suspect of incident.suspectIds) {
        expect(ALLOWED_SUSPECTS).toContain(suspect);
      }
      expect(ALLOWED_OFFENCES).toContain(incident.offenceId);
      expect(ALLOWED_STATUSES).toContain(incident.status);
      expect(ALLOWED_RELATIONSHIPS).toContain(incident.duoRelationship);
    }
  });

  it('sets duoRelationship to allied/rivals/truce only when both le-criminel and pikette participate', () => {
    for (const incident of CIB_INCIDENTS) {
      if (hasDuoParticipants(incident)) {
        expect(incident.duoRelationship).not.toBe('not-applicable');
      } else {
        expect(incident.duoRelationship).toBe('not-applicable');
      }
    }
  });

  it('only references images from the known-safe, eye-bar-verified list', () => {
    for (const incident of CIB_INCIDENTS) {
      if (incident.image !== undefined) {
        expect(incident.image).not.toContain('LocalPics');
        expect(KNOWN_SAFE_IMAGES).toContain(incident.image);
      }
    }
  });

  it('only references existing published routes for storyRoute', () => {
    expect(existingRoutePaths.size).toBeGreaterThan(0);

    for (const incident of CIB_INCIDENTS) {
      if (incident.storyRoute !== undefined) {
        const withoutLeadingSlash = incident.storyRoute.replace(/^\//, '');
        expect(existingRoutePaths).toContain(withoutLeadingSlash);
      }
    }
  });
});

describe('CIB_INCIDENT_COPY_EN — coverage', () => {
  it('has exactly one English copy entry per incident ID, with no orphans', () => {
    const incidentIds = new Set(CIB_INCIDENTS.map((i) => i.id));
    const copyIds = new Set(Object.keys(CIB_INCIDENT_COPY_EN));

    expect(copyIds.size).toBe(incidentIds.size);
    for (const id of incidentIds) {
      expect(copyIds).toContain(id);
    }
    for (const id of copyIds) {
      expect(incidentIds).toContain(id);
    }
  });

  it('has a nonempty title and summary for every incident', () => {
    for (const incident of CIB_INCIDENTS) {
      const copy = CIB_INCIDENT_COPY_EN[incident.id];
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.summary.length).toBeGreaterThan(0);
    }
  });

  it('leaves imageAlt empty only for incidents with no image', () => {
    for (const incident of CIB_INCIDENTS) {
      const copy = CIB_INCIDENT_COPY_EN[incident.id];
      if (incident.image === undefined) {
        expect(copy.imageAlt).toBe('');
      } else {
        expect(copy.imageAlt.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('CIB_INCIDENTS — full-archive aggregate distribution', () => {
  it('sums offence category totals to 48, 12 per category', () => {
    const buckets = offenceCounts(CIB_INCIDENTS);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(48);
    for (const bucket of buckets) {
      expect(bucket.count).toBe(12);
    }
  });

  it('sums daily totals across all 28 archive dates to 48, with at least one zero day', () => {
    const buckets = dailyCounts(CIB_INCIDENTS, CIB_ARCHIVE_DATES);
    expect(buckets).toHaveLength(28);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(48);
    expect(buckets.some((b) => b.count === 0)).toBe(true);
  });

  it('sums hourly totals across all 24 hours to 48', () => {
    const buckets = hourlyCounts(CIB_INCIDENTS);
    expect(buckets).toHaveLength(24);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(48);
  });

  it('has 18 closed and 30 open incidents, summing to 48', () => {
    const closed = CIB_INCIDENTS.filter((i) => i.status === 'closed').length;
    const open = CIB_INCIDENTS.filter((i) => i.status === 'open').length;
    expect(closed).toBe(18);
    expect(open).toBe(30);
    expect(closed + open).toBe(48);
  });

  it('has involvement counts of 36 (le-criminel), 30 (pikette), 6 (sawito)', () => {
    const buckets = suspectCounts(CIB_INCIDENTS);
    expect(buckets).toEqual([
      { key: 'le-criminel', count: 36 },
      { key: 'pikette', count: 30 },
      { key: 'sawito', count: 6 },
    ]);
  });

  it('has the exact participant-type split: 24 duo, 12 solo-dog, 6 solo-cat, 6 solo-sawito', () => {
    const duo = CIB_INCIDENTS.filter((i) => hasDuoParticipants(i));
    const soloDog = CIB_INCIDENTS.filter(
      (i) => i.suspectIds.length === 1 && i.suspectIds[0] === 'le-criminel'
    );
    const soloCat = CIB_INCIDENTS.filter(
      (i) => i.suspectIds.length === 1 && i.suspectIds[0] === 'pikette'
    );
    const soloSawito = CIB_INCIDENTS.filter(
      (i) => i.suspectIds.length === 1 && i.suspectIds[0] === 'sawito'
    );

    expect(duo).toHaveLength(24);
    expect(soloDog).toHaveLength(12);
    expect(soloCat).toHaveLength(6);
    expect(soloSawito).toHaveLength(6);
    expect(duo.length + soloDog.length + soloCat.length + soloSawito.length).toBe(48);
  });

  it('has duo relationship counts of 14 allied, 6 rivals, 4 truce', () => {
    const duo = CIB_INCIDENTS.filter((i) => hasDuoParticipants(i));
    const allied = duo.filter((i) => i.duoRelationship === 'allied').length;
    const rivals = duo.filter((i) => i.duoRelationship === 'rivals').length;
    const truce = duo.filter((i) => i.duoRelationship === 'truce').length;

    expect(allied).toBe(14);
    expect(rivals).toBe(6);
    expect(truce).toBe(4);
    expect(allied + rivals + truce).toBe(24);
  });

  it('reconciles filtered event totals separately from overlapping involvement counts', () => {
    // The incident total (unique rows) must not equal the naive sum of
    // per-suspect involvement counts, because duo rows are counted once
    // per suspect there but only once in the archive.
    const involvementSum = suspectCounts(CIB_INCIDENTS).reduce((sum, b) => sum + b.count, 0);
    expect(involvementSum).toBe(72); // 36 + 30 + 6, overlapping by design
    expect(CIB_INCIDENTS.length).toBe(48); // unique rows, never expanded
  });

  it('has both le-criminel and pikette appearing somewhere in every offence category', () => {
    for (const offenceId of ALLOWED_OFFENCES) {
      const rowsInCategory = CIB_INCIDENTS.filter((i) => i.offenceId === offenceId);
      expect(rowsInCategory.some((i) => i.suspectIds.includes('le-criminel'))).toBe(true);
      expect(rowsInCategory.some((i) => i.suspectIds.includes('pikette'))).toBe(true);
    }
  });
});
