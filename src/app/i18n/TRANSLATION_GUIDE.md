# Translation guide

Context for anyone (human or AI) translating `en.content.ts` into a new locale file under `public/i18n/`. Nothing here is enforced by tooling except the "do not change" list, which `tools/validate-locales.mjs` checks structurally.

## Tone

The site is a deadpan, mock police-report / true-crime-dossier parody about a man ("Sawito") and his dog ("Le Criminel"). The joke is that utterly mundane pet misbehavior is narrated with the flat, bureaucratic gravity of a real criminal case file (CASE NO., EXHIBIT A, WITNESS, MOTIVE, etc.). Translations should keep that dry, deadpan register — avoid making it sound cute, jokey, or exclamatory in the target language, even where the literal content is silly.

## Do not translate (proper nouns / fixed terms)

- `SAWITO`, `LE CRIMINEL` — the two subjects' names, always left in the original.
- `Pikette` — the neighborhood cat's name.
- `Gaume` — a real place in southern Belgium.
- `Brux Gang` and the mixtape title `"THUG LIFE, NO RULES"` — kept as-is (English/stylized branding), same treatment as e.g. `dogAlias`/`sawitoAlias` are translated but the names themselves aren't.

## Do not change (structural — enforced by `tools/validate-locales.mjs`)

These fields must be byte-identical to the English source in every locale:
- `adventures[].link`, `adventures[].image`
- `blogPosts[].date`, `blogPosts[].case`, `blogPosts[].image`
- `shopItems[].price`, `shopItems[].image`, `shopItems[].videoId`, `shopItems[].slug`

Never rename JSON keys or change array lengths — run `node tools/validate-locales.mjs <locale>` after editing to confirm.

## Avoid overly literal legal vocabulary

The `rapSheet` charges are jokes built on real legal-report phrasing applied to absurd, harmless things (e.g. "Possession of unauthorized enthusiasm"). A technically-correct but narrow legal term in the target language can kill the joke if it's normally reserved for tangible things (e.g. Greek "κατοχή"/possession is normally used for contraband, not abstract nouns like enthusiasm — "επίδειξη"/display or exhibition, the term used for things like indecent exposure, lands better and is still real legal vocabulary). When translating these, prefer the legal term that a native speaker would find funny-because-plausible, even if it's not the most literal word-for-word match.

## Wordplay to preserve where possible

- `dogAlias` ("THE BALCONY BANDIT" in English) uses alliteration. Prefer an alliterative equivalent in the target language over a literal translation if one exists — e.g. Dutch used "De Balkonbandiet". Don't force it if there's no natural option; a plain accurate translation is better than a strained pun.
