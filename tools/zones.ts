// Canonical zone registry for the guide generators.
//
// The game grew from 3 leveling zones to a full expansion (v0.32: 11 leveling
// zones plus the Drowned Temple endgame bucket). Zone membership can't be read
// off the flat QUESTS/MOBS tables (quests carry no zone field), so each zone's
// content is imported here from its own module and paired into one ordered list
// that every generator iterates. Adding a future zone = one import block + one
// SPECS entry, nothing else.
//
// Only edit the SPECS list and the BIOME_VISUAL map; the generators derive
// everything else (dirs, bands, bestiary sets, maps, 3D visuals) from here.

import { ZONE1_ZONE, ZONE1_QUESTS, ZONE1_CAMPS, ZONE1_NPCS, ZONE1_OBJECTS, ZONE1_ROADS } from '../woc/src/sim/content/zone1.ts';
import { ZONE2_ZONE, ZONE2_QUESTS, ZONE2_CAMPS, ZONE2_NPCS, ZONE2_OBJECTS, ZONE2_ROADS } from '../woc/src/sim/content/zone2.ts';
import { ZONE3_ZONE, ZONE3_QUESTS, ZONE3_CAMPS, ZONE3_NPCS, ZONE3_OBJECTS, ZONE3_ROADS } from '../woc/src/sim/content/zone3.ts';
import { TEMPLE_QUESTS, TEMPLE_CAMPS, TEMPLE_NPCS, TEMPLE_OBJECTS } from '../woc/src/sim/content/temple.ts';
// realm.ts IS the Veiled Hollow (REALM_ZONE.id === 'veiled_hollow').
import { REALM_ZONE, REALM_QUESTS, REALM_CAMPS, REALM_NPCS, REALM_OBJECTS, REALM_ROADS } from '../woc/src/sim/content/realm.ts';
import { DRAKELANDS_ZONE, DRAKELANDS_QUESTS, DRAKELANDS_CAMPS, DRAKELANDS_NPCS, DRAKELANDS_OBJECTS, DRAKELANDS_ROADS } from '../woc/src/sim/content/drakelands.ts';
import { FROSTVEIL_ZONE, FROSTVEIL_QUESTS, FROSTVEIL_CAMPS, FROSTVEIL_NPCS, FROSTVEIL_OBJECTS, FROSTVEIL_ROADS } from '../woc/src/sim/content/frostveil.ts';
import { AMBERFALL_ZONE, AMBERFALL_QUESTS, AMBERFALL_CAMPS, AMBERFALL_NPCS, AMBERFALL_OBJECTS, AMBERFALL_ROADS } from '../woc/src/sim/content/amberfall.ts';
import { WILLOWFEN_ZONE, WILLOWFEN_QUESTS, WILLOWFEN_CAMPS, WILLOWFEN_NPCS, WILLOWFEN_OBJECTS, WILLOWFEN_ROADS } from '../woc/src/sim/content/willowfen.ts';
import { NIGHTBLOOM_ZONE, NIGHTBLOOM_QUESTS, NIGHTBLOOM_CAMPS, NIGHTBLOOM_NPCS, NIGHTBLOOM_OBJECTS, NIGHTBLOOM_ROADS } from '../woc/src/sim/content/nightbloom.ts';
import { WRAITHWOOD_ZONE, WRAITHWOOD_QUESTS, WRAITHWOOD_CAMPS, WRAITHWOOD_NPCS, WRAITHWOOD_OBJECTS, WRAITHWOOD_ROADS } from '../woc/src/sim/content/wraithwood.ts';
import { PALMREACH_ZONE, PALMREACH_QUESTS, PALMREACH_CAMPS, PALMREACH_NPCS, PALMREACH_OBJECTS, PALMREACH_ROADS } from '../woc/src/sim/content/palmreach.ts';
import { EVERGARDEN_ZONE, EVERGARDEN_QUESTS, EVERGARDEN_CAMPS, EVERGARDEN_NPCS, EVERGARDEN_OBJECTS, EVERGARDEN_ROADS } from '../woc/src/sim/content/evergarden.ts';
import { GALECREST_ZONE, GALECREST_QUESTS, GALECREST_CAMPS, GALECREST_NPCS, GALECREST_OBJECTS, GALECREST_ROADS } from '../woc/src/sim/content/galecrest.ts';
import { FARSHORE_ZONE, FARSHORE_QUESTS, FARSHORE_CAMPS, FARSHORE_NPCS, FARSHORE_OBJECTS, FARSHORE_ROADS } from '../woc/src/sim/content/farshore.ts';

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// The original strip is one grid column centered on x=0; a zone without an
// explicit x-range spans it. Newer expansion zones sit in east/west columns.
const STRIP_MIN_X = -180;
const STRIP_MAX_X = 180;
export interface ZoneBounds { xMin: number; xMax: number; zMin: number; zMax: number }
function boundsOf(z: any): ZoneBounds {
  return {
    xMin: z?.xMin ?? STRIP_MIN_X,
    xMax: z?.xMax ?? STRIP_MAX_X,
    zMin: z?.zMin ?? -Infinity,
    zMax: z?.zMax ?? Infinity,
  };
}

// Per-biome 3D/SVG visuals. The originals keep their historical numeric colors
// and foliage so existing 3D/map output stays byte-stable; expansion biomes get
// themed colors. Foliage keys are the shared render foliage set.
export interface BiomeVisual { color: number; foliage: string[] }
const DEFAULT_FOLIAGE = ['bush', 'fern', 'mushroom'];
export const BIOME_VISUAL: Record<string, BiomeVisual> = {
  vale: { color: 0x3f5a33, foliage: ['oak_1', 'oak_2', 'bush', 'bush_flowers', 'fern', 'mushroom'] },
  marsh: { color: 0x35463a, foliage: ['dead_1', 'dead_2', 'fern', 'mushroom', 'bush'] },
  peaks: { color: 0x52483a, foliage: ['dead_1', 'dead_3', 'bush', 'fern'] },
  temple: { color: 0x27424c, foliage: ['fern', 'mushroom', 'dead_2'] },
  dusk: { color: 0x39324a, foliage: ['dead_2', 'mushroom', 'bush'] },
  ember: { color: 0x5a2f2a, foliage: ['dead_1', 'dead_3', 'bush'] },
  frost: { color: 0x3a4a5a, foliage: ['dead_1', 'bush', 'fern'] },
  amber: { color: 0x5a4a2a, foliage: ['oak_1', 'bush', 'fern'] },
  fen: { color: 0x35463a, foliage: ['dead_1', 'dead_2', 'fern', 'mushroom'] },
  garden: { color: 0x3f5a33, foliage: ['oak_2', 'bush_flowers', 'bush', 'fern', 'mushroom'] },
  gale: { color: 0x4a5a52, foliage: ['bush', 'fern', 'oak_1'] },
  night: { color: 0x2a2f4a, foliage: ['bush_flowers', 'mushroom', 'fern'] },
  jungle: { color: 0x2f5a3a, foliage: ['oak_1', 'oak_2', 'bush_flowers', 'fern', 'bush'] },
  haunt: { color: 0x3a3a3f, foliage: ['dead_1', 'dead_2', 'dead_3', 'mushroom'] },
};
export function biomeVisual(biome: string | undefined): BiomeVisual {
  return (biome && BIOME_VISUAL[biome]) || { color: 0x3f5a33, foliage: DEFAULT_FOLIAGE };
}

export interface GuideZone {
  key: string;                 // stable key (zone id; 'temple' for the endgame bucket)
  dir: string;                 // NN-slug quest folder (01-.. preserved for the originals)
  num: number;                 // folder number
  title: string;               // display title
  shortName: string;           // zone name without the "Zone N — " prefix
  zone: any;                   // the ZoneDef (may be undefined for the temple bucket)
  levelRange: [number, number];
  hub?: any;                   // ZoneDef.hub (object; .name for the label)
  quests: Record<string, any>;
  camps: any[];
  npcs: Record<string, any>;
  objects: any[];
  roads: any[];
  lakes: any[];
  pois: any[];
  graveyard: any;
  visual: BiomeVisual;
  bounds: ZoneBounds | null;   // null = no spatial rect (the temple bucket)
  // Dungeons explicitly owned by this bucket regardless of where their door
  // sits. Only the endgame temple bucket uses this (the Nythraxis instances
  // physically sit inside Thornpeak but belong to the Drowned Temple endgame);
  // those ids are then excluded from the spatial match so they appear once.
  dungeonKeys?: string[];
}

// Level range fallback for a bucket with no ZoneDef (temple): span its quests.
function questRange(quests: Record<string, any>, lo = 15): [number, number] {
  const lvls = Object.values(quests).map((q: any) => q.minLevel ?? lo);
  return [Math.min(...lvls), Math.max(...lvls)];
}

// Ordered spec: the three original leveling zones and the temple keep their
// historical folder numbers/slugs so existing deep links never break; the
// expansion zones follow, ordered low level then name.
interface Spec {
  key: string; num: number; dir?: string; titlePrefix?: string; biomeOverride?: string;
  zone?: any; quests: Record<string, any>; camps: any[];
  npcs?: Record<string, any>; objects?: any[]; roads?: any[]; dungeonKeys?: string[];
}
const SPECS: Spec[] = [
  { key: 'zone1', num: 1, dir: '01-eastbrook-vale', titlePrefix: 'Zone 1 — ', zone: ZONE1_ZONE, quests: ZONE1_QUESTS, camps: ZONE1_CAMPS, npcs: ZONE1_NPCS, objects: ZONE1_OBJECTS, roads: ZONE1_ROADS },
  { key: 'zone2', num: 2, titlePrefix: 'Zone 2 — ', zone: ZONE2_ZONE, quests: ZONE2_QUESTS, camps: ZONE2_CAMPS, npcs: ZONE2_NPCS, objects: ZONE2_OBJECTS, roads: ZONE2_ROADS },
  { key: 'zone3', num: 3, titlePrefix: 'Zone 3 — ', zone: ZONE3_ZONE, quests: ZONE3_QUESTS, camps: ZONE3_CAMPS, npcs: ZONE3_NPCS, objects: ZONE3_OBJECTS, roads: ZONE3_ROADS },
  { key: 'temple', num: 4, dir: '04-the-drowned-temple', titlePrefix: 'Zone 4 — ', biomeOverride: 'temple', zone: undefined, quests: TEMPLE_QUESTS, camps: TEMPLE_CAMPS, npcs: TEMPLE_NPCS, objects: TEMPLE_OBJECTS, roads: [], dungeonKeys: ['nythraxis_crypt', 'nythraxis_boss_arena'] },
  // expansion zones (low level -> high, then name), numbered from 5.
  { key: 'farshore_isle', num: 5, zone: FARSHORE_ZONE, quests: FARSHORE_QUESTS, camps: FARSHORE_CAMPS, npcs: FARSHORE_NPCS, objects: FARSHORE_OBJECTS, roads: FARSHORE_ROADS },
  { key: 'veiled_hollow', num: 6, zone: REALM_ZONE, quests: REALM_QUESTS, camps: REALM_CAMPS, npcs: REALM_NPCS, objects: REALM_OBJECTS, roads: REALM_ROADS },
  { key: 'drakelands', num: 7, zone: DRAKELANDS_ZONE, quests: DRAKELANDS_QUESTS, camps: DRAKELANDS_CAMPS, npcs: DRAKELANDS_NPCS, objects: DRAKELANDS_OBJECTS, roads: DRAKELANDS_ROADS },
  { key: 'frostveil', num: 8, zone: FROSTVEIL_ZONE, quests: FROSTVEIL_QUESTS, camps: FROSTVEIL_CAMPS, npcs: FROSTVEIL_NPCS, objects: FROSTVEIL_OBJECTS, roads: FROSTVEIL_ROADS },
  { key: 'amberfall', num: 9, zone: AMBERFALL_ZONE, quests: AMBERFALL_QUESTS, camps: AMBERFALL_CAMPS, npcs: AMBERFALL_NPCS, objects: AMBERFALL_OBJECTS, roads: AMBERFALL_ROADS },
  { key: 'willowfen', num: 10, zone: WILLOWFEN_ZONE, quests: WILLOWFEN_QUESTS, camps: WILLOWFEN_CAMPS, npcs: WILLOWFEN_NPCS, objects: WILLOWFEN_OBJECTS, roads: WILLOWFEN_ROADS },
  { key: 'evergarden', num: 11, zone: EVERGARDEN_ZONE, quests: EVERGARDEN_QUESTS, camps: EVERGARDEN_CAMPS, npcs: EVERGARDEN_NPCS, objects: EVERGARDEN_OBJECTS, roads: EVERGARDEN_ROADS },
  { key: 'galecrest', num: 12, zone: GALECREST_ZONE, quests: GALECREST_QUESTS, camps: GALECREST_CAMPS, npcs: GALECREST_NPCS, objects: GALECREST_OBJECTS, roads: GALECREST_ROADS },
  { key: 'nightbloom', num: 13, zone: NIGHTBLOOM_ZONE, quests: NIGHTBLOOM_QUESTS, camps: NIGHTBLOOM_CAMPS, npcs: NIGHTBLOOM_NPCS, objects: NIGHTBLOOM_OBJECTS, roads: NIGHTBLOOM_ROADS },
  { key: 'palmreach', num: 14, zone: PALMREACH_ZONE, quests: PALMREACH_QUESTS, camps: PALMREACH_CAMPS, npcs: PALMREACH_NPCS, objects: PALMREACH_OBJECTS, roads: PALMREACH_ROADS },
  { key: 'wraithwood', num: 15, zone: WRAITHWOOD_ZONE, quests: WRAITHWOOD_QUESTS, camps: WRAITHWOOD_CAMPS, npcs: WRAITHWOOD_NPCS, objects: WRAITHWOOD_OBJECTS, roads: WRAITHWOOD_ROADS },
];

export const GUIDE_ZONES: GuideZone[] = SPECS.map((s) => {
  const name: string = s.zone?.name ?? 'The Drowned Temple';
  const levelRange: [number, number] = s.zone?.levelRange ?? questRange(s.quests);
  const dir = s.dir ?? `${String(s.num).padStart(2, '0')}-${slug(name)}`;
  const title = s.key === 'temple' ? `${s.titlePrefix}${name} (Endgame)` : `${s.titlePrefix ?? ''}${name}`;
  return {
    key: s.key,
    dir,
    num: s.num,
    title,
    shortName: name,
    zone: s.zone,
    levelRange,
    hub: s.zone?.hub,
    quests: s.quests,
    camps: s.camps,
    npcs: s.npcs || {},
    objects: s.objects || [],
    roads: s.roads || [],
    lakes: s.zone?.lakes || [],
    pois: s.zone?.pois || [],
    graveyard: s.zone?.graveyard || null,
    visual: biomeVisual(s.biomeOverride ?? s.zone?.biome),
    bounds: s.zone ? boundsOf(s.zone) : null,
    dungeonKeys: s.dungeonKeys,
  };
});

// The first leveling zone's starter town, for the fishing-pole how-to.
export const STARTER_HUB = ZONE1_ZONE.hub?.name || 'the starter town';

// Dungeon ids claimed by an explicit bucket override (excluded from spatial match).
export const OVERRIDDEN_DUNGEONS = new Set<string>(
  GUIDE_ZONES.flatMap((z) => z.dungeonKeys || []),
);

// True if a world point (x,z) falls inside a zone's rect.
export function pointInZone(z: GuideZone, x: number, zc: number): boolean {
  const b = z.bounds;
  if (!b) return false;
  return x >= b.xMin && x < b.xMax && zc >= b.zMin && zc < b.zMax;
}

// Which guide zone a world point belongs to (first match in registry order).
export function zoneForPoint(x: number, z: number): GuideZone | null {
  for (const gz of GUIDE_ZONES) if (pointInZone(gz, x, z)) return gz;
  return null;
}

// The guide zone that owns a dungeon: an explicit override first, else the
// zone whose rect contains the dungeon's door.
export function zoneForDungeon(id: string, doorPos: { x: number; z: number }): GuideZone | null {
  const owner = GUIDE_ZONES.find((z) => (z.dungeonKeys || []).includes(id));
  if (owner) return owner;
  if (OVERRIDDEN_DUNGEONS.has(id)) return null; // claimed elsewhere, don't double-assign
  return zoneForPoint(doorPos.x, doorPos.z);
}
