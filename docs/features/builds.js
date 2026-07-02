'use strict';
// Build compendium — #/builds
// Named top builds for every class (DPS / Healer / Tank), each with a talent
// summary, priority rotation, theoretical level-20 DPS/HPS, and a one-click link
// into the talent planner. Self-registers into the app router.
(function () {
  const { el, esc, reveal, registerView } = window.WOC;

  const ROLE_COLOR = { DPS: '#e0526a', Healer: '#4bbf7b', Tank: '#46b8da' };
  const P = '#/planner/'; // planner route prefix
  // Every build's planner allocation is a legal 11-point deep-spec (capstone in),
  // encoded exactly as the planner reads it: #/planner/<class>/<spec>/<base36 ranks>.
  const CLASSES = [
    { id: 'warrior', name: 'Warrior', resource: 'Rage', builds: [
      { icon: '🗡', name: 'Bladestorm Reaver', spec: 'arms', specName: 'Arms · 2H', role: 'DPS', dps: 55, digits: '10000000232111',
        talents: 'Improved Mortal Strike (capstone) + Deep Wounds · choice: Impale',
        rot: ['Battle Shout — keep it up (2 min)', 'Rend on pull (bleed)', 'Mortal Strike on CD (6s)', 'Overpower on a dodge proc', 'Execute below 20% HP', 'Heroic Strike to dump rage when >30'] },
      { icon: '🩸', name: 'Crimson Berserker', spec: 'fury', specName: 'Fury · dual-wield', role: 'DPS', dps: 50, digits: '10000000321211',
        talents: 'Improved Bloodthirst (capstone) + Unbridled Wrath · choice: Flurry',
        rot: ['Bloodrage on pull (instant rage)', 'Battle Shout up', 'Bloodthirst on CD (6s)', 'Whirlwind on CD', 'Heroic Strike to bleed off the rage flood'] },
      { icon: '🛡', name: 'Bulwark Sentinel', spec: 'prot', specName: 'Protection', role: 'Tank', digits: '10000000332011',
        talents: 'Improved Shield Slam (capstone, +threat) + Anticipation · choice: Last Stand',
        rot: ['Defensive Stance on', 'Sunder Armor ×5 (stack the debuff)', 'Shield Slam on CD (spike threat)', 'Thunder Clap (AoE + attack-speed slow)', 'Heroic Strike / Revenge to dump rage', 'Taunt to peel'] },
    ] },
    { id: 'paladin', name: 'Paladin', resource: 'Mana', builds: [
      { icon: '⚖️', name: 'Verdict Crusader', spec: 'retribution', specName: 'Retribution · 2H', role: 'DPS', dps: 35, digits: '10000000332011',
        talents: 'Crusader Strikes (capstone) + Seal of Command · choice: Vengeance',
        rot: ['Blessing of Might (self AP)', 'Seal of Righteousness up', 'Judgement on CD (10s) — then re-seal', 'Consecration for AoE', 'Exorcism as a ranged poke'] },
      { icon: '🔰', name: 'Aegis Templar', spec: 'protection', specName: 'Protection', role: 'Tank', digits: '10000000332011',
        talents: 'Holy Shield (capstone) + Redoubt · choice: Blessing of Sanctuary',
        rot: ['Righteous Fury ON + Seal of Righteousness', 'Judgement on CD', 'Consecration (AoE threat)', 'Exorcism', 'Hammer of Justice to lock casters', 'Devotion Aura for the group'] },
      { icon: '☀️', name: 'Dawnbringer', spec: 'holy', specName: 'Holy', role: 'Healer', hps: 90, digits: '10000000332011',
        talents: 'Light Mastery (capstone) + Improved Holy Light · choice: Holy Grace',
        rot: ['Blessing of Might / Devotion Aura pre-buff', 'Flash of Light for spot healing', 'Holy Light for big tank heals', 'Lay on Hands = the 10-min panic button', 'Judgement on CD for mana return'] },
    ] },
    { id: 'hunter', name: 'Hunter', resource: 'Mana + pet', builds: [
      { icon: '🎯', name: 'Deadeye Marksman', spec: 'marksmanship', specName: 'Marksmanship', role: 'DPS', dps: 53, digits: '10000000332011',
        talents: 'Marksman Mastery (capstone, Aimed Shot) + Improved Arcane Shot · choice: Mortal Shots',
        rot: ['Aspect of the Hawk up', 'Serpent Sting (15s DoT)', 'Aimed Shot on CD (3s cast / 6s CD)', 'Arcane Shot on CD (6s)', 'Auto-shot between', 'Rapid Fire on cooldown for burst'] },
      { icon: '🐺', name: 'Packmaster', spec: 'beast_mastery', specName: 'Beast Mastery', role: 'DPS', dps: 45, digits: '10000000332011',
        talents: 'Focused Fire (capstone) + Unleashed Fury · choice: Frenzy / Bestial Wrath',
        rot: ['Pet tanks, you range', 'Serpent Sting up', 'Arcane Shot on CD', 'Auto-shot filler', 'Bestial Wrath window for the pet burst'] },
      { icon: '🏹', name: 'Thornstalker', spec: 'survival', specName: 'Survival · melee/kite', role: 'DPS', dps: 40, digits: '10000000332011',
        talents: 'Lightning Reflexes (capstone) + Savage Strikes · choice: Counterattack',
        rot: ['Wing Clip to kite', 'Raptor Strike on CD', 'Mongoose Bite on dodge procs', 'Aspect of the Monkey for dodge'] },
    ] },
    { id: 'rogue', name: 'Rogue', resource: 'Energy + combo points', builds: [
      { icon: '🌙', name: 'Nightshade Executioner', spec: 'assassination', specName: 'Assassination', role: 'DPS', dps: 66, digits: '10000000332011',
        talents: 'Improved Eviscerate line (capstone) + Remorseless Attacks · choice: Cold Blood',
        rot: ['Deadly/Instant Poison on weapons', 'Open from Stealth with Cheap Shot (2 CP)', 'Sinister Strike to 5 CP', 'Slice and Dice first (haste), then Eviscerate at 5 CP', 'Cold Blood → Eviscerate for a guaranteed-crit finisher', 'Adrenaline Rush when energy-starved'] },
      { icon: '⚔️', name: 'Ironblade Duelist', spec: 'combat', specName: 'Combat', role: 'DPS', dps: 52, digits: '10000000332011',
        talents: 'Weapon Mastery (capstone) + Precision · choice: Blade Flurry',
        rot: ['Keep Slice and Dice up', 'Sinister Strike spam to 5 CP', 'Eviscerate at 5 CP', 'Forgiving energy — best sustain'] },
      { icon: '🎭', name: 'Shadowdancer', spec: 'subtlety', specName: 'Subtlety', role: 'DPS', dps: 58, digits: '10000000332011',
        talents: 'Shadowstep (capstone) + Opportunity · choice: stealth-damage node',
        rot: ['Ambush from Stealth (×2.5 weapon)', 'Backstab (behind, ×1.5) to 5 CP', 'Eviscerate finisher', 'Vanish → Ambush to reset burst'] },
    ] },
    { id: 'priest', name: 'Priest', resource: 'Mana', builds: [
      { icon: '🌑', name: 'Umbral Whisper', spec: 'shadow', specName: 'Shadow', role: 'DPS', dps: 42, digits: '10000000332011',
        talents: 'Shadowform (capstone, +damage) + Shadow Word: Pain talents · choice: Improved Mind Flay',
        rot: ['Shadowform ON', 'Shadow Word: Pain (18s DoT, refresh)', 'Mind Blast on CD (8s)', 'Mind Flay channel as filler (also slows)', 'Self-heals via Shadow — great solo sustain'] },
      { icon: '🛡', name: 'Warden of Aegis', spec: 'discipline', specName: 'Discipline', role: 'Healer', hps: 85, digits: '10000000332011',
        talents: 'Penance (capstone) + Twin Disciplines · choice: Mental Agility',
        rot: ['Power Word: Shield pre-emptively (145 absorb, 6s CD)', 'Renew on the move', 'Flash Heal reactively', 'Fortitude buff the group', 'Prevention > reaction'] },
      { icon: '✨', name: 'Lightweaver', spec: 'holy', specName: 'Holy', role: 'Healer', hps: 95, digits: '10000000332011',
        talents: 'Spiritual Healing (capstone) + Improved Renew · choice: Divine Fury',
        rot: ['Renew rolling on the tank', 'Flash Heal for spike damage', 'Heal for efficient topping', 'Power Word: Shield to buy a cast'] },
    ] },
    { id: 'shaman', name: 'Shaman', resource: 'Mana + weapon imbues', builds: [
      { icon: '⚡', name: 'Stormcaller', spec: 'elemental', specName: 'Elemental', role: 'DPS', dps: 60, digits: '10000000332011',
        talents: 'Lightning Mastery (capstone, faster LB) + Concussion · choice: Elemental Focus',
        rot: ['Flame Shock (DoT)', 'Lightning Bolt spam (3s → 2.5s with talents)', 'Earth Shock on CD (6s) for instant damage / interrupt', 'Lightning Shield up'] },
      { icon: '🔨', name: 'Tempest Blade', spec: 'enhancement', specName: 'Enhancement', role: 'DPS', dps: 40, digits: '10000000332011',
        talents: 'Spirit Weapons (capstone) + Flurry · choice: Elemental Weapons',
        rot: ['Rockbiter / Flametongue imbue', 'Stormstrike on CD (12s, +nature)', 'Earth Shock on CD', 'Melee auto between', 'Lightning Shield as a buffer'] },
      { icon: '🌊', name: 'Tidemender', spec: 'restoration', specName: 'Restoration', role: 'Healer', hps: 90, digits: '10000000332011',
        talents: 'Chain Focus (capstone) + Improved Healing Wave · choice: Ancestral Healing',
        rot: ['Healing Wave as the workhorse', 'Downrank for efficiency', 'Lightning Shield on yourself', 'Frost/Earth Shock for utility'] },
    ] },
    { id: 'mage', name: 'Mage', resource: 'Mana', builds: [
      { icon: '🔥', name: 'Pyre Ascendant', spec: 'fire', specName: 'Fire', role: 'DPS', dps: 62, digits: '10000000332011',
        talents: 'Pyromancer (capstone, +fire & +Fireball) + Impact · choice: Combustion',
        rot: ['Fireball spam (3s, +DoT)', 'Fire Blast on CD (8s, instant — weave while moving)', 'Pyroblast opener when you can hard-cast (6s, huge)', 'Combustion for a crit-burst window'] },
      { icon: '❄️', name: 'Rimewarden', spec: 'frost', specName: 'Frost', role: 'DPS', dps: 54, digits: '10000000332011',
        talents: 'Winter Chill (capstone) + Shatter · choice: Ice Barrier',
        rot: ['Frostbolt spam (slows)', 'Frost Nova to root → step back', 'Shatter crits on frozen targets', 'Ice Barrier + Frost Armor = safest solo mage'] },
      { icon: '🔮', name: 'Aether Adept', spec: 'arcane', specName: 'Arcane', role: 'DPS', dps: 45, digits: '10000000332011',
        talents: 'Netherwind Focus (capstone, faster Missiles) + Arcane Power · choice: Presence of Mind',
        rot: ['Arcane Missiles channel as main', 'Arcane Explosion for packs (AoE)', 'Presence of Mind → instant Pyroblast/Fireball', 'Best AoE / burst utility'] },
    ] },
    { id: 'warlock', name: 'Warlock', resource: 'Mana + Life Tap + demon', builds: [
      { icon: '🩸', name: 'Rotbringer', spec: 'affliction', specName: 'Affliction', role: 'DPS', dps: 48, digits: '10000000332011',
        talents: 'Unstable Affliction (capstone) + Improved Corruption (instant) · choice: Amplify Curse',
        rot: ['Corruption (18s)', 'Curse of Agony (24s)', 'Immolate (fire DoT)', 'Drain Life as filler (heals you)', 'Refresh DoTs; Life Tap for mana', 'DPS climbs as every DoT ticks together'] },
      { icon: '👹', name: 'Feltamer', spec: 'demonology', specName: 'Demonology', role: 'DPS', dps: 44, digits: '10000000332011',
        talents: 'Metamorphosis (capstone, +STA/armor) + Fel Armor · choice: Master Summoner',
        rot: ['Voidwalker tanks (or Felguard for damage)', 'Corruption + Curse of Agony', 'Shadow Bolt filler', 'Life Tap freely — you are beefy', 'The unkillable soloing spec'] },
      { icon: '💥', name: 'Cinderlord', spec: 'destruction', specName: 'Destruction', role: 'DPS', dps: 54, digits: '10000000332011',
        talents: 'Backdraft (capstone) + Devastation · choice: Ruin (crit)',
        rot: ['Immolate up', 'Shadow Bolt spam (3s)', 'Shadowburn (instant, 15s CD) as finisher/execute', 'Succubus pet for extra melee'] },
    ] },
    { id: 'druid', name: 'Druid', resource: 'Mana / forms (rage · energy)', builds: [
      { icon: '🌙', name: 'Moonfury Oracle', spec: 'balance', specName: 'Balance', role: 'DPS', dps: 66, digits: '10000000332011',
        talents: 'Starfire Mastery (capstone) + Improved Moonfire · choice: Moonkin Form / Nature’s Grace',
        rot: ['Moonfire (DoT)', 'Insect Swarm (DoT)', 'Starfire hard-cast (3s, big)', 'Wrath as the faster filler', 'Keep both DoTs rolling'] },
      { icon: '🐆', name: 'Wildclaw', spec: 'feral', specName: 'Feral · Cat', role: 'DPS', dps: 56, digits: '10000000332011',
        talents: 'Heart of the Wild (capstone) + Ferocity · choice: Predatory Strikes (cat)',
        rot: ['Prowl → Rake opener (bleed + CP)', 'Claw to 5 CP', 'Rip (bleed finisher) or Ferocious Bite (burst)', 'Tiger’s Fury for an energy/damage spike'] },
      { icon: '🐻', name: 'Ironbark Guardian', spec: 'feral', specName: 'Feral · Bear', role: 'Tank', digits: '10000000332011',
        talents: 'Heart of the Wild (capstone) + Thick Hide · choice: Dire Bear (bear)',
        rot: ['Maul on every swing (rage)', 'Swipe for AoE threat', 'Growl to taunt', 'Demoralizing Roar (−enemy AP)', 'Enrage for rage; +65% armor = sturdiest tank'] },
      { icon: '🌿', name: 'Grovewarden', spec: 'restoration', specName: 'Restoration', role: 'Healer', hps: 85, digits: '10000000332011',
        talents: 'Tree of Life (capstone) + Improved Rejuvenation · choice: Nature’s Swiftness / Innervate',
        rot: ['Rejuvenation rolling on everyone (HoT)', 'Regrowth on the tank (heal + HoT)', 'Healing Touch for spike heals', 'Nature’s Swiftness → instant Healing Touch (emergency)'] },
    ] },
  ];

  const DPS_MAX = 70, HPS_MAX = 100;

  function card(cls, b) {
    const rc = ROLE_COLOR[b.role];
    const metric = b.role === 'DPS'
      ? { label: `~${b.dps} DPS`, w: Math.min(100, (b.dps / DPS_MAX) * 100) }
      : b.role === 'Healer'
        ? { label: `~${b.hps} HPS`, w: Math.min(100, (b.hps / HPS_MAX) * 100) }
        : { label: 'Tank', w: 100 };
    return `<div class="card build-card" data-role="${b.role}" style="padding:15px 16px;display:flex;flex-direction:column;gap:9px">
      <div style="display:flex;align-items:baseline;gap:9px">
        <span style="font-size:1.5rem;line-height:1">${b.icon}</span>
        <div style="flex:1">
          <div style="font-family:var(--display,serif);font-size:1.16rem;color:var(--gold,#e8c86a);line-height:1.15">${esc(b.name)}</div>
          <div class="meta" style="font-size:.82rem">${esc(b.specName)}</div>
        </div>
        <span class="pill" style="background:${rc};color:#0c130e;font-weight:700;align-self:flex-start">${esc(b.role)}</span>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:.8rem" class="meta"><span>${b.role === 'Tank' ? 'Role' : 'Theoretical L20'}</span><b style="color:${rc}">${metric.label}</b></div>
        <div style="height:7px;border-radius:4px;background:var(--line,#26201a);overflow:hidden;margin-top:3px"><div style="height:100%;width:${metric.w}%;background:linear-gradient(90deg,${rc},${rc}aa);border-radius:4px"></div></div>
      </div>
      <div class="meta" style="font-size:.83rem;line-height:1.4">🌿 ${esc(b.talents)}</div>
      <details class="build-rot">
        <summary style="cursor:pointer;font-size:.85rem;color:var(--gold,#e8c86a)">Rotation — when to cast ▾</summary>
        <ol style="margin:8px 0 2px;padding-left:20px;font-size:.87rem;line-height:1.5">${b.rot.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
      </details>
      <a class="btn ghost" data-go="${P}${cls.id}/${b.spec}/${b.digits}" style="align-self:flex-start;font-size:.85rem">⚙ Open in talent planner</a>
    </div>`;
  }

  function buildsView() {
    const app = window.WOC.app;
    app.innerHTML = '';
    app.append(el(`<section class="block"><div class="wrap">
      <div class="shead reveal"><span class="eyebrow">Guide · theorycraft</span><h2>Build compendium</h2>
        <p>Named top builds for every class — DPS, healer and tank — each with a talent summary, a priority rotation (top&nbsp;=&nbsp;cast first), and a one-click link into the planner. DPS/HPS are <b>theoretical single-target at level&nbsp;20</b> (white-hits + rotation, no misses) — read them as relative yardsticks; crit, gear and cooldowns push them higher.</p></div>
      <div class="controls reveal" style="gap:8px;flex-wrap:wrap">
        <div class="pills" id="bd-filter">
          ${['All', 'DPS', 'Healer', 'Tank'].map((r, i) => `<span class="pill${i === 0 ? ' active' : ''}" data-f="${r}">${r === 'All' ? 'All roles' : r}</span>`).join('')}
        </div>
      </div>
      <div id="bd-body" class="reveal"></div>
    </div></section>`));

    const body = app.querySelector('#bd-body');
    function render(filter) {
      body.innerHTML = CLASSES.map(cls => {
        const cards = cls.builds.filter(b => filter === 'All' || b.role === filter);
        if (!cards.length) return '';
        return `<div class="build-class" style="margin-top:22px">
          <div class="shead" style="margin-bottom:10px"><h3 style="margin:0">${esc(cls.name)} <span class="meta" style="font-weight:400;font-size:.8rem">· ${esc(cls.resource)}</span></h3></div>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(290px,1fr))">${cards.map(b => card(cls, b)).join('')}</div>
        </div>`;
      }).join('');
      reveal(body);
    }

    const filterHost = app.querySelector('#bd-filter');
    filterHost.querySelectorAll('.pill').forEach(p => {
      p.onclick = () => {
        filterHost.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        render(p.getAttribute('data-f'));
      };
    });
    render('All');
    reveal();
  }

  registerView('builds', buildsView);
})();
