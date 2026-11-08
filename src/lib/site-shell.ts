// Shared by every main-site page (the grid and the closer-look pages): the hero's height for its
// sticky offset, the staged entrance, and the scene clock handed from page to page.

/** sessionStorage key for the scene clock handed between site pages (read in SiteHead.astro). */
export const SITE_SCENE_KEY = 'ad_site_scene';
/** How long a left-behind clock stays good. SiteHead uses the same window. */
const SCENE_FRESH_MS = 10000;

interface SceneRecord {
  v: 1;
  /** Date.now() when the last page left. */
  at: number;
  /** Its scene time. */
  t: number;
  preset: string;
}

/**
 * Keep the scene continuous from page to page. On leaving, the page leaves its scene's clock for
 * the next site page; on a normal load SiteHead picks it up before first paint.
 * Back and Forward usually skip the load: the browser restores the page exactly as it was left
 * (the back/forward cache), with its scene clock stopped at the moment the visitor clicked away,
 * and the hover tint and pill of that click still on. Left alone, the scene would jump back by
 * however long they spent on the other page. So on a restore: drop the hover state, and pick up
 * the clock of the page they're coming from.
 * The clock is written on pageswap as well as pagehide: on a restore, Chrome shows the restored
 * page (pageshow) before the page being left gets its pagehide, but pageswap comes first.
 */
export function rememberScene() {
  const leave = () => {
    const field = window.shapeField;
    if (!field) return;
    try {
      const preset = document.documentElement.dataset.preset ?? '';
      const record: SceneRecord = { v: 1, at: Date.now(), t: field.time, preset };
      sessionStorage.setItem(SITE_SCENE_KEY, JSON.stringify(record));
    } catch {
      // Private mode or storage off: the next page plays its entrance instead.
    }
  };
  window.addEventListener('pageswap', leave);
  window.addEventListener('pagehide', leave);

  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    // The pointer isn't on the link that was clicked any more (pill:clear also clears the tint).
    document.dispatchEvent(new CustomEvent('pill:clear'));
    let s: SceneRecord | null = null;
    try {
      s = JSON.parse(sessionStorage.getItem(SITE_SCENE_KEY) || 'null');
      sessionStorage.removeItem(SITE_SCENE_KEY);
    } catch {
      return;
    }
    const field = window.shapeField;
    if (!field || !s || s.v !== 1 || Date.now() - s.at > SCENE_FRESH_MS) return;
    const { id, params } = field.preset;
    if (s.preset !== id) return;
    // seek() also settles the tint, so the cleared hover tint is gone in the first frame back.
    field.seek(s.t + (Math.max(0, Date.now() - s.at) / 1000) * params.speed);
  });
}

/** Keep --hero-h on the grid current, for the hero's sticky offset during a takeover. */
export function watchHeroHeight(grid: HTMLElement) {
  const hero = document.querySelector<HTMLElement>('.area-hero');
  if (hero) new ResizeObserver(() => grid.style.setProperty('--hero-h', `${hero.offsetHeight}px`)).observe(hero);
}

/**
 * Entrance, background first. Fonts in (or a short wait on a slow connection): the masthead
 * reveals over the scene's color (is-ready). Then the hero opens and the cards land (is-landing),
 * and is-settled follows. On a direct visit: if the scene arrives within ARRIVE_BY, its glyphs get
 * SCENE_BEAT to grow in before the cards cover them; if it's late (a slow phone), the work doesn't
 * wait for it. After a hand-off it follows straight on (the bento already showed the scene); with
 * reduced motion there's nothing to wait for.
 */
export function runEntrance(onSettled?: () => void) {
  const root = document.documentElement;
  // Arriving from another site page: SiteHead already showed everything; no intro.
  if (root.classList.contains('from-site')) {
    requestAnimationFrame(() => onSettled?.());
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ARRIVE_BY = 1200; // ms after navigation start
  const SCENE_BEAT = 900; // ms of scene before the cards cover it
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, Math.max(0, ms)));
  const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

  const sceneArrived = new Promise<boolean>((resolve) => {
    if (document.querySelector('canvas.scene.is-live')) return resolve(true);
    document.addEventListener('shapefield:firstframe', (e) => resolve(e.detail.live), { once: true });
  });
  const sceneFirst = () =>
    Promise.race([sceneArrived, wait(ARRIVE_BY - performance.now()).then(() => false)]).then((live) => (live ? wait(SCENE_BEAT) : undefined));
  const fontsIn = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(400)]);
  const leadWithScene = !root.classList.contains('from-handoff') && !reduced;

  fontsIn
    .then(nextFrame)
    .then(() => {
      root.classList.add('is-ready');
      return leadWithScene ? sceneFirst() : undefined;
    })
    .then(nextFrame)
    .then(() => {
      root.classList.add('is-landing');
      setTimeout(() => {
        root.classList.add('is-settled');
        onSettled?.();
      }, 1400);
    });
}
