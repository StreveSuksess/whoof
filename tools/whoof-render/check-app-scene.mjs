import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..');
const result=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/app/AppMotion.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {getAppSceneState,getAppViewportClip,getAppTitleProgress,getAppTitleReveal,getAppPairCaptionProgress,APP_SCROLL_UNITS}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
assert.equal(APP_SCROLL_UNITS,7);
for(const [w,h] of [[1440,900],[1020,1194],[390,844],[844,390]]){
 let previous;
 const samples=[];
 for(let n=-100;n<800;n++){
  const state=getAppSceneState(n/100*h,h,w);samples.push([n,state]);
  for(const k of ['day','zoom','compare','graph','context','handoff','opacity','paper','nextTitle'])assert.ok(state[k]>=0&&state[k]<=1,k);
  for(const value of Object.values(state).filter(v=>typeof v==='number'))assert.ok(Number.isFinite(value));
  assert.ok(state.phoneX>=w*.2&&state.phoneX<=w*.75);
  if(previous)assert.ok(Math.abs(state.phoneX-previous.phoneX)<w*.04,'continuous framing');
  previous=state;
 }
 for(const [n,state] of samples.reverse())assert.deepEqual(getAppSceneState(n/100*h,h,w),state,'reverse restores exact frame');
 assert.equal(getAppSceneState(.6*h,h,w).compare,0);assert.equal(getAppSceneState(2.2*h,h,w).zoom,1);assert.equal(getAppSceneState(3.45*h,h,w).graph,1);
 assert.ok(getAppSceneState(4.3*h,h,w).context>.99);assert.equal(getAppSceneState(5.9*h,h,w).handoff,1);
 assert.equal(getAppSceneState(6.7*h,h,w).opacity,1,'shared visual survives section boundary');assert.equal(getAppSceneState(8.0*h,h,w).opacity,0);
 const a=getAppSceneState(0,h,w,true),b=getAppSceneState(5*h,h,w,true);assert.equal(a.phoneX,b.phoneX);assert.equal(a.zoom,1);assert.equal(b.context,0);
}
console.log('App scene: bounded/reversible phases, continuous framing, reading holds, how handoff and reduced pose passed.');
assert.deepEqual(getAppViewportClip(1000,6300,700,900),{top:300,bottom:0});
assert.deepEqual(getAppViewportClip(1000,6300,7400,900),{top:0,bottom:100});
for(const height of [390,844,900,1194])for(let scroll=-height;scroll<height*11;scroll+=height/137){
 const clip=getAppViewportClip(height,height*7,scroll,height);
 assert.ok(clip.top>=0&&clip.top<=height&&clip.bottom>=0&&clip.bottom<=height);
 if(scroll<height)assert.ok(clip.top>=Math.min(height,height-scroll),'nothing above actual section edge');
 if(scroll>height*8)assert.ok(clip.bottom>=Math.min(height,scroll-height*8),'next section occludes fixed world');
}
console.log('App boundary: actual-scroll entry/exit clips prevent fixed graphics crossing adjacent sections.');
// No native/fixed ownership switch and no title ahead of the outgoing caption.
assert.equal(getAppPairCaptionProgress(5.9),1);assert.equal(getAppPairCaptionProgress(6.35),0);
assert.equal(Math.min(getAppPairCaptionProgress(7.2),getAppPairCaptionProgress(5.9)),0,'fixed pair caption never leaks into actual next content');
for(const [actual,scene] of [[6.5,6.1],[5.9,7.3],[7.9,6.9],[8.1,7.4]])assert.equal(getAppTitleReveal(actual,scene),0);
for(let n=0;n<9000;n++){
 const t=n/1000,reveal=getAppTitleReveal(t,t);assert.ok(reveal>=0&&reveal<=1);assert.equal(reveal,getAppTitleProgress(t));
 if(n)assert.ok(Math.abs(reveal-getAppTitleReveal(t-.001,t-.001))<.004,'line reveal never jumps at the old ownership thresholds');
 for(const lag of [-1,-.4,.4,1]){const bounded=getAppTitleReveal(t,t-lag);assert.ok(bounded<=reveal+.00001);}
}
console.log('App handoff title: delayed/fast/reverse boundary guards and continuous single-owner line reveal passed.');
const tracks=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/app/AppPose.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {sampleAppTrack}=await import('data:text/javascript;base64,'+Buffer.from(tracks.outputFiles[0].text).toString('base64'));
const knots=[[0,0,1],[1,2,3],[2.5,-1,2],[4,3,0]];
for(const knot of knots)assert.deepEqual(sampleAppTrack(knot[0],knots),knot.slice(1));
for(const t of [1,2.5]){const e=.00001,left=sampleAppTrack(t-e,knots),mid=sampleAppTrack(t,knots),right=sampleAppTrack(t+e,knots);mid.forEach((v,i)=>assert.ok(Math.abs((v-left[i])/e-(right[i]-v)/e)<.001,'pose velocity is continuous at keys'));}
for(const [w,h] of [[1440,900],[1020,1194],[390,844]]){
 const start=getAppSceneState(5.85*h,h,w),end=getAppSceneState(7.15*h,h,w);
 assert.ok(Math.abs(end.rotateY-start.rotateY)>.5,'phone keeps turning beyond entry');
 assert.ok(end.collarSpin-start.collarSpin>1,'collar keeps rolling beyond entry');
 assert.ok(Math.hypot((end.phoneX-start.phoneX)/w,(end.phoneY-start.phoneY)/h)>.025,'pair continues its spatial travel');
 for(let t=4.9;t<7.2;t+=.01){const a=getAppSceneState(t*h,h,w),b=getAppSceneState((t+.01)*h,h,w);assert.ok(Math.abs(b.collarX-a.collarX)<w*.04);assert.ok(Math.abs(b.collarSpin-a.collarSpin)<.04);}
 if(w===1020)assert.ok(getAppSceneState(5.9*h,h,w).phoneHeight>h*.70,'portrait foreground reveal is substantial');
}
console.log('App choreography: C1 pose tracks, continued phone turn/collar roll, spatial travel and foreground scale passed.');

// Pure vector artwork: chronological bounds, exact reverse, resolved clip IDs.
const artworkBuild=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/app/AppArtwork.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {getAppArtworkState,renderAppArtwork,renderAppScreenSvg,DAY_ACTIVITY,DAY_PLOT}=await import('data:text/javascript;base64,'+Buffer.from(artworkBuild.outputFiles[0].text).toString('base64'));
assert.equal(DAY_ACTIVITY.length,144);assert.ok(DAY_ACTIVITY.every(v=>v>=0&&v<=1));
assert.equal(getAppArtworkState(0,0,0,0).time,'00:00');assert.equal(getAppArtworkState(.5,0,0,0).time,'12:00');assert.equal(getAppArtworkState(1,0,0,0).time,'23:59');
const frames=[];
for(let t=-.5;t<7.7;t+=.015){
 const scene=getAppSceneState(t*900,900,1440),state=getAppArtworkState(scene.day,scene.graph,scene.compare,scene.zoom);frames.push([scene,state]);
 for(const value of Object.values(state).filter(v=>typeof v==='number'))assert.ok(Number.isFinite(value));
 assert.ok(state.dayWidth>=0&&state.dayWidth<=DAY_PLOT.span);assert.ok(state.weekWidth>=0&&state.weekWidth<=DAY_PLOT.span);assert.ok(state.cursorX>=DAY_PLOT.left&&state.cursorX<=DAY_PLOT.right);
}
for(const [scene,state] of frames.reverse())assert.deepEqual(getAppArtworkState(scene.day,scene.graph,scene.compare,scene.zoom),state);
for(const svg of [renderAppScreenSvg(),...['day','week'].flatMap(mode=>[renderAppArtwork(mode),renderAppArtwork(mode,true)])]){
 assert.ok(!/NaN|Infinity/.test(svg));
 const ids=[...svg.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,id] of svg.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(id),id);
 assert.ok(svg.includes('Концепт интерфейса'));assert.ok(svg.includes('Демонстрационные данные'));
}
assert.ok(renderAppArtwork('week',true).includes('data-art-week="" opacity="1"'));assert.ok(renderAppArtwork('week',true).includes('>История движения</text>'));
console.log('App vectors: 144 chronological intervals, midnight/end labels, finite/reversible clipping, unique resolved IDs and shared static derivatives passed.');

// Geometry normals and render-state isolation guard the physical pair.
const physicalBuild=await build({stdin:{contents:`export {phoneSidewall,phoneFace} from './src/src/engine/whoof/landing/app/AppPhoneBody';export {AppLighting} from './src/src/engine/whoof/landing/app/AppLighting';export {Scene,Texture} from 'three';`,resolveDir:repo},nodePaths:[resolve(repo,'src/node_modules')],bundle:true,write:false,platform:'node',format:'esm'});
const physical=await import('data:text/javascript;base64,'+Buffer.from(physicalBuild.outputFiles[0].text).toString('base64'));
const body=physical.phoneSidewall();body.computeBoundingBox();assert.ok(Math.abs(body.boundingBox.max.x-body.boundingBox.min.x-2.11)<.00001);assert.ok(Math.abs(body.boundingBox.max.z-body.boundingBox.min.z-.239)<.00001);
const normals=body.getAttribute('normal');for(let i=0;i<normals.count;i++)assert.ok(Math.abs(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))-1)<.00001);body.dispose();
const physicalScene=new physical.Scene(),originalEnv=new physical.Texture(),appEnv=new physical.Texture();physicalScene.environment=originalEnv;physicalScene.environmentIntensity=.7;
const lighting=new physical.AppLighting(physicalScene,true,appEnv),renderer={shadowMap:{enabled:false,type:0}};
assert.throws(()=>lighting.render(renderer,1440,()=>{assert.equal(physicalScene.environment,appEnv);assert.equal(renderer.shadowMap.enabled,true);throw Error('interrupted render');},'pose-a'),/interrupted render/);
assert.equal(physicalScene.environment,originalEnv);assert.equal(physicalScene.environmentIntensity,.7);assert.equal(lighting.key.visible,false);assert.equal(renderer.shadowMap.enabled,false);assert.equal(renderer.shadowMap.type,0);lighting.dispose();originalEnv.dispose();appEnv.dispose();
console.log('App physical pair: finite unit sidewall normals, manufactured bounds, environment/shadow state restored even on interrupted render.');

if(process.argv.includes('--built')){
 const html=readFileSync(resolve(repo,'src/dist/index.html'),'utf8');
 for(const text of ['data-app-world','data-app-caption','data-app-film','Концепт интерфейса','После синхронизации'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('data-app-tab'),'old numbered tabs removed');
 assert.ok(!html.includes('class="app-poster"'),'early flat phone removed');
 assert.ok(html.includes('data-app-next-title'),'single managed title stage retains native heading');
 assert.equal([...html.matchAll(/id="how-title"/g)].length,1,'heading is never cloned into a second owner');
 assert.ok(html.includes('/whoof/life-gallery/outside.mp4'),'real existing film');
 console.log('App markup: native captions, illustrative data, existing real film and no numbered tabs passed.');
}
