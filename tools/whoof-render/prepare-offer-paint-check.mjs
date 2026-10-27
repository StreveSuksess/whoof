// Build a standalone GPU regression page; open the printed local URL with CUA.
// Exercises the actual runtime paint shaders/buffers on a premultiplied renderer.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..');
const out=resolve(repo,'../tmp/offer-direction-v39/gpu');mkdirSync(out,{recursive:true});
const source=`
import {Color,WebGLRenderer,WebGLRenderTarget} from 'three';
import {OfferSketches} from './src/src/engine/whoof/landing/OfferSketches';
const results=[];const check=(name,ok,details)=>{results.push({name,ok,details});if(!ok)throw Error(name+': '+JSON.stringify(details));};
const renderer=new WebGLRenderer({alpha:true,antialias:false});renderer.setSize(800,800);renderer.setClearColor(0,0);renderer.autoClear=true;
const field=new OfferSketches(renderer);field.resize(800,800);field.ready=true;
const read=target=>{const pixels=new Uint8Array(target.width*target.height*4);renderer.readRenderTargetPixels(target,0,0,target.width,target.height,pixels);return pixels;};
const weights=()=>{const p=read(field.current);let energy=0,vx=0,vy=0,cx=0,cy=0;for(let i=0;i<p.length;i+=4){const w=p[i+2]+p[i+3];energy+=w;vx+=(p[i]-128)*w;vy+=(p[i+1]-128)*w;const point=i/4;cx+=(point%field.current.width)*w;cy+=Math.floor(point/field.current.width)*w;}return {energy,vx,vy,cx:cx/(energy||1),cy:cy/(energy||1)};};
try{
 const legacy=new WebGLRenderTarget(8,8);renderer.setClearColor(new Color(.5,.5,0),0);renderer.setRenderTarget(legacy);renderer.clear();const old=read(legacy);check('reproduces transparent-clear bug',old[0]===0&&old[1]===0,[...old.slice(0,4)]);legacy.dispose();renderer.setRenderTarget(null);renderer.setClearColor(0,0);
 const reset=()=>{field.resize(800,800);for(const target of [field.current,field.previous,field.low]){const pixels=read(target);check('neutral reset '+target.width+'x'+target.height,pixels.every((v,i)=>v===[128,128,0,0][i%4]),[...pixels.slice(0,4)]);}check('CPU velocity reset',field.velocity.length()===0,field.velocity.toArray());};
 reset();for(let n=0;n<120;n++)field.update(1/60,0,0,1,false,false,0,0);check('stationary field has no light or drift',weights().energy===0&&read(field.current).every((v,i)=>v===[128,128,0,0][i%4]),weights());
 for(const [name,dx,dy] of [['right',1,0],['left',-1,0],['down',0,1],['up',0,-1],['down-right',1,1],['up-left',-1,-1],['up-right',1,-1],['down-left',-1,1]]){
  reset();const length=Math.hypot(dx,dy),x=dx/length,y=dy/length;
  field.update(1/60,-x*.3,-y*.3,1,false,false,-x*.3,-y*.3);
  for(let i=1;i<=24;i++){const k=-.3+.6*i/24;field.update(1/60,x*k,y*k,1,false,false,x*k,y*k);}
  const m=weights(),along=m.vx*x-m.vy*y,cross=Math.abs(m.vx*y+m.vy*x);
  check('signed velocity '+name,m.energy>0&&along>0&&cross<along*.3,m);
  // Stroke centroid follows the same direction; CSS y is inverted in the field.
  check('stroke position '+name,(m.cx-99.5)*x-(m.cy-99.5)*y>0,m);
  const energy=m.energy;for(let i=0;i<180;i++)field.update(1/60,x*.3,y*.3,1,false,false,x*.3,y*.3);
  check('light decays '+name,weights().energy<energy*.05,{before:energy,after:weights().energy});
 }
 reset();field.update(1/60,0,0,1,false,false,0,0);field.update(1/60,.8,-.8,1,true,false,.8,-.8);check('reduced motion does not paint',weights().energy===0,weights());
 document.querySelector('h1').textContent='PASS — paint reset and eight directions';
}catch(error){document.querySelector('h1').textContent='FAIL — '+error.message;}
const output=JSON.stringify(results,null,2);document.querySelector('pre').textContent=output;document.body.dataset.result=results.length&&results.every(r=>r.ok)?'pass':'fail';renderer.dispose();
`;
await build({stdin:{contents:source,resolveDir:repo,sourcefile:'paint-gpu-check.ts',loader:'ts'},bundle:true,platform:'browser',format:'esm',outfile:resolve(out,'check.js'),nodePaths:[resolve(repo,'src/node_modules')],logLevel:'silent'});
writeFileSync(resolve(out,'index.html'),'<!doctype html><meta charset="utf-8"><title>Whoof paint GPU regression</title><style>body{background:#101214;color:#eee;font:16px monospace;padding:30px}pre{white-space:pre-wrap}h1{font:24px sans-serif}</style><h1>Running GPU regression…</h1><pre></pre><script type="module" src="/check.js"></script>');
console.log(out+'\nServe this directory on localhost:4340, then open it with CUA.');
