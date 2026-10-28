// Actual source animations/camera/product evaluator; inspect results through CUA.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..'),out=resolve(repo,'../tmp/product-passage-v54/fixture');mkdirSync(out,{recursive:true});
const source=`
import {OpeningScene} from './src/src/engine/whoof/OpeningScene';
import {getTrustState,TRUST_SCROLL_UNITS} from './src/src/engine/whoof/landing/trust/TrustMotion';
import {Vector3,Quaternion,Box3} from 'three';
const results=[],check=(name,ok,details)=>{results.push({name,ok,details});if(!ok)throw Error(name+': '+JSON.stringify(details));};
const button=document.querySelector('button');button.addEventListener('click',async()=>{button.disabled=true;const world=new OpeningScene(document.querySelector('#stage'));try{
 world.resize(800,600);await world.load(()=>{});await world.prepareTrust();
 const box=new Box3().setFromObject(world.model),center=box.getCenter(new Vector3()),corners=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new Vector3(x,y,z));
 const pose=()=>({p:world.product.position.toArray(),q:world.product.quaternion.toArray(),s:world.product.scale.toArray(),cp:world.camera.position.toArray(),cq:world.camera.quaternion.toArray(),fov:world.camera.fov,view:{...world.camera.view}});
 const projected=()=>{world.product.updateMatrixWorld(true);world.camera.updateMatrixWorld(true);const points=corners.map(p=>p.clone().applyMatrix4(world.product.matrixWorld).project(world.camera));const c=center.clone().applyMatrix4(world.product.matrixWorld).project(world.camera);return [c.x,c.y,Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))];};
 for(const [w,h] of [[1440,900],[761,1194],[390,844],[844,390]]){
  world.resize(w,h);const state=t=>getTrustState((TRUST_SCROLL_UNITS+t)*h,h,w),virtual=t=>t+.64;
  world.renderTrust(state(-.45),virtual(-.45),0,0,false);const start=pose();world.applyProductPassagePose(state(-.45),virtual(-.45),-.45*h,0,0);check('exact outgoing pose '+w,JSON.stringify(start)===JSON.stringify(pose()),start);
  world.renderOffer(.45,0,0,0,false,true);const end=pose();world.applyProductPassagePose(state(.45),virtual(.45),.45*h,0,0);check('exact incoming pose '+w,JSON.stringify(end)===JSON.stringify(pose()),end);
  let last,previousQ,maxProjectionStep=0,maxRotationStep=0;const frames=[];
  for(let n=-460;n<=460;n++){
   const t=n/1000;world.applyProductPassagePose(state(t),virtual(t),t*h,0,0);const projection=projected(),q=world.product.quaternion.clone();
   checkFinite(projection);if(last){maxProjectionStep=Math.max(maxProjectionStep,...projection.map((v,i)=>Math.abs(v-last[i])));maxRotationStep=Math.max(maxRotationStep,q.angleTo(previousQ));}
   last=projection;previousQ=q;frames.push([t,projection]);
  }
  check('continuous projection '+w,maxProjectionStep<.035,{maxProjectionStep});check('continuous rotation '+w,maxRotationStep<.035,{maxRotationStep});
  for(const [t,p] of frames.reverse()){world.applyProductPassagePose(state(t),virtual(t),t*h,0,0);const back=projected();if(!back.every((v,i)=>Math.abs(v-p[i])<1e-10))throw Error('reverse pose '+w);}
  check('exact reverse '+w,true,frames.length);
  world.applyProductPassagePose(state(1.5),virtual(1.5),1.5*h,0,0);const held=projected();world.applyProductPassagePose(state(1.5),virtual(1.5),1.5*h,0,0,false,.3*h);const exiting=projected();check('product follows sticky exit '+w,Math.abs(exiting[1]-held[1]-.6)<1e-8,{before:held[1],after:exiting[1]});
 }
 document.querySelector('h1').textContent='PASS — real Trust/Offer pose continuity';document.body.dataset.result='pass';
}catch(error){document.querySelector('h1').textContent='FAIL — '+error.message;document.body.dataset.result='fail';}finally{document.querySelector('pre').textContent=JSON.stringify(results,null,2);world.disposeTrust();world.renderer.dispose();button.disabled=false;}});
function checkFinite(values){if(!values.every(Number.isFinite))throw Error('non-finite projection');}
`;
await build({stdin:{contents:source,resolveDir:repo,sourcefile:'product-passage-check.ts',loader:'ts'},bundle:true,platform:'browser',format:'esm',outfile:resolve(out,'check.js'),nodePaths:[resolve(repo,'src/node_modules')],logLevel:'silent'});
writeFileSync(resolve(out,'index.html'),'<!doctype html><meta charset="utf-8"><base href="http://localhost:4321/"><title>Real product passage regression</title><style>body{background:#101214;color:#eee;font:16px monospace;padding:28px}h1{font:24px Arial}button{padding:14px}pre{white-space:pre-wrap}#stage{position:fixed;inset:0;z-index:-1;opacity:.02;pointer-events:none}</style><h1>Real product passage regression</h1><button>Run real pose checks</button><pre></pre><div id="stage"></div><script type="module" src="http://localhost:4342/check.js"></script>');
console.log(out+'\nServe on localhost:4342; press Run real pose checks with CUA.');
