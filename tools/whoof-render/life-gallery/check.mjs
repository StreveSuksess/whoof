import assert from 'node:assert/strict';
import { build } from '../../../src/node_modules/esbuild/lib/main.js';
const load=async name=>{
 const {outputFiles}=await build({entryPoints:[new URL(`../../../src/src/engine/whoof/life/${name}.ts`,import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node'});
 return import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
};
const {getGalleryState,cardStops}=await load('GalleryMotion');
const {lifeScenes}=await load('LifeScenes');
assert.equal(lifeScenes.length,7,'seven distinct authored scenes');
assert.equal(new Set(lifeScenes.map(s=>s.media)).size,7,'no repeated footage URL');
assert.equal(cardStops.length,lifeScenes.length);
let previousIndex=0; const reached=new Set();
for(let t=-2;t<cardStops.at(-1)+3;t+=.013){
 const state=getGalleryState(t);
 assert.ok(state.index>=0&&state.index<=lifeScenes.length-1);
 assert.ok(state.cover>=0&&state.cover<=1);
 for(const key of ['titleSlide','titleShrink','pulse','glow','galleryReveal'])assert.ok(state[key]>=0&&state[key]<=1,key+' is bounded');
 assert.ok(Number.isInteger(state.active));
 assert.ok(state.index>=previousIndex,'forward scroll must not reverse');
 previousIndex=state.index; reached.add(state.active);
 assert.deepEqual(state,getGalleryState(t),'reversing scroll has no state drift');
 assert.ok(Number.isInteger(getGalleryState(t,true).index),'reduced motion has no lateral travel');
}
assert.equal(reached.size,lifeScenes.length,'all seven cards reachable');
cardStops.forEach((stop,index)=>{
 assert.equal(getGalleryState(stop).index,index);
 assert.equal(getGalleryState(stop+.2).index,index,'reading hold before transition');
});
assert.equal(getGalleryState(1000).active,6,'end holds the final card, not an empty frame');
assert.equal(getGalleryState(1000,true).active,6);
assert.equal(getGalleryState(-1000).active,0);
assert.equal(getGalleryState(.75).galleryReveal,0,'the title gets a separate entrance before the gallery');
assert.equal(getGalleryState(cardStops[0]).titleShrink,1,'first card stop has completed title handoff');
assert.equal(getGalleryState(cardStops[0]).galleryReveal,1,'first video is fully open at its stop');
assert.equal(getGalleryState(.5,true).glow,0,'reduced motion skips the luminous pulse');
assert.equal(getGalleryState(-1).cover,0);assert.equal(getGalleryState(0).cover,1);
assert.ok(Number.isFinite(getGalleryState(NaN).index));
const {GalleryVideo}=await load('GalleryVideo');
let resolvePlay, rejectPlay, calls=0;
const fake={muted:false,controls:true,paused:true,src:'',dataset:{src:'clip.mp4'},getAttribute(){return this.src},load(){},pause(){this.paused=true},play(){calls++;return new Promise((r,j)=>{resolvePlay=()=>{this.paused=false;r()};rejectPlay=j})}};
const media=new GalleryVideo(fake);
media.setPlaying(true);media.setPlaying(true);assert.equal(calls,1,'only one play request pending');
media.setPlaying(false);resolvePlay();await new Promise(r=>setTimeout(r,0));assert.equal(fake.paused,true,'late resolution cannot play hidden media');
media.setPlaying(true);rejectPlay(new Error('autoplay'));await new Promise(r=>setTimeout(r,0));
media.setPlaying(true);assert.equal(calls,2,'do not spam rejected autoplay');
media.retry();media.setPlaying(true);assert.equal(calls,3,'explicit user gesture can retry');
media.dispose();resolvePlay();await new Promise(r=>setTimeout(r,0));assert.equal(fake.paused,true,'disposed media stays paused');
console.log('Gallery: bounded/reversible scroll, held stops, reduced motion, pending-play cancellation and autoplay retry passed.');
