import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const app=resolve(import.meta.dirname,'../../src');
const {outputFiles}=await build({entryPoints:[resolve(app,'src/engine/whoof/landing/OwnerPosterMotion.ts')],bundle:true,write:false,format:'esm',platform:'node'});
const {getOwnerPosterState,getOwnerEntryState}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
assert.equal(getOwnerPosterState(-.65*900,900,1440,2000,[{left:0,width:1000}],false).clip,1,'incoming picture is fully revealed before crossing the collar');
for(let local=-900;local<=100;local+=5){
 const entry=getOwnerEntryState(local,900);
 assert.ok(entry.backdrop>=0&&entry.backdrop<=1);
 if(!entry.worldVisible)assert.equal(entry.backdrop,1,'world only stops after an opaque backdrop covers it');
 if(local<=-.12*900)assert.equal(entry.backdrop,0,'no empty opaque band ahead of the poster');
 assert.deepEqual(getOwnerEntryState(local,900),entry,'entry is deterministic in either direction');
}
for(const [width,height,mobile] of [[1440,900,false],[1020,1194,false],[350,844,true]]){
 let left=0;const items=[1500,700,1720,700,2050].map(value=>{const w=mobile?width:Math.min(width,height*.8*value/1080);const item={left:mobile?0:left,width:w};left+=w+height*.8*24/1080;return item;});
 const movable=mobile?width*items.length:left-height*.8*24/1080-width;
 const start=getOwnerPosterState(0,height,width,movable,items,mobile);
 assert.equal(start.offset,0);assert.equal(start.panels[0].opacity,1);assert.equal(start.panels[0].x,0);
 const end=getOwnerPosterState(movable+height,height,width,movable,items,mobile);
 assert.equal(end.offset,movable);assert.equal(end.active,4);assert.equal(end.panels[4].visible,true);
 const states=[];
 for(let local=-height;local<=movable+height;local+=20){
  const state=getOwnerPosterState(local,height,width,movable,items,mobile);states.push([local,state]);
  assert.ok(state.offset>=0&&state.offset<=movable);
  assert.ok(state.clip>=0&&state.clip<=1);
  for(const p of state.panels){assert.ok(p.opacity>=0&&p.opacity<=1);assert.ok(p.x>=0&&p.x<=width);assert.ok(p.imageX<=0&&p.imageX>=-(200/1080)*height*.8-.0001);}
 }
 for(const [local,state] of states.reverse())assert.deepEqual(getOwnerPosterState(local,height,width,movable,items,mobile),state,'reverse uses identical card framing');
 const reduced=getOwnerPosterState(1000,height,width,movable,items,mobile,true);
 assert.equal(reduced.offset,0);assert.equal(reduced.clip,1);assert.ok(reduced.panels.every(p=>p.visible&&p.opacity===1&&p.x===0&&p.imageX===0));
}
const html=readFileSync(resolve(app,'dist/index.html'),'utf8');
assert.equal((html.match(/data-owner-poster/g)||[]).length,5,'three main scenes and two source-style graphic interludes');
assert.equal((html.match(/data-motive="true"/g)||[]).length,3,'only three grounded owner motives');
assert.ok(!html.includes('class="owner-motives"'),'old grid is replaced');
assert.ok(!html.includes('owner-research-note'),'selected visible research footer removed');
for(const name of ['puppy-v2','shared','history'])assert.ok(existsSync(resolve(app,`public/whoof/owners-v33/${name}.webp`)));
const posterImages=[...html.matchAll(/<img class="owner-poster-image" src="([^"]+)"/g)].map(match=>match[1]);
assert.equal(posterImages.length,5,'all five posters have images');
assert.equal(new Set(posterImages).size,5,'each poster uses an independent scene');
for(const path of posterImages)assert.ok(existsSync(resolve(app,'public'+path)),'poster asset exists: '+path);
console.log('Owner posters: source rail/parallax bounds, reverse, mobile last-card hold, static reading, five panels/three grounded motives and generated assets passed.');
