// The order of the case studies, in one place, so the home grid, the home's structured data and
// llms.txt can't drift apart (llms.txt still followed site.json's order until Nov 19).
// Andy's order (Nov 16), kept after his full site review (Nov 19: "the current order that is live
// looks good to me"). The grid places them so the left column runs Agentic Design System, Designing
// for Trust, Buying Club, and the right runs StackScore, Crushing the Basics, Surfacing Value.
import site from '../content/site.json';

export const WORK_ORDER = ['agentic-design-system', 'stackscore', 'designing-for-trust', 'crushing-the-basics', 'buying-club', 'surfacing-value'];

/** A case study not in the list goes last, so a new one never jumps the queue unseen. */
const rank = (id: string) => {
  const i = WORK_ORDER.indexOf(id);
  return i === -1 ? WORK_ORDER.length : i;
};

/** site.work in the home's order. */
export const orderedWork = [...site.work].sort((a, b) => rank(a.id) - rank(b.id));
