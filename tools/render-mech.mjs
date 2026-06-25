// Render the Combat Mech with each chroma texture applied -> a real image per
// cosmetic. node render-mech.mjs <chromas.json> <woc/public> <out dir>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , listPath, publicDir, outDir] = process.argv;
const chromas = JSON.parse(fs.readFileSync(listPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const THREE_DIR = path.join(__dirname, 'node_modules', 'three');
const MIME = { '.glb': 'model/gltf-binary', '.js': 'text/javascript', '.png': 'image/png', '.html': 'text/html' };
const send = (res, f, t) => { try { res.writeHead(200, { 'Content-Type': t, 'Access-Control-Allow-Origin': '*' }); res.end(fs.readFileSync(f)); } catch { res.writeHead(404); res.end('nf'); } };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/harness.html') return res.writeHead(200, { 'Content-Type': 'text/html' }), res.end(HARNESS);
  if (u.startsWith('/vendor/jsm/')) return send(res, path.join(THREE_DIR, 'examples', 'jsm', u.slice(12)), 'text/javascript');
  if (u.startsWith('/vendor/')) return send(res, path.join(THREE_DIR, 'build', u.slice(8)), 'text/javascript');
  if (u.startsWith('/assets/')) return send(res, path.join(publicDir, u.slice(8)), MIME[path.extname(u)] || 'application/octet-stream');
  res.writeHead(404); res.end('nf');
});
const HARNESS = `<!doctype html><meta charset=utf8><canvas id=c width=512 height=512></canvas>
<script type=importmap>{"imports":{"three":"/vendor/three.module.js"}}</script>
<script type=module>
import * as THREE from 'three';
import { GLTFLoader } from '/vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/vendor/jsm/libs/meshopt_decoder.module.js';
const canvas=document.getElementById('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setClearColor(0,0); renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(35,1,0.01,100);
scene.add(new THREE.HemisphereLight(0xffffff,0x55555f,1.2));
const k=new THREE.DirectionalLight(0xffffff,1.5);k.position.set(2,4,3);scene.add(k);
const f=new THREE.DirectionalLight(0xffffff,.6);f.position.set(-3,1,1);scene.add(f);
const loader=new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const texLoader=new THREE.TextureLoader();
let cur=null;
window.__renderMech=async({glb,texture})=>{
  if(cur){scene.remove(cur);cur=null;}
  const gltf=await loader.loadAsync(glb); const model=gltf.scene;
  const tex=await texLoader.loadAsync(texture); tex.flipY=false; tex.colorSpace=THREE.SRGBColorSpace; tex.needsUpdate=true;
  model.traverse(o=>{ if(o.isMesh||o.isSkinnedMesh){ o.frustumCulled=false; o.material=new THREE.MeshLambertMaterial({map:tex}); }});
  if(gltf.animations&&gltf.animations.length){const cl=gltf.animations.find(a=>/idle|stand/i.test(a.name))||gltf.animations[0];const m=new THREE.AnimationMixer(model);m.clipAction(cl).play();m.update(0.6);}
  scene.add(model); cur=model; model.updateWorldMatrix(true,true);
  const box=new THREE.Box3().setFromObject(model); const size=new THREE.Vector3(); box.getSize(size); const c=new THREE.Vector3(); box.getCenter(c);
  model.position.sub(c); model.rotation.y=-0.4;
  const r=Math.max(size.x,size.y,size.z)*0.5||1; const d=r/Math.tan(camera.fov*Math.PI/360)*1.5;
  camera.position.set(d*0.5,r*0.5,d); camera.lookAt(0,0,0); camera.updateProjectionMatrix();
  renderer.render(scene,camera); renderer.render(scene,camera);
  return canvas.toDataURL('image/png');
};
window.__ready=true;
</script>`;
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('  [err]', String(e).split('\n')[0]));
await page.goto(`${base}/harness.html`); await page.waitForFunction('window.__ready===true', { timeout: 30000 });
let ok = 0, fail = 0;
for (const c of chromas) {
  try {
    const url = await page.evaluate(a => window.__renderMech(a), { glb: `${base}/assets/models/chars/players/Mech/characters/CombatMech.glb`, texture: `${base}/assets/${c.texture}` });
    fs.writeFileSync(path.join(outDir, `${c.id}.png`), Buffer.from(url.split(',')[1], 'base64')); ok++;
  } catch (e) { fail++; console.log(`  ✗ ${c.id}: ${String(e).split('\n')[0]}`); }
}
console.log(`done: ${ok} mech renders, ${fail} failed`);
await browser.close(); server.close();
