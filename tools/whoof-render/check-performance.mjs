import assert from 'node:assert/strict';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
import {resolve} from 'node:path';
const repo=resolve(import.meta.dirname,'../..');
async function load(file){const r=await build({entryPoints:[resolve(repo,file)],bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const {chooseYarnDetail,createYarnGeometry}=await load('src/src/engine/whoof/CollarDetail.ts');
assert.equal(chooseYarnDetail(300,-1),0);assert.equal(chooseYarnDetail(1000,-1),1);assert.equal(chooseYarnDetail(1800,-1),2);
assert.equal(chooseYarnDetail(820,0),0);assert.equal(chooseYarnDetail(760,1),1);assert.equal(chooseYarnDetail(1800,0),2);assert.equal(chooseYarnDetail(300,2),0);
for(const [steps,sides] of [[40,9],[24,7],[16,6],[12,5]]){const g=createYarnGeometry(steps,sides);assert.equal(g.index.count/3,steps*sides*2);const n=g.getAttribute('normal');for(let i=0;i<n.count;i++)assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5);g.dispose();}
const {RenderQuality,getRenderBudget}=await load('src/src/engine/whoof/landing/RenderQuality.ts');
for(const [w,h,dpr] of [[1440,900,2],[390,844,3],[3840,2160,2]])for(const level of [0,1,2]){const b=getRenderBudget(w,h,dpr,level);assert.ok(b.ratio>0&&b.ratio<=dpr);assert.ok(w*h*b.ratio*b.ratio<=b.maxPixels+1);}
const q=new RenderQuality();assert.equal(q.level,2);for(let i=0;i<180;i++)q.sample(33,true);assert.ok(q.level<2,'sustained active overload lowers budget');const reduced=q.level;for(let i=0;i<30;i++)q.sample(16.6,true);assert.equal(q.level,reduced,'quality cannot oscillate immediately');for(let i=0;i<1400;i++)q.sample(16.6,true);assert.equal(q.level,2,'sustained headroom restores quality');for(let i=0;i<30;i++)q.sample(1000,false);assert.equal(q.level,2,'idle/hidden gaps are ignored');
const {PoseFrameCache}=await load('src/src/engine/whoof/PoseFrameCache.ts');
let active=0,maxActive=0,closed=0;const decode=async key=>{active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,1));active--;return {width:4,height:4,close(){closed++;},key};};
const c=new PoseFrameCache(decode,192,2);c.request(['a','b','c'],['a']);await c.settled();assert.ok(c.get('a'));assert.ok(c.bytes<=192);c.request(['d','e','f'],['a','d']);await c.settled();assert.ok(c.get('a')&&c.get('d'));assert.ok(c.bytes<=192);assert.ok(closed>0);assert.ok(maxActive<=2);
c.request(['late'],[]);c.dispose();await c.settled();assert.equal(c.bytes,0);assert.equal(c.get('late'),undefined,'late decode cannot repopulate a disposed cache');
console.log('Performance: geometry normals/counts, LOD hysteresis, pixel budgets, quality recovery and bounded/cancellable bitmap lifetime passed.');
