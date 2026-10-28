import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const base=resolve(import.meta.dirname,'../../src/src/engine/whoof');
const {outputFiles}=await build({stdin:{contents:`export {OpeningScene} from '${base}/OpeningScene.ts';export {getTrustState,TRUST_SCROLL_UNITS} from '${base}/landing/trust/TrustMotion.ts';export {Group,Object3D,PerspectiveCamera,Quaternion,Vector3,Euler,Scene} from 'three';`,resolveDir:base,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const m=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const {OpeningScene,getTrustState,TRUST_SCROLL_UNITS,Group,Object3D,PerspectiveCamera,Quaternion,Vector3,Euler,Scene}=m;
function makeWorld(width,height){
 const world=Object.create(OpeningScene.prototype);
 Object.assign(world,{width,height,mobile:width<=600,portrait:width/height<=1,scene:new Scene(),product:new Group(),camera:new PerspectiveCamera(27,1,.1,60),sourceCamera:new Object3D(),sourceProduct:new Object3D(),heroRotation:new Quaternion().setFromAxisAngle(new Vector3(0,1,0),-.28),finalRotation:new Quaternion().setFromEuler(new Euler(-.25,-.3,.17)),originCamera:new Quaternion(),originProduct:new Quaternion(),motion:new Quaternion(),storySpinAxis:new Vector3(1,1,1).normalize(),storySpinRotation:new Quaternion(),trustProductPosition:new Vector3(),trustProductScale:new Vector3(),trustProductRotation:new Quaternion(),trustCameraPosition:new Vector3(),trustCameraRotation:new Quaternion(),renderer:{autoClear:true,render(){}}});
 // A moving source track exercises evaluation of the target at every frame;
 // no DOM, WebGL or duplicate renderer is needed to check the join contract.
 world.cameraTrack={applyTransform(frame){world.sourceCamera.quaternion.setFromEuler(new Euler(frame*.001,frame*.002,0));}};
 world.productTrack={applyTransform(frame){world.sourceProduct.quaternion.setFromEuler(new Euler(frame*.002,-frame*.003,frame*.001));world.sourceProduct.position.y=.748364+frame*.0002;}};
 return world;
}
// q and -q are the same rotation; canonicalize before derivative comparisons.
const rotation=q=>q.toArray().map(v=>q.w<0?-v:v);
const snapshot=w=>[...w.product.position.toArray(),...w.product.scale.toArray(),...rotation(w.product.quaternion),...w.camera.position.toArray(),...rotation(w.camera.quaternion),w.camera.fov,w.camera.view.fullWidth,w.camera.view.fullHeight,w.camera.view.offsetX,w.camera.view.offsetY];
for(const [width,height] of [[1440,900],[1020,1194],[390,844]]){
 const w=makeWorld(width,height),end=TRUST_SCROLL_UNITS,render=t=>{const s=getTrustState(t*height,height,width);w.renderTrust(s,t-end+.64,0,0,false);return snapshot(w);};
 for(const t of [-.5,0,.4,1.3,2.0,3.25,4.399,end,end+.1,end+2])assert.ok(render(t).every(Number.isFinite));
 const actual=render(end);w.render(.64,0,0,false);const expected=snapshot(w);
 actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-9,'same source pose, camera and projection at exact join'));
 const e=1e-5,minus=render(end-e),at=render(end),plus=render(end+e);
 at.forEach((v,i)=>{const before=(v-minus[i])/e,after=(plus[i]-v)/e;assert.ok(Math.abs(before-after)<Math.max(.1,width*.001),'first derivative at '+width+'×'+height+', field '+i+': '+before+' vs '+after);});
 assert.deepEqual(render(2),render(2),'reverse restores exact physical state');
 const keys=[];w.trustLights={render(renderer,width,draw,key){keys.push(key);draw();}};
 const early=getTrustState(.5*height,height,width);w.renderTrust(early,.5-end+.64,0,0,false);w.renderTrust(early,.5-end+.64,.7,-.3,false);
 assert.notEqual(keys.at(-1),keys.at(-2),'self-shadow invalidates when pointer turns the product');
 const late=getTrustState((end+1)*height,height,width);w.renderTrust(late,1.64,0,0,false);w.renderTrust(late,1.64,.7,-.3,false);
 assert.equal(keys.at(-1),keys.at(-2),'camera-only movement reuses the product shadow');
}
console.log('Trust render handoff: original Wearing pose/projection is exact at join and first derivatives remain continuous for desktop/portrait/phone.');
