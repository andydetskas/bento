// robots.txt for the site. Only takes effect at a domain's root, so it waits for the cutover
// (SITE_BASE '/'). Andy's policy (Nov 9): allow every crawler, answer engines and AI training
// alike; for a job search the goal is to be found and described accurately, and the site holds
// nothing confidential. Points to the sitemap.
import type { APIRoute } from 'astro';
import { SITE_BASE, absUrl } from '../../lib/site-sections';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absUrl(`${SITE_BASE}sitemap.xml`)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
