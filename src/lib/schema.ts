// Structured data (schema.org JSON-LD) for the site and the bento, so search and answer engines
// know who this is, which profiles are his, and which pages are his work. One Person, with a
// stable @id on both domains; each page adds what it is (a profile page, a list of case
// studies, an article) and where it sits (breadcrumbs). Facts come from site.json and
// links.json, which follow the facts sheet (Master Profile §2.2). No dates: Andy keeps years off
// his surfaces, and these are visible to anyone who reads the source.
import links from '../content/links.json';
import site from '../content/site.json';
import { SITE_BASE, absUrl } from './site-sections';

/** Stable across links. and www., so engines merge every mention into one person. */
export const PERSON_ID = 'https://www.andydetskas.com/#andy';
export const WEBSITE_ID = () => `${absUrl(SITE_BASE)}#site`;

const linkUrl = (id: string) => links.links.find((l) => l.id === id)?.url;

export function person() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: links.profile.name,
    jobTitle: 'Product Design Leader',
    description: `${site.intro.headline} ${site.intro.sub}`,
    url: 'https://www.andydetskas.com/',
    image: absUrl(site.about.photo.src),
    sameAs: [linkUrl('linkedin'), linkUrl('figma'), linkUrl('instagram'), 'https://github.com/andydetskas', 'https://links.andydetskas.com/'].filter(Boolean),
    knowsAbout: [
      'Product design leadership',
      'Trust and safety',
      'Privacy and safety UX',
      'Design systems',
      'AI-native design systems',
      'Design research',
      'Mobile app design',
      'Accessibility',
    ],
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID(),
    name: 'Andy Detskas · Product Design',
    url: absUrl(SITE_BASE),
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
  };
}

/** Crumbs from the site's home; the last one is the current page (no URL needed). */
export function breadcrumbs(items: { name: string; path?: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: SITE_BASE }, ...items].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absUrl(c.path) } : {}),
    })),
  };
}

export function itemList(items: { name: string; path: string; description?: string }[]) {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: absUrl(it.path), ...(it.description ? { description: it.description } : {}) })),
  };
}

/** A case study or a Techniques article. */
export function article(a: { path: string; title: string; subtitle?: string; description: string; image?: string; company?: string; section: string }) {
  return {
    '@type': 'Article',
    '@id': `${absUrl(a.path)}#article`,
    headline: a.title,
    ...(a.subtitle ? { alternativeHeadline: a.subtitle } : {}),
    description: a.description,
    url: absUrl(a.path),
    ...(a.image ? { image: absUrl(a.image) } : {}),
    author: { '@id': PERSON_ID },
    articleSection: a.section,
    ...(a.company ? { about: { '@type': 'Organization', name: a.company } } : {}),
    isPartOf: { '@id': WEBSITE_ID() },
    inLanguage: 'en',
  };
}

/** Wraps nodes in one graph for a single <script type="application/ld+json">. */
export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
