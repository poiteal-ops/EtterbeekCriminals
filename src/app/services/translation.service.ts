import { Injectable, computed, signal } from '@angular/core';

export type Lang = 'en' | 'fr';

export interface RapSheetEntry {
  case: string;
  charge: string;
}

export interface BlogPost {
  date: string;
  case: string;
  title: string;
  body: string;
  image?: string;
}

export interface ShopItem {
  name: string;
  tag: string;
  price: string;
  image?: string;
}

export interface AdventureEntry {
  title: string;
  teaser: string;
  link: string;
  image: string;
}

export interface SiteContent {
  nav: {
    home: string;
    about: string;
    story: string;
    stories: string;
    pigeon: string;
    couch: string;
    trainRide: string;
    blog: string;
    shop: string;
  };
  home: {
    wanted: string;
    fileNo: string;
    tagline: string;
    kicker: string;
    intro: string;
    promoKicker: string;
    promoTitle: string;
    promoTag: string;
    promoCta: string;
  };
  about: {
    title: string;
    subtitle: string;
    sawitoName: string;
    sawitoAlias: string;
    occupation: string;
    occupationVal: string;
    marksLabel: string;
    sawitoMarks: string;
    associateLabel: string;
    sawitoAssociate: string;
    statusLabel: string;
    sawitoStatus: string;
    dogName: string;
    dogAlias: string;
    breedLabel: string;
    breedVal: string;
    dogMarks: string;
    dogAssociate: string;
    dogStatus: string;
    rapSheetTitle: string;
    confidential: string;
  };
  rapSheet: RapSheetEntry[];
  story: {
    kicker: string;
    title: string;
    exhibit: string;
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    adventuresKicker: string;
    wantMoreTitle: string;
    wantMoreBody: string;
    wantMoreCta: string;
    footer: string;
  };
  adventures: AdventureEntry[];
  pigeon: {
    kicker: string;
    title: string;
    locationLabel: string;
    locationVal: string;
    suspectLabel: string;
    suspectVal: string;
    witnessLabel: string;
    witnessVal: string;
    motiveLabel: string;
    motiveVal: string;
    p1: string;
    p2: string;
    stamp: string;
  };
  couch: {
    kicker: string;
    title: string;
    locationLabel: string;
    locationVal: string;
    suspectLabel: string;
    suspectVal: string;
    witnessLabel: string;
    witnessVal: string;
    motiveLabel: string;
    motiveVal: string;
    p1: string;
    p2: string;
    exhibitBCaption: string;
    exhibitCCaption: string;
    stamp: string;
  };
  trainRide: {
    kicker: string;
    title: string;
    locationLabel: string;
    locationVal: string;
    suspectLabel: string;
    suspectVal: string;
    witnessLabel: string;
    witnessVal: string;
    motiveLabel: string;
    motiveVal: string;
    p1: string;
    p2: string;
    exhibitBCaption: string;
    exhibitCCaption: string;
    exhibitDCaption: string;
    exhibitECaption: string;
    exhibitFCaption: string;
    stamp: string;
  };
  blog: {
    title: string;
    subtitle: string;
  };
  blogPosts: BlogPost[];
  shop: {
    title: string;
    subtitle: string;
    notForSale: string;
  };
  shopItems: ShopItem[];
  footer: string;
}

const CONTENT: Record<Lang, SiteContent> = {
  en: {
    nav: { home: 'HOME', about: 'ABOUT', story: 'THE STORY OF A CRIMINAL', stories: 'CASE FILES', pigeon: 'ONE PIGEON, ONE BALCONY', couch: 'THE COUCH', trainRide: 'TRAIN RIDE', blog: 'BLOG', shop: 'SHOP' },
    home: {
      wanted: 'WANTED', fileNo: 'FILE NO. 001-CR',
      tagline: 'Sawito & Le Criminel — wanted, questioned, and mostly forgiven',
      kicker: '— local operation, two suspects —',
      intro: 'One man, one dog, one shared disregard for the rules of polite society. Browse the file below — the record speaks for itself.',
      promoKicker: 'NOW IN THE EVIDENCE LOCKER',
      promoTitle: 'BRUX GANG — "THUG LIFE, NO RULES"',
      promoTag: 'The mixtape nobody asked for. Cover art by a certain Spooky-something.',
      promoCta: 'VIEW IN SHOP',
    },
    about: {
      title: 'ABOUT THE SUSPECTS', subtitle: 'Case file 001-CR — subjects identified below',
      sawitoName: 'SAWITO', sawitoAlias: 'ALIAS: "THE OLD MAN UPSTAIRS"',
      occupation: 'OCCUPATION', occupationVal: 'Chief Enabler',
      marksLabel: 'MARKS', sawitoMarks: 'Silver beard, permanent cigarette, aviators worn indoors and out',
      associateLabel: 'ASSOCIATE', sawitoAssociate: 'Le Criminel (inseparable, unrepentant)',
      statusLabel: 'STATUS', sawitoStatus: 'At large. Believed armed with treats.',
      dogName: 'LE CRIMINEL', dogAlias: 'ALIAS: "THE BALCONY BANDIT"',
      breedLabel: 'BREED', breedVal: 'Boston Terrier, allegedly',
      dogMarks: 'Black & white patches, tactical collar, unbothered expression',
      dogAssociate: 'Sawito (handler, of sorts)',
      dogStatus: 'Wanted re: the balcony incident. See file.',
      rapSheetTitle: 'RAP SHEET', confidential: 'CONFIDENTIAL',
    },
    rapSheet: [
      { case: 'CASE 001', charge: 'Repeated failure to yield right-of-way on shared walking paths.' },
      { case: 'CASE 002', charge: 'Possession of unauthorized enthusiasm near the mail carrier.' },
      { case: 'CASE 003', charge: 'Conspiracy to bury evidence (one sock, backyard, unresolved).' },
      { case: 'CASE 004', charge: 'Disturbing the peace, 6:15 AM, daily, no signs of stopping.' },
      { case: 'CASE 005', charge: 'Assault with a deadly tail-wag.' },
    ],
    story: {
      kicker: 'Case file 001-CR — background', title: 'THE STORY OF A CRIMINAL',
      exhibit: 'EXHIBIT A — SUBJECT AT LARGE',
      p1: 'Every name has an origin, and this one has a paper trail. The dog was not born "Le Criminel." He was born, as far as anyone can prove, a perfectly ordinary puppy with no criminal record whatsoever.',
      p2: 'The name arrived later, earned one small offense at a time: a stolen sock here, a chewed remote there, a sofa cushion that did not survive the summer. No single act warranted a file. Together, they warranted a nickname.',
      p3: 'It was Sawito who first said it, half under his breath, watching the dog trot away from a crime scene with the calm of someone who had never once been caught: "Ce chien, c’est un criminel." The name stuck the way nicknames do — not chosen, just true.',
      p4: 'He has never been formally charged. He has never shown remorse. The investigation, such as it is, remains open.',
      adventuresKicker: 'SELECTED CASE FILES',
      wantMoreTitle: 'WANT TO KNOW MORE?',
      wantMoreBody: 'The full case log is updated monthly, every offense on the record.',
      wantMoreCta: 'READ THE CASE LOG',
      footer: 'FILED UNDER: LOCAL LEGENDS, UNVERIFIED',
    },
    adventures: [
      { title: 'ONE PIGEON, ONE BALCONY', teaser: 'A pigeon, a balcony, and one very bad decision made at speed.', link: '/pigeon', image: 'assets/images/dog-close-lap.jpg' },
      { title: 'THE COUCH', teaser: 'A slow, deliberate demolition. The corner did not survive.', link: '/couch', image: 'assets/images/couch-crime-scene.jpg' },
      { title: 'TRAIN RIDE', teaser: 'Neither suspect can legally drive, so they take the train.', link: '/train-ride', image: 'assets/images/train-window-view.jpg' },
    ],
    pigeon: {
      kicker: 'Incident report', title: 'ONE PIGEON, ONE BALCONY',
      locationLabel: 'LOCATION', locationVal: 'Second-floor balcony, undisclosed address',
      suspectLabel: 'SUSPECT', suspectVal: 'Le Criminel',
      witnessLabel: 'WITNESS', witnessVal: 'Sawito (present, unable to intervene in time)',
      motiveLabel: 'MOTIVE', motiveVal: 'One (1) pigeon, standing where it should not have',
      p1: 'Suspect observed a pigeon at close range and, without consulting anyone, made a decision. He left the balcony at speed and without a plan. Gravity was involved. The pigeon was not caught. The dog was fine.',
      p2: 'Sawito was not fine. Some hair was lost in the ensuing panic — his own, not the dog’s — and has not been recovered.',
      stamp: 'CASE CLOSED — NO CHARGES FILED',
    },
    couch: {
      kicker: 'Property damage report', title: 'THE COUCH',
      locationLabel: 'LOCATION', locationVal: 'Living room, southeast corner, formerly upholstered',
      suspectLabel: 'SUSPECT', suspectVal: 'Le Criminel',
      witnessLabel: 'WITNESS', witnessVal: 'Sawito (present throughout, filed no report)',
      motiveLabel: 'MOTIVE', motiveVal: 'One (1) loose thread, deemed unacceptable',
      p1: 'It began, as these things do, with a single thread. Subject located it, pulled it, and discovered — with what investigators can only describe as professional satisfaction — that more thread followed. Progress was slow, deliberate, and entirely undocumented until it was far too late to intervene.',
      p2: 'By the time the damage was noticed, the corner had been reduced to bare frame and loose stuffing, with a support cable exposed and, apparently, thoroughly inspected. Subject was found at the scene moments later, one eye lit up by the camera flash, a rope toy held nearby as if to suggest he had simply been passing through.',
      exhibitBCaption: 'EXHIBIT B — CLOSE-UP OF THE DAMAGE',
      exhibitCCaption: 'EXHIBIT C — SUSPECT NEARBY, EXPRESSION UNREADABLE',
      stamp: 'COUCH DECLARED A TOTAL LOSS — SUBJECT UNBOTHERED',
    },
    trainRide: {
      kicker: 'Travel log', title: 'TRAIN RIDE',
      locationLabel: 'LOCATION', locationVal: 'Regional rail, destinations: countryside & coast',
      suspectLabel: 'SUSPECT', suspectVal: 'Le Criminel (frequent traveler)',
      witnessLabel: 'WITNESS', witnessVal: 'Sawito (technically blind, bought the tickets anyway)',
      motiveLabel: 'MOTIVE', motiveVal: 'Fresh air, mostly. Seagulls, specifically.',
      p1: 'Neither suspect is permitted behind the wheel of a vehicle, for entirely different and equally disqualifying reasons: Sawito is, by his own admission, technically blind, and Le Criminel has never been issued so much as a bicycle license. The train was arrived at not as a lifestyle choice but as the only remaining option, and it has worked out better than anyone expected.',
      p2: 'Two destinations are on record: the countryside, and the coast. Both were well received. The coast, however, is the clear favorite, on account of the seagulls, which Subject regards as a personal challenge rather than local wildlife. He has never caught one. He has also never stopped trying, and spent a significant portion of one journey with his nose pressed to the window, plotting.',
      exhibitBCaption: 'EXHIBIT B — SETTLED IN FOR THE RIDE',
      exhibitCCaption: 'EXHIBIT C — CONDUCTING A FLOOR-LEVEL INSPECTION',
      exhibitDCaption: 'EXHIBIT D — COUNTRYSIDE, PASSING AT SPEED',
      exhibitECaption: 'EXHIBIT E — NOSE TO THE GLASS, SOMEWHERE BETWEEN STATIONS',
      exhibitFCaption: 'EXHIBIT F — LANDFALL AT THE COAST',
      stamp: 'DESTINATION: WHEREVER HAS SEAGULLS',
    },
    blog: { title: 'CASE LOG', subtitle: '24 monthly entries — two years of continuous surveillance, case 001-CR remains open' },
    blogPosts: [
      { date: 'JUL 2024', case: 'CASE LOG 001', title: 'THE DAY THE HUMAN WAS FOUND', body: 'Encountered on the street, no leash, no plan, no apparent owner. Subject sniffed him twice, sat down in front of him, and refused to move until arrangements were made. Arrangements were made. Subject has been supervising him ever since.', image: 'assets/images/blog-cheek-to-cheek.jpg' },
      { date: 'AUG 2024', case: 'CASE LOG 002', title: 'FIRST NIGHT INCIDENT', body: 'One shoe entered the premises. One shoe left in recognizable condition. Investigation into the other shoe ongoing.', image: 'assets/images/blog-shoe-inspection.jpg' },
      { date: 'SEP 2024', case: 'CASE LOG 003', title: 'HABITUAL CURTAIN SURVEILLANCE', body: 'Subject has taken up a fixed position on the back of the couch, curtain pulled aside with one paw, monitoring the street for unauthorized pedestrians, cyclists, and the occasional pigeon. Shift pattern: near-constant.', image: 'assets/images/blog-couch-lookout.jpg' },
      { date: 'OCT 2024', case: 'CASE LOG 004', title: 'UNAUTHORIZED KITCHEN ENTRY', body: 'Subject observed standing fully inside the kitchen despite no invitation ever being extended. Denies knowledge of the word "out."', image: 'assets/images/blog-shop-entry.jpg' },
      { date: 'NOV 2024', case: 'CASE LOG 005', title: 'SOCK THEFT RING UNCOVERED', body: 'Seven odd socks recovered from beneath the bed. Subject present at scene, visibly unbothered by the evidence.', image: 'assets/images/blog-shoulder-selfie.jpg' },
      { date: 'DEC 2024', case: 'CASE LOG 006', title: 'HOLIDAY DISTURBANCE', body: 'One ornament down. Tree remains standing, for now. Subject claims the ornament "moved first."', image: 'assets/images/blog-bee-costume.jpg' },
      { date: 'JAN 2025', case: 'CASE LOG 007', title: "NEW YEAR'S RESOLUTION VIOLATED", body: 'Owner resolved to enforce the no-couch rule. Resolution lasted four hours. Subject has resumed full occupancy.', image: 'assets/images/blog-couch-cuddle-selfie.jpg' },
      { date: 'FEB 2025', case: 'CASE LOG 008', title: 'FIRST SIGHTING OF SUSPECT PIKETTE', body: 'A cat, name of Pikette, was observed on the premises. Both parties became instantly and mutually furious. Cause unknown, tradition since established.', image: 'assets/images/pikette-windowsill.jpg' },
      { date: 'MAR 2025', case: 'CASE LOG 009', title: 'ATTEMPTED NEGOTIATION WITH THE MAILMAN', body: 'Subject approached mail carrier with intent unclear. Negotiations broke down within seconds. Mail was, eventually, delivered.', image: 'assets/images/blog-mailman-standoff.jpg' },
      { date: 'APR 2025', case: 'CASE LOG 010', title: 'THE BALCONY INCIDENT', body: 'Full report filed separately under "One Pigeon, One Balcony." Referenced here for completeness of the record.' },
      { date: 'MAY 2025', case: 'CASE LOG 011', title: 'CASE OF THE MISSING REMOTE', body: 'Remote control last seen in subject’s vicinity. Recovered three days later under the radiator, teeth marks consistent with prior offenses.', image: 'assets/images/blog-bed-nap.jpg' },
      { date: 'JUN 2025', case: 'CASE LOG 012', title: 'PIKETTE RETURNS, TENSIONS UNCHANGED', body: 'Second visit from suspect Pikette. Both parties resumed hostilities exactly where they left off, as if no time had passed.', image: 'assets/images/pikette-dog-couch.jpg' },
      { date: 'JUL 2025', case: 'CASE LOG 013', title: 'ONE YEAR IN CUSTODY, NO IMPROVEMENT NOTED', body: 'Twelve-month review complete. Subject has made no measurable progress toward good behavior. Has, however, become impossible to imagine living without.', image: 'assets/images/blog-garden-wall.jpg' },
      { date: 'AUG 2025', case: 'CASE LOG 014', title: 'SUBJECT UNDERGOES SURGICAL INTERVENTION', body: 'Subject was neutered this month. Procedure successful, dignity did not survive the cone of shame. Behavior entirely unaffected.', image: 'assets/images/blog-park-walk.jpg' },
      { date: 'SEP 2025', case: 'CASE LOG 015', title: 'RECOVERY PERIOD, MOOD UNCHANGED', body: 'Cone removed. Subject celebrated by immediately resuming all previously banned activities at full capacity.', image: 'assets/images/blog-full-capacity.jpg' },
      { date: 'OCT 2025', case: 'CASE LOG 016', title: 'PIKETTE CONFRONTATION, ROUND THREE', body: 'Surgery has not cooled hostilities with suspect Pikette. If anything, subject appears to hold a grudge on principle alone.', image: 'assets/images/pikette-couch-visit.jpg' },
      { date: 'NOV 2025', case: 'CASE LOG 017', title: 'BLANKET HOARDING INDICTMENT', body: 'All soft furnishings in the household have been relocated to a single pile, currently under subject’s exclusive control.', image: 'assets/images/blog-blanket-hoard.jpg' },
      { date: 'DEC 2025', case: 'CASE LOG 018', title: 'HOLIDAY DISTURBANCE, ROUND TWO', body: 'Second ornament down. Subject denies pattern of behavior, cites "coincidence" as defense.' },
      { date: 'JAN 2026', case: 'CASE LOG 019', title: 'ESCAPE ATTEMPT FOILED AT THE DOOR', body: 'Subject made a break for the open front door. Recaptured on the front steps. No injuries, mild embarrassment on both sides.', image: 'assets/images/blog-front-door-recapture.jpg' },
      { date: 'FEB 2026', case: 'CASE LOG 020', title: 'SUSPECT PIKETTE, SURVEILLANCE PHOTO ON FILE', body: 'Suspect Pikette photographed at close range during a visit. Both parties remain, for reasons unclear, unable to coexist peacefully.', image: 'assets/images/pikette-closeup.jpg' },
      { date: 'MAR 2026', case: 'CASE LOG 021', title: 'INTERROGATION RE: MISSING SANDWICH', body: 'One sandwich, unattended for ninety seconds, has not been recovered. Subject was in the room. Subject will not confirm or deny.', image: 'assets/images/blog-cafe-standoff.jpg' },
      { date: 'APR 2026', case: 'CASE LOG 022', title: 'NEIGHBOR FILES FORMAL COMPLAINT', body: 'Complaint received re: excessive barking at 6:15 AM. Subject has been formally warned. Subject has not changed his schedule.', image: 'assets/images/blog-frosty-morning.jpg' },
      { date: 'MAY 2026', case: 'CASE LOG 023', title: 'FULL LIFE TAKEOVER, ASSESSMENT COMPLETE', body: 'Subject now controls the bed, the schedule, the snacks, and most major decisions. Owner’s independence status: revoked.', image: 'assets/images/blog-waffle-watch.jpg' },
      { date: 'JUN 2026', case: 'CASE LOG 024', title: 'TWO-YEAR STATUS REVIEW', body: 'Two years since intake. No reform. No regrets either. Even suspect Pikette, on a rare quiet evening, was found sharing the couch. Case remains open.', image: 'assets/images/blog-belly-flop.jpg' },
    ],
    shop: { title: 'SHOP', subtitle: 'Evidence locker — display only, nothing here is for sale', notForSale: 'NOT FOR SALE' },
    shopItems: [
      { name: 'Brux Gang — "Thug Life, No Rules" (Mixtape)', tag: 'Parental advisory. Cover art by a certain Spooky-something.', price: '$14', image: 'assets/images/shop-brux-gang.jpg' },
      { name: 'WANTED Tee', tag: 'Cotton, unisex, guilty by association', price: '$32' },
      { name: '"Okayest Criminal" Mug', tag: 'Ceramic, holds coffee and grudges', price: '$18' },
      { name: 'Balcony Incident Poster', tag: 'Commemorative print, framed separately', price: '$45' },
      { name: 'Case File Sticker Pack', tag: 'Set of 5, vinyl, weatherproof', price: '$9' },
    ],
    footer: '© THE THIEFFRY CRIMINALS — FILE REMAINS OPEN. ALL RIGHTS RESERVED (ALLEGEDLY).',
  },

  fr: {
    nav: { home: 'ACCUEIL', about: 'À PROPOS', story: "L'HISTOIRE D'UN CRIMINEL", stories: 'DOSSIERS', pigeon: 'UN PIGEON, UN BALCON', couch: 'LE CANAPÉ', trainRide: 'EN TRAIN', blog: 'BLOG', shop: 'BOUTIQUE' },
    home: {
      wanted: 'RECHERCHÉ', fileNo: 'DOSSIER N° 001-CR',
      tagline: 'Sawito & Le Criminel — recherchés, interrogés, et globalement pardonnés',
      kicker: '— opération locale, deux suspects —',
      intro: "Un homme, un chien, un mépris commun des règles de la bonne société. Consultez le dossier ci-dessous — les faits parlent d'eux-mêmes.",
      promoKicker: 'NOUVEAU AU CASIER À PREUVES',
      promoTitle: 'BRUX GANG — « THUG LIFE, NO RULES »',
      promoTag: 'La mixtape que personne n’a demandée. Pochette signée par un certain Spooky-quelque-chose.',
      promoCta: 'VOIR EN BOUTIQUE',
    },
    about: {
      title: 'À PROPOS DES SUSPECTS', subtitle: 'Dossier 001-CR — suspects identifiés ci-dessous',
      sawitoName: 'SAWITO', sawitoAlias: 'ALIAS : « LE VIEUX D’EN HAUT »',
      occupation: 'PROFESSION', occupationVal: 'Complice en chef',
      marksLabel: 'SIGNES PARTICULIERS', sawitoMarks: 'Barbe argentée, cigarette permanente, lunettes aviateur portées jour et nuit',
      associateLabel: 'COMPLICE', sawitoAssociate: 'Le Criminel (inséparable, impénitent)',
      statusLabel: 'STATUT', sawitoStatus: 'En cavale. Présumé armé de friandises.',
      dogName: 'LE CRIMINEL', dogAlias: 'ALIAS : « LE BANDIT DU BALCON »',
      breedLabel: 'RACE', breedVal: 'Boston Terrier, semble-t-il',
      dogMarks: 'Taches noires et blanches, collier tactique, air impassible',
      dogAssociate: 'Sawito (dresseur, en théorie)',
      dogStatus: "Recherché pour l'incident du balcon. Voir dossier.",
      rapSheetTitle: 'CASIER JUDICIAIRE', confidential: 'CONFIDENTIEL',
    },
    rapSheet: [
      { case: 'CASE 001', charge: 'Refus répété de céder le passage sur les sentiers partagés.' },
      { case: 'CASE 002', charge: "Possession d'enthousiasme non autorisé à proximité du facteur." },
      { case: 'CASE 003', charge: "Complot visant à enterrer des preuves (une chaussette, jardin, affaire non résolue)." },
      { case: 'CASE 004', charge: "Trouble à l'ordre public, 6h15, quotidien, sans signe d'arrêt." },
      { case: 'CASE 005', charge: 'Coups et blessures à coups de queue frétillante.' },
    ],
    story: {
      kicker: 'Dossier 001-CR — contexte', title: "L'HISTOIRE D'UN CRIMINEL",
      exhibit: 'PIÈCE A — SUJET EN LIBERTÉ',
      p1: "Tout nom a une origine, et celui-ci a son dossier. Le chien n'est pas né « Le Criminel ». Il est né, à toutes fins vérifiables, un chiot parfaitement ordinaire, sans le moindre casier judiciaire.",
      p2: "Le nom est arrivé plus tard, gagné petit délit après petit délit : une chaussette volée ici, une télécommande mâchée là, un coussin de canapé qui n'a pas survécu à l'été. Aucun acte à lui seul ne justifiait un dossier. Ensemble, ils justifiaient un surnom.",
      p3: "C'est Sawito qui l'a dit le premier, à moitié dans sa barbe, en regardant le chien s'éloigner d'une scène de crime avec le calme de quelqu'un qui ne s'est jamais fait prendre : « Ce chien, c'est un criminel. » Le nom est resté comme restent les surnoms — non choisi, simplement vrai.",
      p4: "Il n'a jamais été formellement inculpé. Il n'a jamais montré le moindre remords. L'enquête, telle qu'elle est, reste ouverte.",
      adventuresKicker: 'DOSSIERS SÉLECTIONNÉS',
      wantMoreTitle: 'ENVIE D’EN SAVOIR PLUS ?',
      wantMoreBody: 'Le journal de bord complet est mis à jour chaque mois, chaque délit consigné.',
      wantMoreCta: 'LIRE LE JOURNAL DE BORD',
      footer: 'CLASSÉ SOUS : LÉGENDES LOCALES, NON VÉRIFIÉES',
    },
    adventures: [
      { title: 'UN PIGEON, UN BALCON', teaser: 'Un pigeon, un balcon, et une très mauvaise décision prise à toute vitesse.', link: '/pigeon', image: 'assets/images/dog-close-lap.jpg' },
      { title: 'LE CANAPÉ', teaser: "Une démolition lente et méthodique. Le coin n'a pas survécu.", link: '/couch', image: 'assets/images/couch-crime-scene.jpg' },
      { title: 'EN TRAIN', teaser: 'Aucun des deux suspects ne peut légalement conduire, alors ils prennent le train.', link: '/train-ride', image: 'assets/images/train-window-view.jpg' },
    ],
    pigeon: {
      kicker: "Rapport d'incident", title: 'UN PIGEON, UN BALCON',
      locationLabel: 'LIEU', locationVal: 'Balcon du deuxième étage, adresse non divulguée',
      suspectLabel: 'SUSPECT', suspectVal: 'Le Criminel',
      witnessLabel: 'TÉMOIN', witnessVal: "Sawito (présent, n'a pu intervenir à temps)",
      motiveLabel: 'MOBILE', motiveVal: "Un (1) pigeon, posté là où il n'aurait pas dû",
      p1: "Le suspect a observé un pigeon de près et, sans consulter personne, a pris une décision. Il a quitté le balcon à grande vitesse et sans plan. La gravité s'en est mêchée. Le pigeon n'a pas été attrapé. Le chien allait bien.",
      p2: "Sawito, lui, n'allait pas bien. Des cheveux ont été perdus dans la panique qui a suivi — les siens, pas ceux du chien — et n'ont jamais été retrouvés.",
      stamp: 'AFFAIRE CLASSÉE — AUCUNE POURSUITE ENGAGÉE',
    },
    couch: {
      kicker: 'Rapport de dégradation', title: 'LE CANAPÉ',
      locationLabel: 'LIEU', locationVal: 'Salon, coin sud-est, autrefois rembourré',
      suspectLabel: 'SUSPECT', suspectVal: 'Le Criminel',
      witnessLabel: 'TÉMOIN', witnessVal: "Sawito (présent du début à la fin, n'a déposé aucun rapport)",
      motiveLabel: 'MOBILE', motiveVal: 'Un (1) fil qui dépassait, jugé inacceptable',
      p1: "Tout a commencé, comme souvent, par un simple fil. Le suspect l'a repéré, tiré, et découvert — avec ce que les enquêteurs ne peuvent décrire que comme une satisfaction professionnelle — qu'un autre fil suivait. Les progrès ont été lents, méthodiques, et totalement passés inaperçus jusqu'à ce qu'il soit trop tard pour intervenir.",
      p2: "Au moment où les dégâts ont été constatés, le coin du canapé était réduit à l'armature et au rembourrage, avec un câble de suspension mis à nu et, semble-t-il, inspecté de près. Le suspect a été retrouvé sur les lieux quelques instants plus tard, un œil éclairé par le flash, une corde à jouer à proximité, comme pour suggérer qu'il ne faisait que passer par là.",
      exhibitBCaption: 'PIÈCE B — GROS PLAN SUR LES DÉGÂTS',
      exhibitCCaption: 'PIÈCE C — SUSPECT À PROXIMITÉ, EXPRESSION INDÉCHIFFRABLE',
      stamp: "CANAPÉ DÉCLARÉ PERTE TOTALE — LE SUJET N'EST PAS ÉMU",
    },
    trainRide: {
      kicker: 'Carnet de voyage', title: 'EN TRAIN',
      locationLabel: 'LIEU', locationVal: 'Réseau ferroviaire régional, destinations : campagne et côte',
      suspectLabel: 'SUSPECT', suspectVal: 'Le Criminel (voyageur régulier)',
      witnessLabel: 'TÉMOIN', witnessVal: 'Sawito (techniquement aveugle, a acheté les billets quand même)',
      motiveLabel: 'MOBILE', motiveVal: "De l'air frais, surtout. Des mouettes, plus précisément.",
      p1: "Aucun des deux suspects n'est autorisé à prendre le volant, pour des raisons entièrement différentes et tout aussi disqualifiantes : Sawito est, de son propre aveu, techniquement aveugle, et Le Criminel n'a jamais obtenu ne serait-ce qu'un permis de vélo. Le train n'a pas été choisi par style de vie, mais comme la seule option restante — et cela s'est avéré mieux fonctionner que prévu.",
      p2: "Deux destinations sont au dossier : la campagne, et la côte. Les deux ont été bien accueillies. La côte reste cependant la favorite incontestée, à cause des mouettes, que le sujet considère comme un défi personnel plutôt que comme de la faune locale. Il n'en a jamais attrapé une. Il n'a pas non plus cessé d'essayer, et a passé une bonne partie d'un trajet le nez collé à la vitre, en pleine planification.",
      exhibitBCaption: 'PIÈCE B — INSTALLÉ POUR LE TRAJET',
      exhibitCCaption: 'PIÈCE C — INSPECTION AU RAS DU SOL',
      exhibitDCaption: 'PIÈCE D — LA CAMPAGNE, À TOUTE VITESSE',
      exhibitECaption: 'PIÈCE E — LE NEZ CONTRE LA VITRE, QUELQUE PART ENTRE DEUX GARES',
      exhibitFCaption: 'PIÈCE F — ARRIVÉE SUR LA CÔTE',
      stamp: 'DESTINATION : LÀ OÙ IL Y A DES MOUETTES',
    },
    blog: { title: 'JOURNAL DE BORD', subtitle: 'Dossier 001-CR — 24 entrées mensuelles, deux ans de surveillance continue, le dossier reste ouvert' },
    blogPosts: [
      { date: 'JUL 2024', case: 'CASE LOG 001', title: "LE JOUR OÙ L'HUMAIN A ÉTÉ TROUVÉ", body: "Repéré dans la rue, sans laisse, sans plan, sans propriétaire apparent. Le sujet l'a reniflé deux fois, s'est assis devant lui, et a refusé de bouger tant qu'aucun arrangement n'était pris. Un arrangement a été pris. Le sujet le supervise depuis.", image: 'assets/images/blog-cheek-to-cheek.jpg' },
      { date: 'AUG 2024', case: 'CASE LOG 002', title: 'INCIDENT DE LA PREMIÈRE NUIT', body: 'Une chaussure est entrée dans les lieux. Une chaussure en est ressortie dans un état reconnaissable. L’enquête sur l’autre chaussure se poursuit.', image: 'assets/images/blog-shoe-inspection.jpg' },
      { date: 'SEP 2024', case: 'CASE LOG 003', title: 'SURVEILLANCE HABITUELLE DES RIDEAUX', body: 'Le sujet a pris position de façon permanente sur le dossier du canapé, rideau écarté d’une patte, pour surveiller la rue à la recherche de piétons, cyclistes et pigeons non autorisés. Rythme de surveillance : quasi permanent.', image: 'assets/images/blog-couch-lookout.jpg' },
      { date: 'OCT 2024', case: 'CASE LOG 004', title: 'ENTRÉE NON AUTORISÉE EN CUISINE', body: 'Le sujet a été observé se tenant entièrement dans la cuisine sans y avoir jamais été invité. Nie toute connaissance du mot « dehors ».', image: 'assets/images/blog-shop-entry.jpg' },
      { date: 'NOV 2024', case: 'CASE LOG 005', title: 'RÉSEAU DE VOL DE CHAUSSETTES DÉMANTELÉ', body: 'Sept chaussettes dépareillées récupérées sous le lit. Sujet présent sur les lieux, visiblement indifférent aux preuves.', image: 'assets/images/blog-shoulder-selfie.jpg' },
      { date: 'DEC 2024', case: 'CASE LOG 006', title: 'TROUBLES DES FÊTES', body: 'Une décoration à terre. Le sapin tient encore, pour l’instant. Le sujet affirme que la décoration « a bougé la première ».', image: 'assets/images/blog-bee-costume.jpg' },
      { date: 'JAN 2025', case: 'CASE LOG 007', title: "RÉSOLUTION DU NOUVEL AN VIOLÉE", body: 'Le propriétaire avait résolu de faire respecter l’interdiction du canapé. La résolution a tenu quatre heures. Le sujet a repris possession des lieux.', image: 'assets/images/blog-couch-cuddle-selfie.jpg' },
      { date: 'FEB 2025', case: 'CASE LOG 008', title: 'PREMIÈRE APPARITION DE LA SUSPECTE PIKETTE', body: 'Une chatte, du nom de Pikette, a été aperçue sur les lieux. Les deux parties sont instantanément devenues mutuellement furieuses. Cause inconnue, tradition depuis établie.', image: 'assets/images/pikette-windowsill.jpg' },
      { date: 'MAR 2025', case: 'CASE LOG 009', title: 'TENTATIVE DE NÉGOCIATION AVEC LE FACTEUR', body: 'Le sujet a approché le facteur avec des intentions floues. Les négociations ont échoué en quelques secondes. Le courrier a, finalement, été livré.', image: 'assets/images/blog-mailman-standoff.jpg' },
      { date: 'APR 2025', case: 'CASE LOG 010', title: "L'INCIDENT DU BALCON", body: 'Rapport complet déposé séparément sous « Un Pigeon, Un Balcon ». Référencé ici pour l’exhaustivité du dossier.' },
      { date: 'MAY 2025', case: 'CASE LOG 011', title: "L'AFFAIRE DE LA TÉLÉCOMMANDE DISPARUE", body: 'Télécommande vue pour la dernière fois à proximité du sujet. Retrouvée trois jours plus tard sous le radiateur, traces de dents conformes aux délits précédents.', image: 'assets/images/blog-bed-nap.jpg' },
      { date: 'JUN 2025', case: 'CASE LOG 012', title: 'RETOUR DE PIKETTE, TENSIONS INCHANGÉES', body: 'Deuxième visite de la suspecte Pikette. Les deux parties ont repris les hostilités exactement là où elles les avaient laissées, comme si aucun temps n’avait passé.', image: 'assets/images/pikette-dog-couch.jpg' },
      { date: 'JUL 2025', case: 'CASE LOG 013', title: 'UN AN EN GARDE, AUCUNE AMÉLIORATION CONSTATÉE', body: 'Bilan des douze mois terminé. Le sujet n’a fait aucun progrès mesurable vers un bon comportement. Est cependant devenu impossible à imaginer absent du foyer.', image: 'assets/images/blog-garden-wall.jpg' },
      { date: 'AUG 2025', case: 'CASE LOG 014', title: 'LE SUJET SUBIT UNE INTERVENTION CHIRURGICALE', body: 'Le sujet a été castré ce mois-ci. Intervention réussie, la dignité n’a pas survécu à la collerette de la honte. Comportement totalement inchangé.', image: 'assets/images/blog-park-walk.jpg' },
      { date: 'SEP 2025', case: 'CASE LOG 015', title: 'PÉRIODE DE CONVALESCENCE, HUMEUR INCHANGÉE', body: 'Collerette retirée. Le sujet a célébré en reprenant immédiatement toutes les activités précédemment interdites, à pleine capacité.', image: 'assets/images/blog-full-capacity.jpg' },
      { date: 'OCT 2025', case: 'CASE LOG 016', title: 'CONFRONTATION AVEC PIKETTE, ROUND TROIS', body: 'L’opération n’a pas calmé les hostilités avec la suspecte Pikette. Le sujet semble même entretenir une rancune par pur principe.', image: 'assets/images/pikette-couch-visit.jpg' },
      { date: 'NOV 2025', case: 'CASE LOG 017', title: 'MISE EN ACCUSATION POUR ACCAPAREMENT DE COUVERTURES', body: 'Tous les textiles moelleux du foyer ont été relocalisés en une seule pile, actuellement sous le contrôle exclusif du sujet.', image: 'assets/images/blog-blanket-hoard.jpg' },
      { date: 'DEC 2025', case: 'CASE LOG 018', title: 'TROUBLES DES FÊTES, ROUND DEUX', body: 'Deuxième décoration à terre. Le sujet nie tout comportement récurrent, invoquant la « coïncidence » pour sa défense.' },
      { date: 'JAN 2026', case: 'CASE LOG 019', title: "TENTATIVE D'ÉVASION DÉJOUÉE À LA PORTE", body: "Le sujet a tenté de s’échapper par la porte d’entrée ouverte. Repris sur le perron. Aucune blessure, léger embarras des deux côtés.", image: 'assets/images/blog-front-door-recapture.jpg' },
      { date: 'FEB 2026', case: 'CASE LOG 020', title: 'SUSPECTE PIKETTE, PHOTO DE SURVEILLANCE AU DOSSIER', body: 'La suspecte Pikette photographiée de près lors d’une visite. Les deux parties restent, pour des raisons obscures, incapables de coexister pacifiquement.', image: 'assets/images/pikette-closeup.jpg' },
      { date: 'MAR 2026', case: 'CASE LOG 021', title: 'INTERROGATOIRE : SANDWICH DISPARU', body: 'Un sandwich, laissé sans surveillance pendant quatre-vingt-dix secondes, n’a pas été retrouvé. Le sujet était présent dans la pièce. Le sujet refuse de confirmer ou d’infirmer.', image: 'assets/images/blog-cafe-standoff.jpg' },
      { date: 'APR 2026', case: 'CASE LOG 022', title: "PLAINTE OFFICIELLE D'UN VOISIN", body: 'Plainte reçue concernant des aboiements excessifs à 6h15. Le sujet a reçu un avertissement officiel. Le sujet n’a pas changé ses horaires.', image: 'assets/images/blog-frosty-morning.jpg' },
      { date: 'MAY 2026', case: 'CASE LOG 023', title: 'PRISE DE CONTRÔLE TOTALE DE LA VIE, BILAN ÉTABLI', body: 'Le sujet contrôle désormais le lit, l’emploi du temps, les collations, et la plupart des décisions importantes. Statut d’indépendance du propriétaire : révoqué.', image: 'assets/images/blog-waffle-watch.jpg' },
      { date: 'JUN 2026', case: 'CASE LOG 024', title: 'BILAN DES DEUX ANS', body: 'Deux ans depuis la prise en charge. Aucune réforme. Aucun regret non plus. Même la suspecte Pikette, lors d’une rare soirée calme, a été retrouvée partageant le canapé. Le dossier reste ouvert.', image: 'assets/images/blog-belly-flop.jpg' },
    ],
    shop: { title: 'BOUTIQUE', subtitle: 'Casier à preuves — présentation uniquement, rien n’est à vendre ici', notForSale: 'PAS À VENDRE' },
    shopItems: [
      { name: 'Brux Gang — « Thug Life, No Rules » (Mixtape)', tag: 'Avertissement parental. Pochette signée par un certain Spooky-quelque-chose.', price: '$14', image: 'assets/images/shop-brux-gang.jpg' },
      { name: 'T-shirt RECHERCHÉ', tag: 'Coton, unisexe, coupable par association', price: '$32' },
      { name: 'Mug « Criminel Moyen »', tag: 'Céramique, contient le café et les rancunes', price: '$18' },
      { name: "Affiche de l'Incident du Balcon", tag: 'Impression commémorative, cadre vendu séparément', price: '$45' },
      { name: 'Pack d’Autocollants Dossier', tag: 'Lot de 5, vinyle, résistant aux intempéries', price: '$9' },
    ],
    footer: '© THE THIEFFRY CRIMINALS — LE DOSSIER RESTE OUVERT. TOUS DROITS RÉSERVÉS (SOI-DISANT).',
  },
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly langSignal = signal<Lang>('en');

  readonly lang = this.langSignal.asReadonly();
  readonly t = computed(() => CONTENT[this.langSignal()]);

  setLang(lang: Lang): void {
    this.langSignal.set(lang);
  }
}
