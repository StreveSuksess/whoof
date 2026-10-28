import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..');
const result=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/app/AppMotion.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {getAppSceneState,APP_SCROLL_UNITS}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
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

// Execute every canvas phase with a minimal 2D sink: catches missing point/index
// data and invalid alpha state without introducing a browser/renderer mock.
const canvasBuild=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/app/AppScreen.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const oldDocument=globalThis.document;
const gradient={addColorStop(){}};
const context=new Proxy({globalAlpha:1},{get:(object,key)=>key in object?object[key]:key==='createRadialGradient'||key==='createLinearGradient'?()=>gradient:()=>{},set:(object,key,value)=>(object[key]=value,true)});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
try{
 const {AppScreen}=await import('data:text/javascript;base64,'+Buffer.from(canvasBuild.outputFiles[0].text).toString('base64'));
 const screen=new AppScreen();
 for(let t=-.5;t<7.7;t+=.015){screen.update(getAppSceneState(t*900,900,1440));assert.equal(context.globalAlpha,1);}
 const state=getAppSceneState(3.4*900,900,1440);screen.update(state);const version=screen.texture.version;screen.update(state);assert.equal(screen.texture.version,version,'held frames do not upload another screen texture');screen.dispose();
}finally{globalThis.document=oldDocument;}
console.log('App screen: all forward/reverse phase data drawable, alpha restored and held texture uploads skipped.');

if(process.argv.includes('--built')){
 const html=readFileSync(resolve(repo,'src/dist/index.html'),'utf8');
 for(const text of ['data-app-world','data-app-caption','data-app-film','Пример интерфейса','После синхронизации'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('data-app-tab'),'old numbered tabs removed');
 assert.ok(html.includes('/whoof/life-gallery/outside.mp4'),'real existing film');
 console.log('App markup: native captions, illustrative data, existing real film and no numbered tabs passed.');
}
