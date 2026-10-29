import assert from 'node:assert/strict';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
async function load(file){const r=await build({entryPoints:[resolve(root,file)],bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const {resolveSceneSize}=await load('src/src/engine/whoof/landing/SceneViewport.ts');
let size=resolveSceneSize(undefined,{width:390,height:700},true);
for(const height of [708,740,780,744,700,650,700]){
  size=resolveSceneSize(size,{width:390,height},true);
  assert.equal(size.height,700,'phone toolbar animation must not change scene lengths');
}
size=resolveSceneSize(size,{width:844,height:390},true,true);
assert.deepEqual(size,{width:844,height:390},'rotation gets a new authored viewport');
assert.deepEqual(resolveSceneSize(size,{width:844,height:450},true),size,'landscape toolbar is stable too');
assert.deepEqual(resolveSceneSize(size,{width:844,height:450},true,true),{width:844,height:450},'explicit orientation change can retain width');
assert.deepEqual(resolveSceneSize({width:1440,height:900},{width:1440,height:720},false),{width:1440,height:720},'desktop window resize remains responsive');
const {advanceSceneScroll}=await load('src/src/engine/whoof/landing/ScrollTransport.ts');
for(const actual of [0,.9,7,18,2,0])assert.equal(advanceSceneScroll(3,actual,.016,true),actual,'touch scroll has no second easing tail');
assert.equal(advanceSceneScroll(2,9,.016,false),9,'far desktop jump renders destination in the same frame');
assert.equal(advanceSceneScroll(9,2,.016,false),2,'fast reverse jump does not retain the previous fixed scene');
assert.equal(advanceSceneScroll(.1,-.2,.016,true),0,'native rubber-band overscroll never yields a negative scene');
let p=advanceSceneScroll(1,1.2,.016,false);assert.ok(p>1&&p<1.2,'ordinary desktop motion retains original smoothing');
for(let i=0;i<100;i++)p=advanceSceneScroll(p,1.2,.016,false);assert.equal(p,1.2);
console.log('Mobile scroll: stable toolbar lengths, orientation/desktop resize, immediate touch/fast reverse transport and overscroll bounds passed.');
