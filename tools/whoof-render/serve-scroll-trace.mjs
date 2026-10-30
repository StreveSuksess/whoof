// Real production landing with diagnostic controls only on localhost4341.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const repo=resolve(import.meta.dirname,'../..'),dist=resolve(repo,'src/dist'),baseline=resolve(repo,'../tmp/mobile-v60/baseline');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2','.mp4':'video/mp4'};
const trace=`<script>
(()=>{
 const nativeRAF=requestAnimationFrame.bind(window),frames=new Map();let running=false,mutations=0,longTasks=[],slowGL=[],slowScene=[],steps=[];
 const stats=a=>{a=[...a].sort((a,b)=>a-b);return {p50:+(a[Math.floor((a.length-1)*.5)]||0).toFixed(3),p95:+(a[Math.floor((a.length-1)*.95)]||0).toFixed(3),max:+(a.at(-1)||0).toFixed(3)};};
 addEventListener('whoof-trace-render',e=>{if(running&&slowScene.length<100)slowScene.push(e.detail);});
 for(const name of ['drawElementsInstanced','drawElements','getShaderParameter','getActiveUniform','getUniformLocation','texImage3D','checkFramebufferStatus','texImage2D','generateMipmap','compileShader','linkProgram','getProgramParameter','bufferData']){const proto=WebGL2RenderingContext.prototype,original=proto[name];proto[name]=function(...args){const start=performance.now();const result=original.apply(this,args),ms=performance.now()-start;if(running&&ms>.5)slowGL.push({name,ms:+ms.toFixed(2)});return result;};}
 window.requestAnimationFrame=cb=>nativeRAF(t=>{const before=performance.now();cb(t);if(running)frames.set(t,(frames.get(t)||0)+performance.now()-before);});
 try{new PerformanceObserver(list=>{if(running)longTasks.push(...list.getEntries().map(e=>+e.duration.toFixed(2)));}).observe({type:'longtask',buffered:false});}catch{}
 addEventListener('DOMContentLoaded',()=>{
  const panel=document.createElement('aside');panel.id='scroll-trace';panel.innerHTML='<button disabled>Run mobile scroll trace</button><p>Waiting for entry</p><pre></pre>';
  Object.assign(panel.style,{position:'fixed',zIndex:2000,left:'6px',top:'6px',maxWidth:'min(330px,95vw)',padding:'8px',background:'#101214ed',color:'#eee',font:'11px monospace'});panel.querySelector('pre').style.cssText='max-height:270px;overflow:auto;white-space:pre-wrap';document.body.append(panel);
  const button=panel.querySelector('button'),status=panel.querySelector('p'),output=panel.querySelector('pre');
  const observe=new MutationObserver(records=>{if(running)mutations+=records.length;});observe.observe(document.querySelector('.landing-v27'),{subtree:true,attributes:true,attributeFilter:['style']});
  function waitReady(){if(document.querySelector('[data-entry-loader]')?.hidden){button.disabled=false;status.textContent='Ready';}else nativeRAF(waitReady);}nativeRAF(waitReady);
  button.addEventListener('click',async()=>{
   button.disabled=true;output.textContent='';steps=[];const h=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scene-vh'))*100||innerHeight;
   const top=id=>document.getElementById(id).getBoundingClientRect().top+scrollY;
   for(const [name,from,to,duration] of [['opening',h*.03,h*1.1,1400],['app',top('app')+h*4.65,top('app')+h*5.8,1400],['price',top('order')-h*.65,top('order')+h*1.8,2000]]){
    window.scrollTo({top:from,behavior:'instant'});await new Promise(nativeRAF);await new Promise(nativeRAF);frames.clear();mutations=0;longTasks=[];slowGL=[];slowScene=[];running=true;const start=performance.now();status.textContent='Tracing '+name;let previous,intervals=[];
    while(performance.now()-start<duration){const t=await new Promise(nativeRAF);if(previous)intervals.push(t-previous);previous=t;window.scrollTo({top:from+(to-from)*Math.min(1,(performance.now()-start)/duration),behavior:'instant'});}
    running=false;steps.push({name,frameMs:stats(intervals),callbackMs:stats([...frames.values()]),styleMutations:mutations,styleMutationsPerFrame:+(mutations/Math.max(1,frames.size)).toFixed(1),longTasks,slowGL,slowScene,scroll:scrollY});
   }
   status.textContent='Complete';output.textContent=JSON.stringify({label:location.pathname.includes('baseline')?'v59':'current',size:[innerWidth,innerHeight],steps},null,2);button.disabled=false;
  });
 });
})();</script>`;
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost:4341'),parts=decodeURIComponent(url.pathname).split('/').filter(Boolean),mode=['baseline','current'].includes(parts[0])?parts.shift():'current',relative=parts.length?parts.join('/'):'index.html';
  const root=mode==='baseline'&&(relative==='index.html'||relative.startsWith('_astro/'))?baseline:dist,file=resolve(root,relative);if(!file.startsWith(root+sep)||!((await stat(file)).isFile()))throw Error('Not found');
  let body=await readFile(file);if(/(?:OpeningScene|OfferSketches).*\.js$/.test(relative)){
    const code=body.toString(),kind=relative.includes('OpeningScene')?'OpeningScene':'OfferSketches',name=code.match(new RegExp(kind+':([\\w$]+)'))?.[1],methods=kind==='OpeningScene'?['drawProduct','applyProductPassagePose','renderProductPassage','renderApp','renderOpening','resize','prepareOffer','prepareTrust']:['update','render','resize','resizePost'];
    if(name)body=Buffer.from(code+`;for(const key of ${JSON.stringify(methods)}){const original=${name}.prototype[key];${name}.prototype[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{const ms=performance.now()-start;if(ms>2)dispatchEvent(new CustomEvent('whoof-trace-render',{detail:{key:'${kind}.'+key,ms:+ms.toFixed(2)}}));}};}`);
  }
  if(relative==='index.html')body=Buffer.from(body.toString().replaceAll('/_astro/','/'+mode+'/_astro/').replace('<head>','<head>'+trace));
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4341,'127.0.0.1',()=>console.log('Native full-landing scroll trace: http://localhost:4341/{baseline,current}/'));
