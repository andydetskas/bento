// The main site's sections, each with its own URL so search engines (and AI answer engines)
// get a real page per section: /site/work/, /site/leadership/, /site/techniques/, /site/about/.
// Every URL renders the same grid; a section URL renders with that card already open. On the
// page, opening a card swaps the URL in place (no reload). Slugs match the Framer site's paths
// (/work, /techniques, /about) so links carry over when the site moves off Framer.
import site from '../content/site.json';

export const SITE_BASE = '/site/';
/** Where the site is served. The prototype rides on the bento's origin under /site/; at cutover set
 *  PUBLIC_SITE_ORIGIN=https://www.andydetskas.com (and SITE_BASE to '/'), and canonicals, share
 *  URLs, structured data, the sitemap and llms.txt all follow. */
export const SITE_ORIGIN: string = import.meta.env.PUBLIC_SITE_ORIGIN || 'https://links.andydetskas.com';
/** True in the build for www.andydetskas.com (scripts/build-www.mjs sets PUBLIC_SITE_ORIGIN). Pages
 *  carry noindex until then, so the prototype under /site/ stays out of search. */
export const SITE_LIVE = Boolean(import.meta.env.PUBLIC_SITE_ORIGIN);
/** "Schedule a call" goes through this page, which forwards to the booking calendar, so each click
 *  shows up as a visit in the site's analytics (pages/site/call.astro). */
export const CALL_PATH = `${SITE_BASE}call/`;
/** An absolute URL on the site. */
export const absUrl = (path: string) => new URL(path, SITE_ORIGIN).href;
export const SITE_TITLE = 'Andy Detskas · Product Design';
export const SITE_DESCRIPTION =
  'Hands-on design leadership for products people have to trust. Case studies, leadership, techniques and how to reach me.';

export interface Section {
  /** Card id: element ids, CSS grid areas and the legacy #hash. */
  id: 'portfolio' | 'leadership' | 'techniques' | 'about';
  slug: string;
  /** Page title while the section is open. */
  title: string;
  description: string;
}

export const sections: Section[] = [
  { id: 'portfolio', slug: 'work', title: `Selected work · Andy Detskas`, description: site.portfolio.lede },
  { id: 'leadership', slug: 'leadership', title: `How I lead · Andy Detskas`, description: site.leadership.lede },
  { id: 'techniques', slug: 'techniques', title: `Techniques · Andy Detskas`, description: site.techniques.lede },
  { id: 'about', slug: 'about', title: `About · Andy Detskas`, description: site.about.body },
];

export const sectionPath = (s: Section) => `${SITE_BASE}${s.slug}/`;
export const sectionById = (id: Section['id']) => sections.find((s) => s.id === id)!;
