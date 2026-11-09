// sitemap.xml for the site: home, the four sections, every closer look and every published
// Techniques article. No lastmod (no dates on Andy's surfaces). Moves to /sitemap.xml at cutover.
import type { APIRoute } from 'astro';
import site from '../../content/site.json';
import { SITE_BASE, absUrl, sectionPath, sections } from '../../lib/site-sections';
import { publishedTechniques } from '../../lib/techniques';

export const GET: APIRoute = () => {
  const paths = [
    SITE_BASE,
    ...sections.map(sectionPath),
    ...site.work.flatMap((w) => ('look' in w && w.look ? [w.look] : [])),
    ...publishedTechniques.map((t) => t.path),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${absUrl(p)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
