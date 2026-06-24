// Browser entry: exposes the game's own procedural item-icon generator.
import { iconDataUrl } from '../woc/src/ui/icons.ts';
window.itemIcon = (id, size) => iconDataUrl('item', id, size);
window.__ready = true;
