import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..'),out=resolve(repo,'../tmp/performance-v56/hero');mkdirSync(out,{recursive:true});
const source=`
import {HeroPlate} from './src/src/engine/whoof/HeroPlate';
import {PoseFrameCache} from './src/src/engine/whoof/PoseFrameCache';
const output=document.querySelector('pre'),status=document.querySelector('#status');const plate=new HeroPlate(),clamp=n=>Math.max(0,Math.min(64,n));
const meta=await fetch('/whoof/hero-v24/landscape.json').then(r=>r.json());
await plate.resize();plate.render(0,0,0,0,false,false,false);status.textContent='Ready';
document.querySelector('#run').addEventListener('click',async()=>{
 const button=document.querySelector('#run');button.disabled=true;const results={};let peak=0,active=0,concurrency=0,closed=0;const seen=new Set();
 const cache=new PoseFrameCache(async key=>{active++;concurrency=Math.max(concurrency,active);try{const bitmap=await createImageBitmap(await (await fetch(key)).blob());seen.add(key);return {width:bitmap.width,height:bitmap.height,close(){closed++;bitmap.close();}};}finally{active--;}});
 try{
  const frames=Object.values(meta.motion).map(a=>a.frames.map(f=>'/whoof/hero-v24/'+f)),neutral=frames.map(f=>f[32]);
  for(let i=0;i<65;i++){
   const pins=[...neutral,...frames.flatMap(f=>[f[i],f[clamp(i+1)]])],keys=[...pins,...Array.from({length:9},(_,k)=>frames.map(f=>f[clamp(i+k-4)])).flat()];
   cache.request(keys,pins);await cache.settled();peak=Math.max(peak,cache.bytes);if(cache.bytes>64*1024*1024)throw Error('Decoded budget exceeded');if(!pins.every(key=>cache.get(key)))throw Error('Interpolation pair evicted');
  }
  results.fullPoseSweep={uniqueSourceFrames:seen.size,peakMiB:peak/1024**2,maxDecodes:concurrency};
  cache.request(neutral,neutral);cache.setPaused(true);await cache.settled();results.offscreenMiB=cache.bytes/1024**2;cache.dispose();results.disposedBytes=cache.bytes;results.closedBitmaps=closed;
  const poses={keys:new Set(),leash:new Set(),ball:new Set()};let previous;const times=[];
  for(let i=0;i<480;i++){
   const now=await new Promise(requestAnimationFrame),dt=previous?Math.min(.05,(now-previous)/1000):1/120;previous=now;const name=['keys','leash','ball'][Math.floor(i/160)],bounds=meta.layers[name],asset=meta.motion[name],scale=Math.max(innerWidth/meta.width,innerHeight/meta.height),w=meta.width*scale,h=meta.height*scale;
   const contact=asset.contacts?.reduce((best,c)=>Math.hypot(c.positive[1][0]-c.negative[1][0],c.positive[1][1]-c.negative[1][1])>Math.hypot(best.positive[1][0]-best.negative[1][0],best.positive[1][1]-best.negative[1][1])?c:best);const start=contact?contact.rest[1]:[bounds.x,bounds.y];
   const x=start[0]*w+(innerWidth-w)/2+Math.sin(i*.14)*(name==='leash'?9:32),y=start[1]*h+(innerHeight-h)/2+Math.cos(i*.14)*(name==='leash'?9:28),before=performance.now();
   plate.render(0,x/innerWidth*2-1,y/innerHeight*2-1,dt,false,false,true);times.push(performance.now()-before);peak=Math.max(peak,plate.decodedBytes);
   document.querySelectorAll('canvas').forEach(c=>{if(c.dataset.pose)poses[c.dataset.prop].add(c.dataset.pose);});
  }
  results.contactReplay={distinctPoses:Object.fromEntries(Object.entries(poses).map(([k,v])=>[k,v.size])),peakMiB:peak/1024**2,cpuP95:times.sort((a,b)=>a-b)[Math.floor(times.length*.95)]};
  plate.render(2,0,0,0,false,false,false);results.heroOffscreenMiB=plate.decodedBytes/1024**2;plate.dispose();results.heroDisposedBytes=plate.decodedBytes;
  if(Object.values(poses).some(p=>p.size<5))throw Error('Contact replay did not move every prop');
  if(concurrency>2||seen.size!==195||results.disposedBytes||results.heroDisposedBytes)throw Error('Lifetime/concurrency/source coverage regression');
  status.textContent='PASS — full pose sweep, contact replay, offscreen and disposal';
 }catch(error){status.textContent='FAIL — '+error.message;}finally{cache.dispose();button.disabled=false;output.textContent=JSON.stringify(results,null,2);}
});
`;
await build({stdin:{contents:source,resolveDir:repo,sourcefile:'hero-cache-check.ts',loader:'ts'},bundle:true,platform:'browser',format:'esm',outfile:resolve(out,'check.js'),nodePaths:[resolve(repo,'src/node_modules')],logLevel:'silent'});
writeFileSync(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>Hero cache regression</title><style>body{margin:0;background:#111;color:#eee;font:14px Arial}#hero-plate{position:fixed;inset:0;overflow:hidden}.hero-plate-image{position:absolute;width:100%;height:100%;object-fit:cover}.hero-prop-pose{position:absolute}header{position:fixed;z-index:10;background:#111e;padding:20px;max-width:350px}pre{white-space:pre-wrap}button{padding:12px}</style><div id="hero-plate"><div class="hero-beauty"></div></div><header><h1>Hero memory / contact check</h1><button id="run">Run regression</button><p id="status">Loading</p><pre></pre></header><script type="module" src="./check.js"></script>`);
console.log(out);
