import fs from 'node:fs';
import path from 'node:path';

export const SITE_ORIGIN = 'https://thieffrycriminals.be';
export const DEFAULT_LOCALE = 'en';

const DEFAULT_IMAGE = 'assets/images/social-preview.png';
const ROUTE_PATTERN = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function escapeHtmlText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeHtmlAttribute(value) {
  return escapeHtmlText(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function escapeXml(value) {
  return escapeHtmlAttribute(value);
}

function conciseDescription(value, maximum = 160) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= maximum) return text;
  const shortened = text.slice(0, maximum - 1).replace(/\s+\S*$/, '').trimEnd();
  return `${shortened}…`;
}

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Missing ${label} in Angular index template`);
  return html.replace(pattern, replacement);
}

export function normalizeRoute(route) {
  const normalized = String(route).replace(/^\/+|\/+$/g, '');
  if (normalized === '') return '';
  if (!ROUTE_PATTERN.test(normalized)) throw new Error(`Unsafe route: ${route}`);
  return normalized;
}

export function pageUrl(locale, route) {
  if (!/^[a-z]{2}$/.test(locale)) throw new Error(`Unsafe locale: ${locale}`);
  const normalized = normalizeRoute(route);
  const segments = [locale === DEFAULT_LOCALE ? '' : locale, normalized].filter(Boolean);
  return segments.length ? `${SITE_ORIGIN}/${segments.join('/')}/` : `${SITE_ORIGIN}/`;
}

export function buildPages(content) {
  const fixedPages = [
    {
      route: '',
      title: 'The Thieffry Criminals',
      description: content.home.tagline,
      image: DEFAULT_IMAGE,
    },
    {
      route: 'about',
      title: content.about.title,
      description: content.about.subtitle,
      image: 'assets/images/sawito-dog-selfie.jpg',
    },
    {
      route: 'story',
      title: content.story.title,
      description: content.story.p1,
      image: 'assets/images/beach-walk.jpg',
    },
  ];

  const adventures = (content.adventures ?? []).map((adventure) => ({
    route: normalizeRoute(adventure.link),
    title: adventure.title,
    description: adventure.teaser,
    image: adventure.image ?? DEFAULT_IMAGE,
  }));

  const collectionPages = [
    {
      route: 'blog',
      title: content.blog.title,
      description: content.blog.subtitle,
      image: content.blogPosts?.find((post) => post.image)?.image ?? DEFAULT_IMAGE,
    },
    {
      route: 'shop',
      title: content.shop.title,
      description: content.shop.subtitle,
      image: 'assets/images/shop-brux-gang.jpg',
    },
  ];

  const shopItems = (content.shopItems ?? [])
    .filter((item) => item.slug)
    .map((item) => ({
      route: normalizeRoute(`shop/${item.slug}`),
      title: item.name,
      description: item.tag,
      image: item.image ?? DEFAULT_IMAGE,
    }));

  const pages = [...fixedPages, ...adventures, ...collectionPages, ...shopItems];
  const routes = new Set();
  for (const page of pages) {
    page.route = normalizeRoute(page.route);
    page.description = conciseDescription(page.description);
    if (routes.has(page.route)) throw new Error(`Duplicate route: ${page.route || '/'}`);
    routes.add(page.route);
  }
  return pages;
}

export function renderPage(template, { locale, page, canonicalUrl, alternates }) {
  const pageTitle = page.route ? `${page.title} - The Thieffry Criminals` : page.title;
  const titleText = escapeHtmlText(pageTitle);
  const titleAttribute = escapeHtmlAttribute(pageTitle);
  const description = escapeHtmlAttribute(conciseDescription(page.description));
  const imageUrl = `${SITE_ORIGIN}/${String(page.image ?? DEFAULT_IMAGE).replace(/^\/+/, '')}`;

  let html = template;
  html = replaceRequired(html, /<html lang="[^"]*"/, `<html lang="${escapeHtmlAttribute(locale)}"`, 'html lang');
  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/, `<title>${titleText}</title>`, 'title');
  html = replaceRequired(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`, 'description');
  html = replaceRequired(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${titleAttribute}">`, 'og:title');
  html = replaceRequired(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`, 'og:description');
  html = replaceRequired(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${escapeHtmlAttribute(canonicalUrl)}">`, 'og:url');
  html = replaceRequired(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${escapeHtmlAttribute(imageUrl)}">`, 'og:image');
  html = replaceRequired(html, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${titleAttribute}">`, 'twitter:title');
  html = replaceRequired(html, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`, 'twitter:description');
  html = replaceRequired(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${escapeHtmlAttribute(imageUrl)}">`, 'twitter:image');
  html = html.replace(/\s*<meta property="og:image:(?:width|height)" content="[^"]*">/g, '');

  if (/<link\s+rel="canonical"/i.test(html)) {
    throw new Error('Angular index template already contains a canonical link');
  }

  const alternateLinks = alternates
    .map(({ locale: alternateLocale, url }) => `  <link rel="alternate" hreflang="${escapeHtmlAttribute(alternateLocale)}" href="${escapeHtmlAttribute(url)}">`)
    .join('\n');
  const english = alternates.find((alternate) => alternate.locale === DEFAULT_LOCALE);
  if (!english) throw new Error(`Missing English alternate for route: ${page.route || '/'}`);

  const headLinks = [
    `  <link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}">`,
    alternateLinks,
    `  <link rel="alternate" hreflang="x-default" href="${escapeHtmlAttribute(english.url)}">`,
  ].join('\n');

  return replaceRequired(html, /<\/head>/, `${headLinks}\n</head>`, 'closing head');
}

export function renderSitemap(urls) {
  const uniqueUrls = [...new Set(urls)];
  const entries = uniqueUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function renderRobots() {
  return `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

export function outputDirectory(distDir, locale, route) {
  if (!/^[a-z]{2}$/.test(locale)) throw new Error(`Unsafe locale: ${locale}`);
  const normalized = normalizeRoute(route);
  const root = path.resolve(distDir);
  const result = path.resolve(root, locale === DEFAULT_LOCALE ? '' : locale, normalized);
  if (result !== root && !result.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Output escaped build directory: ${result}`);
  }
  return result;
}

export function generateSite({ template, contentByLocale, distDir }) {
  const pagesByLocale = new Map(
    Object.entries(contentByLocale).map(([locale, content]) => [locale, buildPages(content)]),
  );
  if (!pagesByLocale.has(DEFAULT_LOCALE)) throw new Error('English content is required');

  const generatedUrls = [];
  let pageCount = 0;

  for (const [locale, pages] of pagesByLocale) {
    for (const page of pages) {
      const alternates = [...pagesByLocale.entries()]
        .filter(([, alternatePages]) => alternatePages.some((candidate) => candidate.route === page.route))
        .map(([alternateLocale]) => ({
          locale: alternateLocale,
          url: pageUrl(alternateLocale, page.route),
        }));
      const canonicalUrl = pageUrl(locale, page.route);
      const html = renderPage(template, { locale, page, canonicalUrl, alternates });
      const destination = outputDirectory(distDir, locale, page.route);
      fs.mkdirSync(destination, { recursive: true });
      fs.writeFileSync(path.join(destination, 'index.html'), html);
      generatedUrls.push(canonicalUrl);
      pageCount += 1;
    }
  }

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), renderSitemap(generatedUrls));
  fs.writeFileSync(path.join(distDir, 'robots.txt'), renderRobots());
  return { pageCount, urls: generatedUrls };
}
