// Actual scene benchmark; interact through its native controls, never app internals.
import {mkdirSync,writeFileSync,symlinkSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..'),label=process.argv[2]||'current',root=resolve(repo,'../tmp/performance-v56'),out=resolve(root,label);
mkdirSync(out,{recursive:true});
for(const name of ['whoof','models','textures'])if(!existsSync(resolve(root,name)))symlinkSync(resolve(repo,'src/public',name),resolve(root,name),'dir');
const source=`
import {OpeningScene} from './src/src/engine/whoof/OpeningScene';
import {getAppSceneState,getAppScrollTime} from './src/src/engine/whoof/landing/app/AppMotion';
import {getTrustState} from './src/src/engine/whoof/landing/trust/TrustMotion';
const quality=document.querySelector('#quality');
const stage=document.querySelector('#stage'),output=document.querySelector('pre'),status=document.querySelector('#status'),select=document.querySelector('select');
let world;const results={label:${JSON.stringify(label)},cases:[]};
const quantile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor((a.length-1)*p))];
const stats=a=>({p50:+quantile(a,.5).toFixed(2),p95:+quantile(a,.95).toFixed(2),p99:+quantile(a,.99).toFixed(2),max:+Math.max(...a).toFixed(2)});
async function ready(){if(world)return;status.textContent='Loading original scene';const start=performance.now();world=new OpeningScene(stage);world.resize(innerWidth,innerHeight);await world.load(()=>{});world.renderer.info.autoReset=false;const gl=world.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');results.loadMs=+(performance.now()-start).toFixed(1);results.backend=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);results.gpuTimer=!!gl.getExtension('EXT_disjoint_timer_query_webgl2');}
async function prepare(mode){if(mode==='app')await world.prepareApp();if(mode==='trust')await world.prepareTrust();if(mode==='offer')await world.prepareOffer();if(mode==='ending')await world.prepareEnding();}
function draw(mode,i,fixed=false){const t=fixed?0:i/180,x=Math.sin(t*6.28)*.5,y=Math.cos(t*6.28)*.35,w=innerWidth,h=innerHeight;
 if(mode==='product')world.renderOpening(2.3+t*.5,x,y,false,6);
 if(mode==='app')world.renderApp(getAppSceneState(getAppScrollTime(6.4+t*.4)*h,h,w),x,y);
 if(mode==='trust')world.renderTrust(getTrustState((2.0+t*.4)*h,h,w),1.5+t*.4,x,y,false);
 if(mode==='offer')world.renderOffer(.8,x,y,1/60,false,false,x,y);
 if(mode==='ending')world.renderEnding(1/60,x,y,1,false,false,true);
}
async function run(fixed){const button=document.querySelector('#run'),pose=document.querySelector('#pose');button.disabled=pose.disabled=true;try{await ready();world.resize(innerWidth,innerHeight);const mode=select.value,start=performance.now();await prepare(mode);const prepareMs=performance.now()-start;
 if(fixed){draw(mode,0,true);status.textContent='Fixed pose: '+mode;return;}
 const frame=[],cpu=[],triangles=[],calls=[],gpu=[],queries=[];const gl=world.renderer.getContext(),timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');let previous;const collect=()=>{for(let j=queries.length-1;j>=0;j--){const q=queries[j];if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(timer.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);queries.splice(j,1);}}};for(let i=0;i<210;i++){const now=await new Promise(requestAnimationFrame);if(document.hidden)throw Error('Tab hidden: repeat visible benchmark');world.renderer.info.reset();const q=timer&&i>=30?gl.createQuery():null;if(q)gl.beginQuery(timer.TIME_ELAPSED_EXT,q);const before=performance.now();draw(mode,i);if(q){gl.endQuery(timer.TIME_ELAPSED_EXT);queries.push(q);}if(timer)collect();const cost=performance.now()-before;if(i>=30){frame.push(now-previous);cpu.push(cost);triangles.push(world.renderer.info.render.triangles);calls.push(world.renderer.info.render.calls);}previous=now;if(i%30===0)status.textContent=mode+' '+Math.max(0,i-30)+'/180';}
 if(timer){for(let wait=0;queries.length&&wait<60;wait++){await new Promise(requestAnimationFrame);collect();}for(const q of queries)gl.deleteQuery(q);}const item={mode,size:[innerWidth,innerHeight],pixels:[world.renderer.domElement.width,world.renderer.domElement.height],prepareMs:+prepareMs.toFixed(1),frameMs:stats(frame),cpuSubmitMs:stats(cpu),gpuMs:gpu.length?stats(gpu):null,gpuSamples:gpu.length,over25ms:frame.filter(v=>v>25).length,triangles:Math.max(...triangles),calls:Math.max(...calls)};results.cases.push(item);status.textContent='Finished '+mode;output.textContent=JSON.stringify(results,null,2);
 }catch(e){status.textContent='ERROR '+e.message;output.textContent=e.stack;}finally{button.disabled=pose.disabled=false;}}
document.querySelector('#dispose').addEventListener('click',async()=>{await ready();const late=Promise.all([world.prepareApp(),world.prepareTrust(),world.prepareOffer(),world.prepareEnding()]);world.dispose?.();await late;await Promise.resolve();await Promise.resolve();output.textContent=JSON.stringify({disposedMemory:world.renderer.info.memory});status.textContent='Disposed after pending preparation';});
quality.addEventListener('change',async()=>{await ready();world.setQuality?.(Number(quality.value));draw(select.value,0,true);status.textContent='Quality '+quality.value+'; pixels '+world.renderer.domElement.width+' × '+world.renderer.domElement.height;});
document.querySelector('#run').addEventListener('click',()=>run(false));document.querySelector('#pose').addEventListener('click',()=>run(true));
addEventListener('resize',()=>world?.resize(innerWidth,innerHeight));
`;
await build({stdin:{contents:source,resolveDir:repo,sourcefile:'performance-check.ts',loader:'ts'},bundle:true,platform:'browser',format:'esm',outfile:resolve(out,'check.js'),nodePaths:[resolve(repo,'src/node_modules')],logLevel:'silent'});
writeFileSync(resolve(out,'index.html'),`<!doctype html><html><meta charset="utf-8"><title>Whoof ${label} performance</title><style>html,body{margin:0;background:#111315;color:#f4f1eb;font:14px Arial}#stage{position:fixed;inset:0}canvas{display:block;width:100%;height:100%}header{position:fixed;z-index:5;top:10px;left:12px;background:#111315dd;padding:12px;max-width:360px}button,select{padding:8px;margin:4px}pre{font-size:11px;max-height:260px;overflow:auto;white-space:pre-wrap}header:focus-within{opacity:1}</style><div id="stage"></div><header><strong>Whoof ${label} — actual source</strong><div><select aria-label="Scene"><option value="product">Rotating collar</option><option value="app">App pair</option><option value="trust">Trust studio</option><option value="offer">Price effects</option><option value="ending">Food ending</option></select><select id="quality" aria-label="Render quality"><option value="2">High</option><option value="1">Balanced</option><option value="0">Low GPU budget</option></select></div><button id="run">Run 180 frames</button><button id="pose">Fixed pose</button><button id="dispose">Dispose during preparation</button><p id="status">Ready</p><pre></pre></header><script type="module" src="./check.js"></script></html>`);
console.log(out+' — serve parent on localhost:4342');
