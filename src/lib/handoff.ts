// Bento → main site hand-off.
//
// links.andydetskas.com and www.andydetskas.com are different origins, so the browser can't
// morph one page into the other (cross-document view transitions are same-origin only).
// They are the same site, though, which gives us three things:
//   1. A cookie on the parent domain that both can read: the bento leaves the scene's clock in
//      it, and the site picks the glyph field up at the same moment instead of restarting.
//   2. A shared HTTP cache (browsers partition by site, not origin): warming the site's HTML on
//      pointerdown makes the navigation after the exit come from cache.
//   3. The exit covers the network: the card collapses to its masthead and slides to the
//      top-left, which is exactly where the site's card starts.

/** Where the main site lives. Local two-origin testing sets PUBLIC_MAIN_URL (see README). */
export const MAIN_URL: string = import.meta.env.PUBLIC_MAIN_URL || 'https://www.andydetskas.com/';

export const HANDOFF_COOKIE = 'ad_handoff';
/** Long enough for a slow load; short enough that a later visit gets the normal entrance. */
export const HANDOFF_MAX_AGE_S = 20;
/** Bento exit length. The site's entrance starts from this exit's last frame. */
export const EXIT_MS = 440;

export interface Handoff {
  v: 1;
  /** Scene seconds when the cookie was written. */
  t: number;
  /** Date.now() when the cookie was written; the site adds the time since. */
  at: number;
  /** Preset id, so the site only continues a scene it draws the same way. */
  preset: string;
}

/** Parent-domain cookie in production; host-only on localhost (cookies ignore ports, so two ports share it). */
const domainAttr = () => (location.hostname.endsWith('andydetskas.com') ? '; Domain=andydetskas.com' : '');

export function writeHandoff(h: Omit<Handoff, 'v' | 'at'>) {
  const value: Handoff = { v: 1, at: Date.now(), ...h };
  document.cookie = `${HANDOFF_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${HANDOFF_MAX_AGE_S}; Path=/; SameSite=Lax${domainAttr()}`;
}

/**
 * Fetch the site's HTML into the shared HTTP cache, so the navigation after the exit doesn't
 * wait on the network. Only where speculation rules aren't supported (Safari, most in-app
 * browsers): Chrome already prefetches it from the rule on the bento page, into a cache the
 * navigation actually uses.
 */
let warmed = false;
export function warmMainSite(url = MAIN_URL) {
  if (warmed) return;
  warmed = true;
  if (HTMLScriptElement.supports?.('speculationrules')) return;
  fetch(url, { mode: 'no-cors', credentials: 'include' }).catch(() => {});
}
