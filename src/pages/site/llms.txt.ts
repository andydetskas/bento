// llms.txt (https://llmstxt.org): a short, curated map of the site for LLMs and agents. Who
// Andy is, then every case study with his role and the public result, the leadership page, the
// Techniques articles (with Markdown copies) and how to reach him. Built from site.json and the
// articles, so it never drifts from the pages. Drafts stay out. Moves to /llms.txt at cutover.
import type { APIRoute } from 'astro';
import links from '../../content/links.json';
import site from '../../content/site.json';
import { SITE_BASE, absUrl, sectionById, sectionPath } from '../../lib/site-sections';
import { publishedTechniques } from '../../lib/techniques';

export const GET: APIRoute = () => {
  const url = (id: string) => links.links.find((l) => l.id === id)?.url;
  const work = site.work.filter((w) => 'look' in w && w.look);
  const lines = [
    `# ${links.profile.name}`,
    '',
    `> ${site.about.body} ${site.intro.sub} ${site.intro.status}.`,
    '',
    'Every case study states my role next to its outcome: what I did myself, what I led, and what I facilitated or shared.',
    '',
    '## About',
    '',
    `- [About](${absUrl(sectionPath(sectionById('about')))}): who I am, my working kit and my experience.`,
    ...site.about.experience.map((x) => `  - ${x.role}, ${x.org}`),
    `- [How I lead](${absUrl(sectionPath(sectionById('leadership')))}): ${site.leadership.lede} ${site.leadership.principles.map((p) => p.title).join('; ')}.`,
    '',
    '## Case studies',
    '',
    ...work.map((w) => `- [${w.title}](${absUrl((w as { look: string }).look)}) (${w.company}): ${w.summary} My role: ${w.role}. Result: ${w.outcome}`),
    '',
    '## Techniques',
    '',
    ...publishedTechniques.map((t) => `- [${t.title}](${absUrl(t.path)}) ([Markdown](${absUrl(t.markdown)})): ${t.description}`),
    '',
    '## Contact',
    '',
    `- [${site.intro.cta.label}](${site.intro.cta.url}): a 30-minute call`,
    `- [LinkedIn](${url('linkedin')})`,
    `- [Figma community](${url('figma')})`,
    `- [All links](https://links.andydetskas.com/)`,
    '',
    '## Optional',
    '',
    `- [Selected work](${absUrl(sectionPath(sectionById('portfolio')))}): all case studies in one place`,
    `- [Techniques](${absUrl(sectionPath(sectionById('techniques')))}): all articles in one place`,
    `- [Home](${absUrl(SITE_BASE)})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
