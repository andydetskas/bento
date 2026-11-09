// The Framer site's URLs (andydetskas.com, as of Nov 9) and where each lives on this site, so old
// links, bookmarks and search results keep working at the cutover. Paths are relative to SITE_BASE.
//
// Already the same here, nothing to do: / · /about · /work · /techniques · /techniques/<slug> for
// the four live articles (integrity-compass, vibeframing, the-design-dojo, making-haptics-happen).
// GitHub Pages adds the trailing slash itself (/about → /about/).
//
// Everything below gets a small page at the old path (pages/site/[...legacy].astro) that sends the
// visitor on at once: a meta refresh plus location.replace, a canonical link to the new page, and
// noindex. GitHub Pages can't send real 301s; search engines treat an instant meta refresh as one.
export const legacyRedirects: Record<string, string> = {
  // Case studies (passcode pages on Framer) → their closer looks
  'design-strava-privacy-controls': 'work/designing-for-trust/',
  'strategy-strava-navigation-for-clarity-retention-scale': 'work/surfacing-value/',
  'strategy-sram-crush-the-basics': 'work/crushing-the-basics/',
  'design-sram-battery-improvements': 'work/crushing-the-basics/#battery', // Battery is a chapter there now
  'design-suppco-agentic-design-system': 'work/agentic-design-system/',
  'design-suppco-stackscore': 'work/stackscore/',
  'design-suppco-call-and-response': 'work/stackscore/#related', // folded into StackScore
  'design-suppco-buying-club': 'work/buying-club/',
  'design-strava-streak-challenges': 'work/', // no page yet ("More work" is a later to-do)

  // Pages this site folds into others
  contact: '', // the hero carries the call link and the follow links on every page
  'home-devin': '',

  // Techniques retired on Framer (its own redirects, kept)
  'techniques/the-group-critique': 'techniques/the-design-dojo/',
  'techniques/the-designed-alliance': 'techniques/',
  // Older posts, drafted on Framer Nov 7 (they 404 there now; old links land on Techniques instead)
  'techniques/expanding-your-range-a-designer-s-secret-weapon': 'techniques/',
  'techniques/navigating-ambiguity-when-in-person-collaboration-is-key-in-product-design': 'techniques/',
  'techniques/my-journey-as-a-product-designer': 'techniques/',
  'techniques/design-feedback-anti-patterns-and-how-to-engage-them': 'techniques/',
  'techniques/its-not-about-design-inclusion-its-about-quality': 'techniques/',
  'techniques/exploring-the-principles-of-organizational-trust-with-sixty-product-leaders': 'techniques/',
  'techniques/moving-from-a-design-ic-to-design-manager': 'techniques/',
  'techniques/avoiding-leading-questions-in-user-interviews': 'techniques/',
};
