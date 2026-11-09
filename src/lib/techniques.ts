// The Techniques articles (src/content/techniques/*.md): front matter, raw Markdown and paths,
// for the article pages' neighbours: the Markdown mirrors, llms.txt and the sitemap.
import { SITE_BASE } from './site-sections';

export interface TechniqueMeta {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  hero: string;
  order: number;
  draft?: boolean;
}

const modules = import.meta.glob<{ frontmatter: TechniqueMeta }>('../content/techniques/*.md', { eager: true });
const raws = import.meta.glob<string>('../content/techniques/*.md', { query: '?raw', import: 'default', eager: true });

export const techniques = Object.entries(modules)
  .map(([file, mod]) => {
    const slug = file.split('/').pop()!.replace(/\.md$/, '');
    const body = raws[file].replace(/^---[\s\S]*?---\s*/, '');
    return { slug, ...mod.frontmatter, body, path: `${SITE_BASE}techniques/${slug}/`, markdown: `${SITE_BASE}techniques/${slug}.md` };
  })
  .sort((a, b) => a.order - b.order);

export const publishedTechniques = techniques.filter((t) => !t.draft);
