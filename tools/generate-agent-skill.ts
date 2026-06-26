// Per-class "how to play" skill packs for an in-browser agent. Compiled from the
// game's own CLASSES/ABILITIES so the playbook always matches the live kit.
// Run: tsx generate-agent-skill.ts <out dir>
import { CLASSES, ABILITIES } from '../woc/src/sim/data.ts';
import { MELEE_RANGE, GCD } from '../woc/src/sim/types.ts';
import * as fs from 'node:fs';

const OUT = process.argv[2] || '/tmp/gen/skills';
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const isUtility = (a: any) => /heal|renew|mend|bless|shield|dispel|cleanse|aura|blink|sprint|stealth|vanish|charge|intercept|polymorph|fear|sap|hex|sleep|banish|blind|cyclone|conjure|intellect|armor/i.test(a.name) || !a.requiresTarget;

fs.mkdirSync(OUT, { recursive: true });
const classes = Object.values(CLASSES) as any[];
for (const c of classes) {
  const abil = (c.abilities || [])
    .map((id: string) => (ABILITIES as any)[id])
    .filter(Boolean)
    .map((a: any) => ({
      id: a.id, name: a.name, learnLevel: a.learnLevel, cost: a.cost ?? 0,
      cooldown: a.cooldown ?? 0, range: a.range ?? 0, castTime: a.castTime ?? 0,
      school: a.school, requiresTarget: !!a.requiresTarget,
      desc: (a.description || '').replace(/\s+/g, ' ').trim(),
    }));
  // offensive rotation: target-requiring damage abilities, signature/instant first
  const offensive = abil.filter((a: any) => a.requiresTarget && !isUtility(a))
    .sort((a: any, b: any) => (a.castTime - b.castTime) || (b.cooldown - a.cooldown) || (b.cost - a.cost));
  const utility = abil.filter((a: any) => isUtility(a));

  const skill = {
    class: c.id,
    name: cap(c.id),
    resource: c.resourceType,                       // mana | rage | energy | focus
    ranged: !!c.ranged,
    rules: { meleeRange: MELEE_RANGE, gcd: GCD, perceptionRadius: 60 },
    abilities: abil,
    rotation: offensive.map((a: any) => a.id),  // cast first ready, on the target
    utility: utility.map((a: any) => a.id),
    playbook: [
      `You are playing a ${cap(c.id)} (${c.resourceType}-based${c.ranged ? ', ranged' : ', melee'}).`,
      `Goal: gain XP safely — kill mobs at or below your level, complete quests, stay alive.`,
      `SURVIVE: if HP < 25% and a mob is hitting you, flee or use a defensive; if safe and HP < 60%, eat/consume.`,
      c.resourceType === 'mana' ? `RESOURCE: if mana < 20% and out of combat, drink before pulling.` : `RESOURCE: ${c.resourceType} builds in combat — open with a builder.`,
      `ENGAGE: pick the nearest hostile within range of your goal, close to ${c.ranged ? 'ability range' : MELEE_RANGE + ' yards'} (face it), then attack.`,
      `ROTATE: cast the first ready ability in "rotation" each GCD (respect cost/cooldown/range/line-of-sight); auto-attack fills the gaps.`,
      `LOOT/QUEST: after a kill, loot the corpse; interact with quest objects/NPCs the objective needs.`,
      `Avoid pulling Elite/Rare mobs above your level, and don't pull more than you can handle.`,
    ],
  };
  fs.writeFileSync(`${OUT}/${c.id}.json`, JSON.stringify(skill, null, 2));
}
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify({ classes: classes.map((c: any) => c.id) }));
console.log(`wrote ${classes.length} class skill packs to ${OUT}`);
