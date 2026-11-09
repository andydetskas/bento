// A Markdown copy of each Techniques article (/site/techniques/<slug>.md) for agents and LLMs:
// the same text, with the figures turned into plain Markdown images at absolute URLs.
import type { APIRoute } from 'astro';
import { absUrl } from '../../../lib/site-sections';
import { techniques } from '../../../lib/techniques';

export function getStaticPaths() {
  return techniques.map((t) => ({ params: { slug: t.slug } }));
}

export const GET: APIRoute = ({ params }) => {
  const t = techniques.find((x) => x.slug === params.slug)!;
  const body = t.body.replace(
    /<figure>\s*<img src="([^"]+)"[^>]*?alt="([^"]*)"[^>]*\/>(?:\s*<figcaption>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g,
    (_m, src: string, alt: string, cap?: string) => `![${alt}](${absUrl(src)})${cap ? `\n\n*${cap.trim()}*` : ''}`,
  );
  const md = `# ${t.title}\n\n*${t.subtitle}*\n\nBy Andy Detskas · ${absUrl(t.path)}\n\n${body.trim()}\n`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
