// robots.txt for the site. Only takes effect at a domain's root, so it waits for the cutover
// (SITE_BASE '/'). Allows everything, like the live Framer site, and points to the sitemap.
// Andy's AI-bot policy decides whether to block training crawlers here (see the 2027 Strategy
// note "06 - Agent engine optimization").
import type { APIRoute } from 'astro';
import { SITE_BASE, absUrl } from '../../lib/site-sections';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absUrl(`${SITE_BASE}sitemap.xml`)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
