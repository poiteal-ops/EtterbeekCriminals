import { routes } from '../../app.routes';
import { EN_CONTENT } from '../../i18n/content/en.content';
import { hourlyCounts, monthlyCounts, offenceCounts, suspectCounts } from './cib-selectors';
import { CIB_ARCHIVE_MONTHS, CIB_INCIDENTS, CIB_INCIDENT_COPY_EN } from './cib.data';
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
//
// The block below reuses images already published elsewhere on the site
// (other story pages, blog case log entries) for incidents that previously
// had none. Each was opened and visually re-verified for this addition:
// eyes are either bar-redacted or not visible/facing camera, and none is a
// raw LocalPics path.
const KNOWN_SAFE_IMAGES = [
  'assets/images/sawito-dog-selfie.jpg',
  'assets/images/dog-floor-portrait.jpg',
  'assets/images/pikette-couch-visit.jpg',
  'assets/images/pikette-dog-couch.jpg',
  'assets/images/couch-crime-scene.jpg',
  'assets/images/theft-bread.jpg',
  'assets/images/theft-shoe.jpg',
  'assets/images/couch-armrest-detail.jpg',
  'assets/images/blog-shop-entry.jpg',
  'assets/images/jury-verdict-awaited.jpg',
  'assets/images/blog-belly-flop.jpg',
  'assets/images/blog-cafe-standoff.jpg',
  'assets/images/blog-cheek-to-cheek.jpg',
  'assets/images/balcony-aftermath-roof.png',
  'assets/images/pikette-windowsill.jpg',
  'assets/images/blog-full-capacity.jpg',
  'assets/images/blog-blanket-hoard.jpg',
  'assets/images/couch-dog-caught.jpg',
  'assets/images/bestie-hoover-chaos.jpg',
  'assets/images/blog-waffle-watch.jpg',
  'assets/images/blog-mailman-standoff.jpg',
  'assets/images/blog-bed-nap.jpg',
  'assets/images/blog-garden-wall.jpg',
  'assets/images/blog-shoulder-selfie.jpg',
  'assets/images/blog-front-door-recapture.jpg',
  'assets/images/cib-aug-croissant-watch.jpg',
  'assets/images/cib-aug-shoe-inspection.jpg',
  'assets/images/cib-aug-balcony-grate.jpg',
  'assets/images/cib-aug-food-surveillance.jpg',
];

const existingRoutePaths = new Set(
  (routes[0].children ?? []).map((r) => r.path).filter((p): p is string => typeof p === 'string')
);

function hasDuoParticipants(incident: CibIncident): boolean {
  return incident.suspectIds.includes('le-criminel') && incident.suspectIds.includes('pikette');
}

describe('CIB_ARCHIVE_MONTHS', () => {
  it('contains the 26 fixed archive months from July 2024 through August 2026', () => {
    expect(CIB_ARCHIVE_MONTHS).toHaveLength(26);
    expect(CIB_ARCHIVE_MONTHS[0]).toBe('2024-07');
    expect(CIB_ARCHIVE_MONTHS[25]).toBe('2026-08');
    expect([...CIB_ARCHIVE_MONTHS].sort()).toEqual(CIB_ARCHIVE_MONTHS);
  });
});

describe('English CIB archive copy', () => {
  it('describes the 52-case monthly archive from July 2024 through August 2026', () => {
    expect(EN_CONTENT.cib.archiveWindowLabel).toContain('JUL 2024');
    expect(EN_CONTENT.cib.archiveWindowLabel).toContain('AUG 2026');
    expect(EN_CONTENT.cib.seoDescription).toContain('52 fictional incidents');
    expect(EN_CONTENT.cib.dailyChartTitle).toBe('MONTHLY ACTIVITY');
    expect(EN_CONTENT.cib.dailyChartDescription).toContain('per month');
    expect(EN_CONTENT.cib.methodologyBody).toContain('July 2024 through August 2026');
    expect(EN_CONTENT.cib.cibBody).toContain('Fifty-two incidents');
    expect(EN_CONTENT.cib.dossierDescriptions.pikette).toContain('Historical visits on file');
  });
});

describe('CIB_INCIDENTS — per-row validation', () => {
  it('uses the approved organic 1-to-4 incident rhythm across the archive', () => {
    expect(CIB_INCIDENTS).toHaveLength(52);
    expect(monthlyCounts(CIB_INCIDENTS, CIB_ARCHIVE_MONTHS).map((bucket) => bucket.count)).toEqual([
      1, 3, 1, 2, 1, 3, 2, 4, 1, 2, 1, 3, 2,
      1, 3, 3, 1, 2, 1, 4, 1, 2, 1, 3, 1, 3,
    ]);
  });

  it('has unique IDs formatted CIB-001 through CIB-052', () => {
    const ids = CIB_INCIDENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    const expectedIds = Array.from(
      { length: 52 },
      (_, i) => `CIB-${String(i + 1).padStart(3, '0')}`
    );
    expect([...ids].sort()).toEqual(expectedIds);
  });

  it('uses only dates within the fixed 26-month archive', () => {
    for (const incident of CIB_INCIDENTS) {
      expect(CIB_ARCHIVE_MONTHS).toContain(incident.date.slice(0, 7));
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

  it('restricts Pikette incidents to her five blog-supported visit months', () => {
    const visitMonths = new Set(['2025-02', '2025-06', '2025-10', '2026-02', '2026-06']);
    const piketteRows = CIB_INCIDENTS.filter((incident) => incident.suspectIds.includes('pikette'));
    expect(piketteRows).toHaveLength(10);
    expect(piketteRows.every((incident) => visitMonths.has(incident.date.slice(0, 7)))).toBe(true);
  });

  it('only references images from the known-safe, eye-bar-verified list', () => {
    for (const incident of CIB_INCIDENTS) {
      if (incident.image !== undefined) {
        expect(incident.image).not.toContain('LocalPics');
        expect(KNOWN_SAFE_IMAGES).toContain(incident.image);
      }
    }
  });

  it('uses every new August evidence image in the archive', () => {
    const usedImages = new Set(CIB_INCIDENTS.map((incident) => incident.image).filter(Boolean));
    for (const image of KNOWN_SAFE_IMAGES.filter((path) => path.includes('cib-aug-'))) {
      expect(usedImages.has(image)).toBe(true);
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
  it('uses a snack-led organic offence distribution that sums to 52', () => {
    const buckets = offenceCounts(CIB_INCIDENTS);
    expect(buckets).toEqual([
      { key: 'snack-theft', count: 18 },
      { key: 'property-damage', count: 14 },
      { key: 'public-disturbance', count: 11 },
      { key: 'obstruction', count: 9 },
    ]);
  });

  it('sums monthly totals across all 26 archive months to 52', () => {
    const buckets = monthlyCounts(CIB_INCIDENTS, CIB_ARCHIVE_MONTHS);
    expect(buckets).toHaveLength(26);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(52);
  });

  it('sums hourly totals across all 24 hours to 52', () => {
    const buckets = hourlyCounts(CIB_INCIDENTS);
    expect(buckets).toHaveLength(24);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(52);
  });

  it('has 20 closed and 32 open incidents, summing to 52', () => {
    const closed = CIB_INCIDENTS.filter((i) => i.status === 'closed').length;
    const open = CIB_INCIDENTS.filter((i) => i.status === 'open').length;
    expect(closed).toBe(20);
    expect(open).toBe(32);
    expect(closed + open).toBe(52);
  });

  it('has involvement counts of 44 (le-criminel), 10 (pikette), 6 (sawito)', () => {
    const buckets = suspectCounts(CIB_INCIDENTS);
    expect(buckets).toEqual([
      { key: 'le-criminel', count: 44 },
      { key: 'pikette', count: 10 },
      { key: 'sawito', count: 6 },
    ]);
  });

  it('has the exact participant-type split: 8 duo, 36 solo-dog, 2 solo-cat, 6 solo-sawito', () => {
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

    expect(duo).toHaveLength(8);
    expect(soloDog).toHaveLength(36);
    expect(soloCat).toHaveLength(2);
    expect(soloSawito).toHaveLength(6);
    expect(duo.length + soloDog.length + soloCat.length + soloSawito.length).toBe(52);
  });

  it('has duo relationship counts of 4 allied, 3 rivals, and 1 truce', () => {
    const duo = CIB_INCIDENTS.filter((i) => hasDuoParticipants(i));
    const allied = duo.filter((i) => i.duoRelationship === 'allied').length;
    const rivals = duo.filter((i) => i.duoRelationship === 'rivals').length;
    const truce = duo.filter((i) => i.duoRelationship === 'truce').length;

    expect(allied).toBe(4);
    expect(rivals).toBe(3);
    expect(truce).toBe(1);
    expect(allied + rivals + truce).toBe(8);
  });

  it('reconciles overlapping involvement counts with unique incident rows', () => {
    const involvementSum = suspectCounts(CIB_INCIDENTS).reduce((sum, b) => sum + b.count, 0);
    expect(involvementSum).toBe(60); // eight duo rows contribute two suspect involvements each
    expect(CIB_INCIDENTS.length).toBe(52); // unique rows, never expanded
  });

  it('has both animal suspects appearing in every offence category across the full archive', () => {
    for (const offenceId of ALLOWED_OFFENCES) {
      const rowsInCategory = CIB_INCIDENTS.filter((i) => i.offenceId === offenceId);
      expect(rowsInCategory.some((i) => i.suspectIds.includes('le-criminel'))).toBe(true);
      expect(rowsInCategory.some((i) => i.suspectIds.includes('pikette'))).toBe(true);
    }
  });
});
