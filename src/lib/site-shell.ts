// Shared by every main-site page (the grid and the closer-look pages): the hero's height for its
// sticky offset, and the staged entrance.

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
