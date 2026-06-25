// Browser entry: exposes the game's own procedural icon generators
// (items, abilities, talents) so we can render real icon art headlessly.
import { iconDataUrl } from '../woc/src/ui/icons.ts';
import { TALENTS } from '../woc/src/sim/content/talents.ts';
import { talentNodeIconDataUrl } from '../woc/src/ui/talent_icons.ts';

const talentNodes = {};
for (const ct of Object.values(TALENTS)) for (const n of ct.nodes) talentNodes[n.id] = n;

window.icon = (kind, id) => {
  if (kind === 'talent') { const n = talentNodes[id]; return n ? talentNodeIconDataUrl(n) : null; }
  return iconDataUrl(kind, id);
};
// kept for the existing item-icon renderer
window.itemIcon = (id, size) => iconDataUrl('item', id, size);
window.__ready = true;
