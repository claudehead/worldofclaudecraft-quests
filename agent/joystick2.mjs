import { chromium } from 'playwright';
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
const OBS='C:/tmp/woc-obs.json', CTL='C:/tmp/woc-ctl.json';
writeFileSync(CTL, JSON.stringify({cmd:'idle'}));
const b = await chromium.launch({ headless:false, args:['--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding'] });
const ctx = await b.newContext({ viewport:{width:1280,height:800}, recordVideo:{dir:'C:/tmp/woc-joyvid',size:{width:1280,height:800}} });
const p = await ctx.newPage();
await p.goto('http://localhost:5173',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
await p.evaluate(()=>document.querySelector('#btn-offline')?.click()); await p.waitForTimeout(3000);
await p.evaluate(()=>{const i=[...document.querySelectorAll('input')].find(x=>x.offsetParent&&(x.type==='text'||!x.type));if(i){i.value='Claude';i.dispatchEvent(new Event('input',{bubbles:true}));}});
try{ await p.locator('[data-class="mage"]:visible').first().click({timeout:4000}); }catch{}
await p.waitForTimeout(500); await p.click('#btn-start-offline');
let ready=false;for(let i=0;i<25;i++){ready=await p.evaluate(()=>!!(window.__game?.sim?.player));if(ready)break;await p.waitForTimeout(1000);}
await p.mouse.click(640,420); await p.waitForTimeout(400);
console.log('JOYSTICK READY class='+await p.evaluate(()=>window.__game.sim.player.resourceType));

let wDown=false,sDown=false;
const W=async on=>{if(wDown===on)return;wDown=on;on?await p.keyboard.down('w'):await p.keyboard.up('w');};
const S=async on=>{if(sDown===on)return;sDown=on;on?await p.keyboard.down('s'):await p.keyboard.up('s');};
// node-side unstuck state
let lastX=null,lastZ=null, stuck=0, faceOff=0, faceSign=1;
const tEnd=Date.now()+900000;
while(Date.now()<tEnd){
  let cmd={cmd:'idle'}; try{cmd=JSON.parse(readFileSync(CTL,'utf8'));}catch{}
  if(cmd.cmd==='quit')break;
  const obs=await p.evaluate(({cmd,faceOff})=>{
    const s=window.__game.sim,p=s.player;const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);const meta=s.players.get(s.primaryId);
    let status='', moving=false;
    const ent=id=>s.entities.get(id);
    const face=t=>{ p.facing=Math.atan2(t.x-p.pos.x,t.z-p.pos.z)+faceOff; };
    const mv={w:false,s:false};
    const rb=()=>[...s.entities.values()].find(e=>e.kind==='npc'&&/redbrook/i.test(e.name||''));
    if(!p.dead){
      if(cmd.cmd==='kill'&&cmd.id!=null){
        const t=ent(cmd.id);
        if(!t||t.dead){status='target_dead';}
        else{ const dist=d2(p.pos,t.pos); face(t.pos); try{s.targetEntity(t.id);}catch{}
          // RANGE DISCIPLINE: mage holds at ~16yd; only approach if beyond cast range
          if(dist>16){mv.w=true;moving=true;}
          if(dist<=28){ if(p.resource>=15){try{['fireball','frostbolt','fire_blast','scorch'].forEach(a=>s.castAbility&&s.castAbility(a));}catch{}} if(dist<=5)try{s.startAutoAttack();}catch{} }
          status='engaging d'+Math.round(dist);
        }
      }
      else if(cmd.cmd==='go'&&cmd.npc){
        const t=[...s.entities.values()].find(e=>e.kind==='npc'&&new RegExp(cmd.npc,'i').test(e.name||''));
        if(t){face(t.pos);const dist=d2(p.pos,t.pos);if(dist>2.3){mv.w=true;moving=true;status='walking d'+Math.round(dist);}else status='at_npc';}
        else status='npc_not_visible';
      }
      else if(cmd.cmd==='goto'&&cmd.x!=null){
        const dest={x:cmd.x,z:cmd.z};face(dest);const dist=d2(p.pos,dest);
        if(dist>2){mv.w=true;moving=true;status='goto d'+Math.round(dist);}else status='arrived';
      }
      else if(cmd.cmd==='accept'){const n=rb();if(n){face(n.pos);try{s.targetEntity(n.id);s.talkToNpc(n.id);s.acceptQuest&&s.acceptQuest(cmd.quest||'q_wolves');}catch{}status='accept';}}
      else if(cmd.cmd==='turnin'){const n=rb();if(n){face(n.pos);const dist=d2(p.pos,n.pos);if(dist>2.3){mv.w=true;moving=true;status='approaching_turnin d'+Math.round(dist);}else{try{s.targetEntity(n.id);s.turnInQuest&&s.turnInQuest(cmd.quest||'q_wolves');s.talkToNpc(n.id);}catch{}status='turnin';}}else status='giver_not_visible';}
      else if(cmd.cmd==='say'){try{s.chat('/s '+(cmd.text||'...'));}catch{}status='said';}
      else if(cmd.cmd==='flee'){mv.s=true;moving=true;status='fleeing';}
      else if(cmd.cmd==='consume'){for(const it of (meta.inventory||[])){const id=it.itemId||it.id;if(id&&/water|drink|bread|cheese|meat|fish|food|trout/i.test(id)){try{s.useItem(id);}catch{}status='consumed '+id;break;}}}
    } else { if(cmd.cmd==='revive'){try{s.releaseSpirit();}catch{}status='revived';} else status='DEAD'; }
    const mobs=[...s.entities.values()].filter(e=>e.kind==='mob'&&!e.dead&&e.hostile&&d2(p.pos,e.pos)<70).sort((a,b)=>d2(p.pos,a.pos)-d2(p.pos,b.pos)).slice(0,8).map(e=>({id:e.id,name:e.name,dist:Math.round(d2(p.pos,e.pos)),hp:Math.round(e.hp),lvl:e.level}));
    const npcs=[...s.entities.values()].filter(e=>e.kind==='npc'&&d2(p.pos,e.pos)<50).map(e=>({name:e.name,dist:Math.round(d2(p.pos,e.pos))})).sort((a,b)=>a.dist-b.dist);
    const qp=meta.questLog.get('q_wolves');
    return {status,moving,mv,pos:{x:p.pos.x,z:p.pos.z},self:{hp:Math.round(p.hp),maxHp:p.maxHp,mana:Math.round(p.resource),maxMana:p.maxResource,level:p.level,xp:s.xp,pos:{x:Math.round(p.pos.x),z:Math.round(p.pos.z)},dead:p.dead,inCombat:p.inCombat},target:p.targetId!=null&&ent(p.targetId)&&!ent(p.targetId).dead?{id:p.targetId,name:ent(p.targetId).name,hp:Math.round(ent(p.targetId).hp),dist:Math.round(d2(p.pos,ent(p.targetId).pos))}:null,mobs,npcs,quest:{state:s.questState?s.questState('q_wolves'):'?',counts:qp?qp.counts:null,done:meta.questsDone?.has('q_wolves'),log:[...meta.questLog.keys()]}};
  }, {cmd, faceOff});
  // ---- unstuck: if trying to move but position isn't changing, strafe around ----
  if(obs.moving){
    const moved = lastX!=null ? Math.hypot(obs.pos.x-lastX, obs.pos.z-lastZ) : 1;
    if(moved < 0.25){ stuck++; } else { stuck=0; faceOff=0; }
    if(stuck>=2){ faceOff = faceSign*1.0; }     // veer ~57deg to slide along the obstacle
    if(stuck>=6){ faceSign*=-1; stuck=2; }       // try the other way
  } else { stuck=0; faceOff=0; }
  lastX=obs.pos.x; lastZ=obs.pos.z;
  await W(obs.mv.w); await S(obs.mv.s);
  obs.stuck=stuck;
  writeFileSync(OBS, JSON.stringify(obs));
  await p.waitForTimeout(450);
}
await W(false);await S(false);
console.log('JOYSTICK DONE');
await ctx.close(); await b.close();
const v=readdirSync('C:/tmp/woc-joyvid').filter(f=>f.endsWith('.webm'));
console.log('VIDEO:C:/tmp/woc-joyvid/'+v[v.length-1]);
