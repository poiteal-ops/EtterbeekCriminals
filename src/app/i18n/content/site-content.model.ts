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
  videoId?: string;
  slug?: string;
  detail?: string[];
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
    promoVideoLink: string;
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
    aftermathCaption: string;
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
    previewLabel: string;
    playLabel: string;
    featuredKicker: string;
    itemKicker: string;
    disclaimerTitle: string;
    disclaimerBody: string;
    backToShop: string;
  };
  shopItems: ShopItem[];
  footer: string;
}
