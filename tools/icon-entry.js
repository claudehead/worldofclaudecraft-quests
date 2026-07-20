// Browser entry: exposes the game's own procedural icon generators
// (items, abilities, talents) so we can render real icon art headlessly.
import { iconDataUrl } from '../woc/src/ui/icons.ts';
import { TALENTS } from '../woc/src/sim/content/talents.ts';
import { rowTreeFor } from '../woc/src/sim/content/talent_rows.ts';
import { talentRowOptionIconDataUrl } from '../woc/src/ui/talent_icons.ts';

// v0.27+ talent model: icons come from the per-class choice-row options, keyed by
// option id, drawn from each option's effect (talentRowOptionIconDataUrl).
const talentOptions = {};
for (const ct of Object.values(TALENTS)) {
  const tree = rowTreeFor(ct.class);
  if (tree) for (const row of tree) for (const opt of row.options) talentOptions[opt.id] = opt;
}

window.icon = (kind, id) => {
  if (kind === 'talent') { const o = talentOptions[id]; return o ? talentRowOptionIconDataUrl(o) : null; }
  return iconDataUrl(kind, id);
};
// kept for the existing item-icon renderer
window.itemIcon = (id, size) => iconDataUrl('item', id, size);
window.__ready = true;
