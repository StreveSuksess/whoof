import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..');
const code=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/ProductPassageMotion.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {getProductPassageState:get,getProductPassageClip:clip}=await import('data:text/javascript;base64,'+Buffer.from(code.outputFiles[0].text).toString('base64'));
for(const h of [390,844,900,1194]){
 const states=[];let previous=0;
 for(let n=-1000;n<=1500;n++){
  const t=n/1000,s=get(t*h,h);states.push([t,s]);
  assert.ok(s.blend>=0&&s.blend<=1&&s.ui>=0&&s.ui<=1&&s.trustCopy>=0&&s.trustCopy<=1);assert.ok(s.blend>=previous&&s.blend-previous<.0021);previous=s.blend;
  assert.equal(clip(1000,6000,1000+t*h,h).bottom,Math.max(0,Math.min(h,1000+t*h+h-6000)));
 }
 for(const [t,s] of states.reverse())assert.deepEqual(get(t*h,h),s,'reverse has the exact same frame');
 assert.equal(get(-.45*h,h).blend,0);assert.equal(get(.45*h,h).blend,1);assert.equal(get(.5*h,h).ui,1,'direct price anchor is readable');
 for(const t of [-.45,.45]){const e=.00001;assert.ok(Math.abs(get((t+e)*h,h).blend-get((t-e)*h,h).blend)/(2*e)<.001,'endpoint blend velocity is zero');}
 assert.equal(get(.5*h,h,-.1*h).ui,0,'incoming UI cannot leak ahead of native section');
 assert.equal(get(0,h).ui,0,'middle of the bridge is a clean product frame');assert.equal(get(-.5*h,h).trustCopy,0,'outgoing copy leaves before native clipping can cut its paragraph');
 assert.deepEqual(clip(1000,6000,6000,h),{top:0,bottom:h});
}
console.log('Product passage: finite/reversible monotonic blend, zero endpoint velocity, UI anchor/boundary guards and strict fractional clips passed.');
