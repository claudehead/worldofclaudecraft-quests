// Post-build validation gate (run: `node --test tools/validate-output.test.mjs`
// from the repo root). Asserts invariants on the GENERATED data so regressions —
// like the bestiary thumbnails going null, or a generator emitting empty output —
// fail the build instead of silently shipping. No deps (node:test + node:assert).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = (p) => fs.existsSync(p);

// every data file a view fetches must exist and be non-trivial
const DOCS = ['farming', 'drops', 'questchains', 'classstats', 'mobstats', 'bosses', 'itemsets', 'zone3d', 'quest3d', 'search', 'talents', 'world-map', 'patches'];
for (const name of DOCS) {
  test(`docs/${name}.json exists and is non-empty`, () => {
    const p = `docs/${name}.json`;
    assert.ok(exists(p), `${p} missing — generator did not run`);
    const j = read(p);
    const size = Array.isArray(j) ? j.length : Object.keys(j).length;
    assert.ok(size > 0, `${p} is empty`);
  });
}

test('bestiary: most mobs have a thumbnail AND the file exists (the null-render bug)', () => {
  const b = read('bestiary/bestiary.json');
  const mobs = Array.isArray(b.mobs) ? b.mobs : Object.values(b.mobs || b);
  assert.ok(mobs.length >= 80, `only ${mobs.length} mobs`);
  const withRender = mobs.filter((m) => m.render);
  assert.ok(withRender.length >= 40, `only ${withRender.length} mobs have a render path — generator likely ran before portraits were rendered`);
  for (const m of withRender) assert.ok(exists(m.render), `render image missing on disk: ${m.render} (${m.name})`);
});

test('gear: items carry structured bonuses + weapon (compare/upgrade need these)', () => {
  const g = read('gear/gear.json');
  assert.ok(g.gear.length > 100, `only ${g.gear.length} gear items`);
  assert.ok(g.gear.every((it) => typeof it.bonuses === 'object' && it.bonuses !== null), 'some gear missing the bonuses object');
  assert.ok(g.gear.some((it) => it.weapon), 'no weapons carry weapon{min,max,speed}');
  assert.ok(g.gear.some((it) => it.set), 'no gear carries a set id (v0.16 sets)');
});

test('farming: every level 1..max-1 has a best grind mob', () => {
  const f = read('docs/farming.json');
  for (let L = 1; L < f.maxLevel; L++) {
    const p = f.perLevel.find((x) => x.level === L);
    assert.ok(p && p.mobs.length, `level ${L} has no farmable mobs`);
    assert.ok(p.xpNeeded > 0, `level ${L} has no xpNeeded`);
  }
});

test('drops: every indexed item has at least one source', () => {
  const d = read('docs/drops.json');
  assert.ok(d.items.length > 100, `only ${d.items.length} items`);
  assert.ok(d.items.every((i) => i.sources && i.sources.length), 'an item has zero sources');
});

test('itemsets: each set has pieces and tiered bonuses', () => {
  const s = read('docs/itemsets.json');
  assert.ok(s.sets.length >= 5, `only ${s.sets.length} sets`);
  for (const set of s.sets) {
    assert.ok(set.pieces.length, `set ${set.name} has no pieces`);
    assert.ok(set.bonuses.length, `set ${set.name} has no bonuses`);
  }
});

test('mobstats: mobs have positive HP and a derived DPS', () => {
  const m = read('docs/mobstats.json');
  assert.ok(m.mobs.length > 30);
  assert.ok(m.mobs.every((x) => x.hp > 0 && x.dps >= 0), 'a mob has invalid hp/dps');
});

test('classstats: all 9 classes with base stats', () => {
  const c = read('docs/classstats.json');
  assert.equal(Object.keys(c.classes).length, 9);
  for (const cl of Object.values(c.classes)) assert.ok(cl.baseStats && cl.hpPerLevel >= 0, `bad class ${cl.id}`);
});

test('zone3d: includes the stitched Whole World with a complete terrain grid', () => {
  const z = read('docs/zone3d.json');
  const w = z.zones['00-world'];
  assert.ok(w, 'missing 00-world entry');
  assert.equal(w.terrain.heights.length, w.terrain.res * w.terrain.res, 'world terrain grid is the wrong size');
});

test('search: every entry routes somewhere valid', () => {
  const s = read('docs/search.json');
  assert.ok(s.length > 300, `only ${s.length} search entries`);
  assert.ok(s.every((e) => e.n && e.go && (e.go.startsWith('#/') )), 'a search entry has a bad route');
});
