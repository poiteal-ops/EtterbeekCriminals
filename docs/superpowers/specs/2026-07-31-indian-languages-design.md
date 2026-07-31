# Hindi, Tamil, and Marathi locale design

## Goal

Add complete Hindi, Tamil, and Marathi versions of all currently published site content. The new locales must behave like the existing non-English locales in navigation, routing, content loading, and generated SEO pages.

The locale codes are:

- Hindi: `hi`
- Tamil: `ta`
- Marathi: `mr`

## Translation approach

Translate directly from the English source in `src/app/i18n/content/en.content.ts` rather than translating through an existing secondary language. Use the native scripts for all three languages: Devanagari for Hindi and Marathi, and Tamil script for Tamil.

Preserve the site's dry, bureaucratic police-dossier tone. Follow `src/app/i18n/TRANSLATION_GUIDE.md`, including its guidance on idiomatic legal vocabulary, wordplay, and fixed names. Keep `SAWITO`, `LE CRIMINEL`, `Pikette`, `Gaume`, `Brux Gang`, and `THUG LIFE, NO RULES` unchanged.

The initial translations will be AI-drafted. Native-speaker review is recommended after delivery, but it is not a prerequisite for enabling the locales.

## Files and integration

Create these complete content packs under `public/i18n/`:

- `hi.json`
- `ta.json`
- `mr.json`

Each file will match the current `SiteContent` structure and array lengths. Locale-independent fields will remain byte-identical to the reference content, including links, image paths, dates, case identifiers, prices, video IDs, and slugs.

Add `hi`, `ta`, and `mr` to both `LOCALE_CODES` and `CONTENT_LOCALES` in `src/app/i18n/locale-registry.ts`. Existing language-selection, route-resolution, lazy-loading, and SEO-generation code will then consume them through the established locale registry; no new UI component or service is needed.

## Failure handling and safety

The existing translation service retains its English fallback if a locale file cannot be loaded. Validation must prevent missing keys, additional keys, wrong types, empty strings, array-length drift, and changes to invariant fields before the new packs are accepted.

The files contain static display content only. No secrets, personal data, executable markup, or runtime-generated HTML will be introduced.

## Verification

Before completion:

1. Run `node tools/validate-locales.mjs hi ta mr`.
2. Run the SEO test suite to verify registry and generated-locale parity.
3. Run the application test suite.
4. Run the production build, including post-build SEO generation.
5. Review the Git diff for accidental changes to existing locale content or the user's unrelated `.gitignore` modification.

Native-speaker review remains the only intentionally deferred quality check because structural and automated tests cannot judge idiomatic wording.
