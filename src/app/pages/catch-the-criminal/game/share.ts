import { TOTAL_LEVELS } from './levels';

const SHARE_ORIGIN = 'https://thieffrycriminals.be';

/** The canonical English game route; the default share target. */
export const SHARE_URL = `${SHARE_ORIGIN}/game/`;

export interface ShareTemplates { textReached: string; textComplete: string }

const ENGLISH_TEMPLATES: ShareTemplates = {
  textReached: 'I scored {score} and reached Level {level} of {total} in Catch the Criminal. Can you beat me?',
  textComplete: 'I scored {score} and cleared all {total} levels of Catch the Criminal. Can you beat me?',
};

/** Game route to share: the visitor's own language only when the game is really translated into it. */
export function buildShareUrl(locale: string, translated: boolean): string {
  return translated && /^[a-z]{2}$/.test(locale) && locale !== 'en' ? `${SHARE_ORIGIN}/${locale}/game/` : SHARE_URL;
}

const MAX_SCORE = 999_999;

export interface ShareLinks {
  x: string;
  facebook: string;
  whatsapp: string;
  bluesky: string;
}

function clamp(value: number, max: number, min = 0): number {
  const number = Number.isFinite(value) ? Math.floor(value) : min;
  return Math.min(max, Math.max(min, number));
}

/** Built from clamped integers and fixed copy only; no user-typed text can reach it. */
export function buildShareText(
  score: number, level: number, complete: boolean,
  templates: ShareTemplates = ENGLISH_TEMPLATES, locale = 'en',
): string {
  let points: string;
  try {
    points = clamp(score, MAX_SCORE).toLocaleString(locale === 'en' ? 'en-US' : locale);
  } catch {
    points = String(clamp(score, MAX_SCORE));
  }
  const values: Record<string, string> = { score: points, level: String(clamp(level, TOTAL_LEVELS, 1)), total: String(TOTAL_LEVELS) };
  const template = complete ? templates.textComplete : templates.textReached;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

function link(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  return url.toString();
}

export function buildShareLinks(text: string, url: string = SHARE_URL): ShareLinks {
  return {
    x: link('https://x.com/intent/post', { text, url }),
    // Facebook's sharer accepts only a URL; it cannot carry the score text.
    facebook: link('https://www.facebook.com/sharer/sharer.php', { u: url }),
    whatsapp: link('https://wa.me/', { text: `${text} ${url}` }),
    bluesky: link('https://bsky.app/intent/compose', { text: `${text} ${url}` }),
  };
}
