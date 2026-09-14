// Criminal Intelligence Bureau (CIB) — the fixed 48-incident archive.
//
// This is a deliberately hand-authored, fixed dataset (not generated at
// runtime) covering 2026-08-01 through 2026-08-28. See
// .superpowers/sdd/CIB-planning/task-2-context.md for the exact distribution
// this file must satisfy; cib-data.spec.ts validates it.

import { CibIncident, CibIncidentCopy } from './cib.model';

export const CIB_ARCHIVE_DATES: readonly string[] = [
  '2026-08-01',
  '2026-08-02',
  '2026-08-03',
  '2026-08-04',
  '2026-08-05',
  '2026-08-06',
  '2026-08-07',
  '2026-08-08',
  '2026-08-09',
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
  '2026-08-17',
  '2026-08-18',
  '2026-08-19',
  '2026-08-20',
  '2026-08-21',
  '2026-08-22',
  '2026-08-23',
  '2026-08-24',
  '2026-08-25',
  '2026-08-26',
  '2026-08-27',
  '2026-08-28',
];

export const CIB_INCIDENTS: readonly CibIncident[] = [
  {
    id: 'CIB-001',
    date: '2026-08-01',
    hour: 7,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'snack-theft',
    status: 'closed',
  },
  {
    id: 'CIB-002',
    date: '2026-08-01',
    hour: 14,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'property-damage',
    status: 'open',
    image: 'assets/images/couch-armrest-detail.jpg',
  },
  {
    id: 'CIB-003',
    date: '2026-08-02',
    hour: 18,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'public-disturbance',
    status: 'closed',
  },
  {
    id: 'CIB-004',
    date: '2026-08-03',
    hour: 9,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'obstruction',
    status: 'open',
    image: 'assets/images/blog-shop-entry.jpg',
  },
  {
    id: 'CIB-005',
    date: '2026-08-03',
    hour: 19,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'open',
    image: 'assets/images/theft-bread.jpg',
    storyRoute: '/theft-and-destruction',
  },
  {
    id: 'CIB-006',
    date: '2026-08-05',
    hour: 11,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'property-damage',
    status: 'closed',
    image: 'assets/images/sawito-dog-selfie.jpg',
  },
  {
    id: 'CIB-007',
    date: '2026-08-05',
    hour: 17,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'public-disturbance',
    status: 'open',
    image: 'assets/images/jury-verdict-awaited.jpg',
    storyRoute: '/jury-tampering',
  },
  {
    id: 'CIB-008',
    date: '2026-08-06',
    hour: 10,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'closed',
  },
  {
    id: 'CIB-009',
    date: '2026-08-07',
    hour: 8,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'snack-theft',
    status: 'open',
  },
  {
    id: 'CIB-010',
    date: '2026-08-07',
    hour: 15,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'property-damage',
    status: 'open',
  },
  {
    id: 'CIB-011',
    date: '2026-08-08',
    hour: 20,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'rivals',
    offenceId: 'public-disturbance',
    status: 'closed',
  },
  {
    id: 'CIB-012',
    date: '2026-08-08',
    hour: 9,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'rivals',
    offenceId: 'obstruction',
    status: 'open',
  },
  {
    id: 'CIB-013',
    date: '2026-08-09',
    hour: 12,
    suspectIds: ['pikette'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'closed',
  },
  {
    id: 'CIB-014',
    date: '2026-08-10',
    hour: 16,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'property-damage',
    status: 'open',
    image: 'assets/images/theft-shoe.jpg',
    storyRoute: '/theft-and-destruction',
  },
  {
    id: 'CIB-015',
    date: '2026-08-10',
    hour: 18,
    suspectIds: ['pikette'],
    duoRelationship: 'not-applicable',
    offenceId: 'public-disturbance',
    status: 'open',
    image: 'assets/images/pikette-couch-visit.jpg',
  },
  {
    id: 'CIB-016',
    date: '2026-08-11',
    hour: 11,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'open',
    image: 'assets/images/blog-belly-flop.jpg',
  },
  {
    id: 'CIB-017',
    date: '2026-08-11',
    hour: 7,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'rivals',
    offenceId: 'snack-theft',
    status: 'open',
  },
  {
    id: 'CIB-018',
    date: '2026-08-12',
    hour: 14,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'rivals',
    offenceId: 'property-damage',
    status: 'closed',
    image: 'assets/images/couch-crime-scene.jpg',
    storyRoute: '/couch',
  },
  {
    id: 'CIB-019',
    date: '2026-08-13',
    hour: 19,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'public-disturbance',
    status: 'open',
    image: 'assets/images/pikette-dog-couch.jpg',
  },
  {
    id: 'CIB-020',
    date: '2026-08-13',
    hour: 10,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'obstruction',
    status: 'closed',
  },
  {
    id: 'CIB-021',
    date: '2026-08-14',
    hour: 8,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'closed',
    image: 'assets/images/blog-cafe-standoff.jpg',
  },
  {
    id: 'CIB-022',
    date: '2026-08-14',
    hour: 15,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'property-damage',
    status: 'open',
    image: 'assets/images/blog-cheek-to-cheek.jpg',
  },
  {
    id: 'CIB-023',
    date: '2026-08-15',
    hour: 17,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'public-disturbance',
    status: 'closed',
    image: 'assets/images/balcony-aftermath-roof.png',
    storyRoute: '/pigeon',
  },
  {
    id: 'CIB-024',
    date: '2026-08-15',
    hour: 9,
    suspectIds: ['pikette'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'open',
  },
  {
    id: 'CIB-025',
    date: '2026-08-15',
    hour: 20,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'snack-theft',
    status: 'open',
  },
  {
    id: 'CIB-026',
    date: '2026-08-16',
    hour: 14,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'property-damage',
    status: 'open',
  },
  {
    id: 'CIB-027',
    date: '2026-08-16',
    hour: 18,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'rivals',
    offenceId: 'public-disturbance',
    status: 'open',
  },
  {
    id: 'CIB-028',
    date: '2026-08-17',
    hour: 11,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'rivals',
    offenceId: 'obstruction',
    status: 'open',
  },
  {
    id: 'CIB-029',
    date: '2026-08-18',
    hour: 7,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'truce',
    offenceId: 'snack-theft',
    status: 'open',
  },
  {
    id: 'CIB-030',
    date: '2026-08-18',
    hour: 16,
    suspectIds: ['pikette'],
    duoRelationship: 'not-applicable',
    offenceId: 'property-damage',
    status: 'closed',
    image: 'assets/images/pikette-windowsill.jpg',
  },
  {
    id: 'CIB-031',
    date: '2026-08-19',
    hour: 19,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'truce',
    offenceId: 'public-disturbance',
    status: 'open',
  },
  {
    id: 'CIB-032',
    date: '2026-08-19',
    hour: 10,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'closed',
  },
  {
    id: 'CIB-033',
    date: '2026-08-20',
    hour: 12,
    suspectIds: ['pikette'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'closed',
  },
  {
    id: 'CIB-034',
    date: '2026-08-21',
    hour: 15,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'property-damage',
    status: 'open',
    image: 'assets/images/blog-full-capacity.jpg',
  },
  {
    id: 'CIB-035',
    date: '2026-08-21',
    hour: 17,
    suspectIds: ['pikette'],
    duoRelationship: 'not-applicable',
    offenceId: 'public-disturbance',
    status: 'closed',
  },
  {
    id: 'CIB-036',
    date: '2026-08-22',
    hour: 9,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'open',
    image: 'assets/images/dog-floor-portrait.jpg',
  },
  {
    id: 'CIB-037',
    date: '2026-08-22',
    hour: 8,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'open',
    image: 'assets/images/theft-bread.jpg',
  },
  {
    id: 'CIB-038',
    date: '2026-08-23',
    hour: 14,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'truce',
    offenceId: 'property-damage',
    status: 'open',
    image: 'assets/images/blog-blanket-hoard.jpg',
  },
  {
    id: 'CIB-039',
    date: '2026-08-24',
    hour: 20,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'public-disturbance',
    status: 'open',
    image: 'assets/images/couch-dog-caught.jpg',
  },
  {
    id: 'CIB-040',
    date: '2026-08-24',
    hour: 11,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'truce',
    offenceId: 'obstruction',
    status: 'open',
    image: 'assets/images/bestie-hoover-chaos.jpg',
  },
  {
    id: 'CIB-041',
    date: '2026-08-25',
    hour: 7,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'snack-theft',
    status: 'closed',
    image: 'assets/images/blog-waffle-watch.jpg',
  },
  {
    id: 'CIB-042',
    date: '2026-08-25',
    hour: 16,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'property-damage',
    status: 'closed',
  },
  {
    id: 'CIB-043',
    date: '2026-08-26',
    hour: 18,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'public-disturbance',
    status: 'open',
    image: 'assets/images/blog-mailman-standoff.jpg',
  },
  {
    id: 'CIB-044',
    date: '2026-08-26',
    hour: 10,
    suspectIds: ['le-criminel', 'pikette'],
    duoRelationship: 'allied',
    offenceId: 'obstruction',
    status: 'closed',
    image: 'assets/images/blog-bed-nap.jpg',
  },
  {
    id: 'CIB-045',
    date: '2026-08-27',
    hour: 13,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'snack-theft',
    status: 'open',
  },
  {
    id: 'CIB-046',
    date: '2026-08-27',
    hour: 15,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'property-damage',
    status: 'open',
    image: 'assets/images/blog-garden-wall.jpg',
  },
  {
    id: 'CIB-047',
    date: '2026-08-28',
    hour: 19,
    suspectIds: ['sawito'],
    duoRelationship: 'not-applicable',
    offenceId: 'public-disturbance',
    status: 'closed',
    image: 'assets/images/blog-shoulder-selfie.jpg',
  },
  {
    id: 'CIB-048',
    date: '2026-08-28',
    hour: 9,
    suspectIds: ['le-criminel'],
    duoRelationship: 'not-applicable',
    offenceId: 'obstruction',
    status: 'open',
    image: 'assets/images/blog-front-door-recapture.jpg',
  },
];

// English incident copy, keyed by incident ID. Full CibContent/i18n wiring
// is Task 4's job; this is the minimal English-only slice Task 2 needs.
export const CIB_INCIDENT_COPY_EN: Readonly<Record<string, CibIncidentCopy>> = {
  'CIB-001': {
    title: 'Croissant divided under joint operation',
    summary:
      'Suspects coordinated a two-front approach: Le Criminel created the distraction, Pikette extracted the pastry. Croissant recovered in two pieces, neither edible.',
    imageAlt: '',
  },
  'CIB-002': {
    title: 'Cushion seams tested to structural failure',
    summary:
      'A joint excavation of the good armchair cushion produced stuffing across the living room. Both suspects deny initiating the dig; both were covered in the same stuffing.',
    imageAlt: 'Torn stitching and exposed stuffing on a couch cushion seam.',
  },
  'CIB-003': {
    title: 'Synchronized alarm raised over nothing at the door',
    summary:
      'Le Criminel barked; Pikette yowled in apparent solidarity. Investigation found no intruder, no delivery, and no explanation either suspect was willing to offer.',
    imageAlt: '',
  },
  'CIB-004': {
    title: 'Hallway rendered impassable by mutual agreement',
    summary:
      'Both suspects elected to occupy the same three square feet of hallway at the same time, blocking egress for eleven minutes. Neither moved first.',
    imageAlt: 'Le Criminel on a leash just inside a tiled entryway.',
  },
  'CIB-005': {
    title: 'Bread transferred into protective custody',
    summary: 'The accused declined to identify the original owner. Crumbs contradicted the statement.',
    imageAlt: 'Half a loaf of bread on the kitchen floor, one end visibly gnawed.',
  },
  'CIB-006': {
    title: 'Phone case cracked during ill-advised photo op',
    summary:
      "Sawito, attempting a selfie with the dog mid-leap, dropped the phone on the one tile floor in the house. The photo, for the record, came out fine.",
    imageAlt: 'Sawito mid-selfie with the dog leaping toward the camera.',
  },
  'CIB-007': {
    title: 'Extended-family gathering disrupted by unsolicited opinion',
    summary:
      'Subject inserted himself into a conversation he was not party to, barking at a volume calibrated to end it. It ended it.',
    imageAlt: 'Le Criminel sitting solemnly, awaiting judgment.',
  },
  'CIB-008': {
    title: 'Doorway blocked mid-delivery, on purpose',
    summary:
      'Sawito stood directly in the courier’s path while deciding, at length, whether a signature was required. It was not. He stood there anyway.',
    imageAlt: '',
  },
  'CIB-009': {
    title: 'Breakfast toast intercepted by a two-suspect relay',
    summary:
      'Le Criminel knocked the toast from the counter; Pikette caught it before it hit the floor. Division of labor noted, division of toast less clear.',
    imageAlt: '',
  },
  'CIB-010': {
    title: 'Curtain lowered by unauthorized joint effort',
    summary:
      'The living room curtain came down during what witnesses describe as a coordinated climbing attempt. The rod did not survive. Neither suspect appeared to notice.',
    imageAlt: '',
  },
  'CIB-011': {
    title: 'Late-evening standoff resolved by mutual boredom',
    summary:
      'A twelve-minute staring contest over the good sunbeam ended without incident when both parties lost interest simultaneously. Case closed on account of anticlimax.',
    imageAlt: '',
  },
  'CIB-012': {
    title: 'Staircase contested by two parties, resolved by neither',
    summary:
      'Le Criminel occupied the top step; Pikette occupied the bottom. Traffic on the stairs was suspended for the duration of the dispute.',
    imageAlt: '',
  },
  'CIB-013': {
    title: 'Cheese cube removed from an unattended board',
    summary:
      'Suspect approached the charcuterie board with the confidence of someone who had scouted it earlier. One cube of cheese, unaccounted for. Suspect unbothered.',
    imageAlt: '',
  },
  'CIB-014': {
    title: 'Left shoe relocated beyond reasonable recovery',
    summary:
      'The shoe was last seen under the bed. It was later found in the garden, missing a lace and most of its dignity.',
    imageAlt: 'A single sneaker lying in the grass, its lace missing.',
  },
  'CIB-015': {
    title: 'Couch cushion claimed mid-visit, no negotiation offered',
    summary:
      'Suspect arrived, assessed the seating arrangement, and settled directly into the spot already occupied by a guest. The guest relocated.',
    imageAlt: 'Pikette occupying the center couch cushion mid-visit.',
  },
  'CIB-016': {
    title: 'Laptop keyboard occupied during a scheduled call',
    summary:
      'Subject lay down across the keyboard four minutes before a video call was due to start. Removal was attempted twice. The call started late.',
    imageAlt: 'Le Criminel sprawled belly-up on a rug, fully relaxed.',
  },
  'CIB-017': {
    title: 'Shared crime, no shared credit, over a dropped sausage',
    summary:
      'Both suspects converged on the same fallen sausage from opposite directions. Neither yielded. The sausage did not survive contact.',
    imageAlt: '',
  },
  'CIB-018': {
    title: 'Couch armrest lost to an unrelated territorial dispute',
    summary:
      'What began as a hostility incident over a windowsill ended with claw marks on the armrest and tooth marks nearby. Neither suspect was aiming for the couch. The couch lost anyway.',
    imageAlt: 'Claw marks visible on a couch armrest, close up.',
  },
  'CIB-019': {
    title: 'Couch summit escalates into a joint growling session at the window',
    summary:
      'Both suspects took up position on the couch back to monitor the street, growling in what investigators are calling remarkable rhythmic unison.',
    imageAlt: 'Pikette and Le Criminel side by side on the couch back, both facing the window.',
  },
  'CIB-020': {
    title: 'Front door approach blocked by a two-body barricade',
    summary:
      'Suspects lay down nose to tail directly in front of the door, fully aware a walk had been mentioned. The barricade held for six minutes.',
    imageAlt: '',
  },
  'CIB-021': {
    title: 'Bacon plate cleared before it reached the table',
    summary:
      'Subject intercepted the plate at counter height during the two-second window between stove and table. Investigators note this required considerable vertical effort.',
    imageAlt: 'Le Criminel watching a full dinner plate intently from below.',
  },
  'CIB-022': {
    title: 'Reading glasses sat on and structurally compromised',
    summary:
      "Sawito's glasses, left on the arm of the chair for 'just a second,' were located under the same chair, one lens detached. He blames the chair.",
    imageAlt: 'Sawito, wearing his glasses, cheek to cheek with the dog.',
  },
  'CIB-023': {
    title: 'Balcony airspace defended against a single pigeon',
    summary:
      'Subject issued a formal challenge, at volume, to a pigeon that had not asked for one. The pigeon left. Subject claimed the victory as decisive.',
    imageAlt: 'Le Criminel on the glass roof, moments after the balcony descent.',
  },
  'CIB-024': {
    title: 'Bathroom door held shut from the outside, deliberately',
    summary:
      'Suspect positioned herself against the door during a moment when access was clearly needed elsewhere. Requests to move were, as usual, ignored.',
    imageAlt: '',
  },
  'CIB-025': {
    title: 'Popcorn bowl breached during movie night, twice',
    summary:
      'A single bowl of popcorn was raided from two separate angles over the course of one film. Both suspects claimed to have acted independently. The timing suggests otherwise.',
    imageAlt: '',
  },
  'CIB-026': {
    title: 'Houseplant repotted onto the kitchen floor by committee',
    summary:
      'The fern did not survive a coordinated inspection that involved digging, batting, and at least one full-body roll. Soil radius: impressive.',
    imageAlt: '',
  },
  'CIB-027': {
    title: 'Hallway chase ends in a draw, furniture unharmed for once',
    summary:
      'A brief but energetic pursuit down the hallway concluded with both suspects arriving at the same corner from different directions and mutually deciding to stop.',
    imageAlt: '',
  },
  'CIB-028': {
    title: 'Kitchen entrance held under dual occupation',
    summary:
      'Neither suspect would concede the doorway to the other, resulting in a twenty-minute impasse that delayed lunch for everyone involved, including the humans.',
    imageAlt: '',
  },
  'CIB-029': {
    title: 'Shared toast, unusually, actually shared',
    summary:
      'For reasons that remain unclear, both suspects split a fallen piece of toast without incident. Investigators are treating this as an anomaly, not a pattern.',
    imageAlt: '',
  },
  'CIB-030': {
    title: 'Curtain sheer used as an unauthorized climbing structure',
    summary:
      "Suspect scaled the sheer curtain to windowsill height before it detached from two of its three hooks. Descent was described as 'controlled, mostly.'",
    imageAlt: 'Pikette perched on a windowsill beside her food bowls.',
  },
  'CIB-031': {
    title: 'Joint vigil held at the window for an unspecified threat',
    summary:
      'Both suspects sat shoulder to shoulder at the window for forty minutes, alert to a threat that never materialized and was never named.',
    imageAlt: '',
  },
  'CIB-032': {
    title: 'Grocery unpacking paused by unnecessary supervision',
    summary:
      "Sawito stood in the one square foot of kitchen required for unloading bags, offering commentary but no assistance, for the full duration of the task.",
    imageAlt: '',
  },
  'CIB-033': {
    title: 'Butter dish sampled directly, no utensil involved',
    summary:
      'Suspect was found with her face in the butter dish and no plausible explanation for how she got there. The lid, notably, had been closed.',
    imageAlt: '',
  },
  'CIB-034': {
    title: 'Doormat relocated to the middle of the street',
    summary:
      'The doormat was last seen at the threshold. It was later recovered two houses down, damp, chewed at one corner, and facing the wrong way.',
    imageAlt: 'Le Criminel standing on a leash in the middle of a paved street.',
  },
  'CIB-035': {
    title: 'Extended family visit derailed by selective affection',
    summary:
      'Suspect bonded instantly and exclusively with one visiting relative, ignoring the rest of the household for the entire afternoon. The relative was delighted. Everyone else noted it.',
    imageAlt: '',
  },
  'CIB-036': {
    title: 'Doorway occupied in full stretch, blocking both directions',
    summary:
      'Subject selected the exact center of the doorway for a nap, achieving maximum surface coverage. Traffic rerouted around him for two hours.',
    imageAlt: 'Le Criminel lying stretched across a hallway floor.',
  },
  'CIB-037': {
    title: 'Second loaf lost under nearly identical circumstances',
    summary:
      'This is not the first bread-related incident on file, nor, investigators suspect, will it be the last. The technique has clearly been refined.',
    imageAlt: 'A second loaf of bread on the floor, similarly gnawed.',
  },
  'CIB-038': {
    title: 'Blanket fort dismantled by its own architects',
    summary:
      'A jointly constructed blanket fort collapsed under its own ambition. Both suspects were found inside the wreckage, apparently unbothered.',
    imageAlt: 'Le Criminel curled up asleep beneath a heavy blanket on the couch.',
  },
  'CIB-039': {
    title: 'Doorbell sound effect on television mistaken for an actual visitor',
    summary:
      'Subject responded to a doorbell chime from a television commercial with full volume and complete conviction. No visitor was ever found.',
    imageAlt: 'Le Criminel looking up sharply from the rug, ears alert.',
  },
  'CIB-040': {
    title: 'Vacuum cleaner path blocked in unexpected cooperation',
    summary:
      "Both suspects, usually opposed on principle, agreed to simultaneously block the vacuum's path from separate angles. The cleaning took twice as long.",
    imageAlt: 'Le Criminel leaping onto a dog bed beside a running vacuum cleaner.',
  },
  'CIB-041': {
    title: 'Yogurt lid abandoned within reach, predictably exploited',
    summary:
      'The lid was left on the counter for licking rights, an arrangement both suspects apparently understood and executed without dispute.',
    imageAlt: 'Le Criminel staring fixedly at a waffle left on an outdoor table.',
  },
  'CIB-042': {
    title: 'Wrapping paper shredded ahead of schedule, jointly',
    summary:
      'A gift left unattended for six minutes was reduced to confetti by the time anyone returned. Both suspects appeared pleased with the result.',
    imageAlt: '',
  },
  'CIB-043': {
    title: 'Coordinated alert raised over the mail slot, again',
    summary:
      "The mail slot's daily delivery triggered the usual joint response: barking from one suspect, yowling from the other, in a routine now familiar to the postal carrier.",
    imageAlt: 'Le Criminel sitting alert on a leash near the street.',
  },
  'CIB-044': {
    title: 'Bed occupied corner to corner, leaving no usable space',
    summary:
      "Both suspects arranged themselves diagonally across the bed with apparent precision, leaving no room for its intended occupant.",
    imageAlt: 'Le Criminel sprawled on his back across a bed, taking up the whole width.',
  },
  'CIB-045': {
    title: 'Last slice claimed under dubious pretense of portion control',
    summary:
      "Sawito took the final slice while explaining, unprompted, that he was 'just evening things out.' No one had asked him to.",
    imageAlt: '',
  },
  'CIB-046': {
    title: 'Garden hose punctured at multiple points',
    summary:
      "The hose now has four new leaks in a pattern investigators describe as 'thorough.' Subject was found nearby, looking satisfied.",
    imageAlt: 'Le Criminel investigating something on a stone ledge outdoors.',
  },
  'CIB-047': {
    title: 'Video call interrupted by unsolicited narration',
    summary:
      'Sawito provided a live commentary on the dog’s activities to colleagues who had not asked for one, for the full length of a client meeting.',
    imageAlt: 'Sawito taking a selfie with the dog resting against his shoulder.',
  },
  'CIB-048': {
    title: 'Exit blocked pending a decision that was never reached',
    summary:
      'Subject stood in the open doorway deciding whether to go outside for eleven minutes, blocking entry and exit alike, before returning to the couch.',
    imageAlt: 'Le Criminel sitting on a leash just outside the front door.',
  },
};
