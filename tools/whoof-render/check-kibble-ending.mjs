import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..'),base=resolve(repo,'src/src/engine/whoof/landing/ending');
const {outputFiles}=await build({stdin:{contents:`export {KibbleMotion,projectKibblePointer} from '${base}/KibbleMotion.ts';export {createKibbleGeometry,createKibbleMaps} from '${base}/KibbleGeometry.ts';export {getEndingClip} from '${base}/KibbleStage.ts';export {PerspectiveCamera,Vector3} from 'three';`,resolveDir:repo},bundle:true,write:false,format:'esm',platform:'node',nodePaths:[resolve(repo,'src/node_modules')]});
const {KibbleMotion,projectKibblePointer,createKibbleGeometry,createKibbleMaps,getEndingClip,PerspectiveCamera,Vector3}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
for(const [width,height] of [[761,1194],[1440,900],[390,844]])for(const progress of [.1,.5,1])for(const [px,py] of [[-.7,.5],[.6,-.3]]){
 const camera=new PerspectiveCamera(40,width/height,.2,24);camera.position.z=8;camera.setViewOffset(width,height,0,-(1-progress)*height*.24,width,height);camera.updateMatrixWorld();
 const ray=new Vector3(px,-py,.5).unproject(camera).sub(camera.position).normalize();ray.multiplyScalar(-8/ray.z).add(camera.position);
 const worldH=2*Math.tan(40*Math.PI/360)*8,p=projectKibblePointer(px,py,worldH*width/height,worldH,progress);
 assert.ok(Math.hypot(p.x-ray.x,p.y-ray.y)<1e-8,'cursor uses the actual entering camera ray, not an unshifted screen plane');
}
const seeded=new KibbleMotion(72),copy=new KibbleMotion(72);
assert.deepEqual(seeded.position,copy.position,'stable composition on repeat loads');
seeded.step(0,0,0,true);assert.deepEqual(seeded.position,copy.position,'paused frames cannot move food');
for(let i=0;i<600;i++){seeded.step(1/60,Math.sin(i*.03)*2,-.95+Math.cos(i*.03)*.3,true);copy.step(1/60,0,0,false);}
let displacement=0;
for(let i=0;i<seeded.position.length;i++){assert.ok(Number.isFinite(seeded.position[i]));assert.ok(Number.isFinite(seeded.rotation[i]));assert.ok(Math.abs(seeded.velocity[i])<=3.201);displacement+=Math.abs(seeded.position[i]-copy.position[i]);}
assert.ok(displacement>3,'cursor changes individual motion rather than only camera parallax');
const before=copy.position.slice();copy.resize(3);
for(let i=0;i<copy.capacity;i++)assert.ok(Math.abs(copy.position[i*3]-before[i*3]*.5)<1e-5,'responsive width preserves normalized positions');
const contact=new KibbleMotion(2);contact.position.set([0,-.95,0,.01,-.95,0]);contact.velocity.fill(0);contact.step(.001,0,0,false);
const delta=Math.hypot(contact.position[3]-contact.position[0],contact.position[4]-contact.position[1],contact.position[5]-contact.position[2]);
assert.ok(delta>=(contact.scale[0]+contact.scale[1])*.16-.0001,'contact correction separates intersecting pieces');
const dense=new KibbleMotion(420);const start=performance.now();let maxChecks=0;
for(let i=0;i<180;i++){dense.step(1/60,0,-1,true);maxChecks=Math.max(maxChecks,dense.contactChecks);}
assert.ok(maxChecks<420*420/2,'linked cells avoid full all-pairs scans at render cadence');
for(const dt of [.2,.05,1/120]){dense.step(dt,0,-1,true);assert.ok([...dense.position].every(Number.isFinite),'stationary pointer and large dt stay finite');}
console.log(`Kibble motion: deterministic, paused, cursor, contact and resize passed; ${((performance.now()-start)/180).toFixed(2)}ms/step, max${maxChecks} local checks.`);
for(const geometry of createKibbleGeometry()){
 geometry.computeBoundingBox();assert.ok(geometry.boundingBox.max.length()<.7);
 const positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal');
 for(let i=0;i<positions.count;i++){assert.ok(Number.isFinite(positions.getX(i)+positions.getY(i)+positions.getZ(i)));const length=Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i));assert.ok(length>.9&&length<1.1,'finite unit surface normals');}
 geometry.dispose();
}
const maps=createKibbleMaps(64);assert.equal(maps.map.image.data.length,64*64*4);assert.equal(maps.normalMap.image.data.length,64*64*4);assert.ok(maps.map.image.data.some((v,i)=>i%4!==3&&v!==maps.map.image.data[0]),'porous albedo has material variation');maps.map.dispose();maps.normalMap.dispose();
for(const h of [844,1194]){
 assert.deepEqual(getEndingClip(1000,1300,1000-h,h),{top:h,bottom:0});
 assert.deepEqual(getEndingClip(1000,1300,2300,h),{top:0,bottom:h});
 assert.deepEqual(getEndingClip(1000,1300,1000,h),{top:0,bottom:0});
}
if(process.argv.includes('--built')){
 const html=readFileSync(resolve(repo,'src/dist/index.html'),'utf8');
 assert.equal((html.match(/data-block=/g)||[]).length,8,'main visitor-question sections unchanged');
 assert.equal((html.match(/data-accordion/g)||[]).length,14,'accordion refinement remains');
 assert.equal((html.match(/class="final-action"/g)||[]).length,1,'one final action');
 assert.ok(html.includes('data-ending-world')&&html.includes('id="finish"'));
 assert.ok(!html.includes('COFFEE_BEAN'),'ending does not use coffee assets');
}
console.log('Kibble geometry/material maps, actual footer clips and ending markup passed.');
