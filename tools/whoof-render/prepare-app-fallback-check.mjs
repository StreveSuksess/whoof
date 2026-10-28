// Browser regression using the actual App controller and GSAP, outside served assets.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const repo=resolve(import.meta.dirname,'../..'),out=resolve(repo,'../tmp/app-fix-v53/fixture');mkdirSync(out,{recursive:true});
const source=`
import {AppExample} from './src/src/engine/whoof/landing/AppExample';
// Scope the media-query stub to this isolated test, without changing OS settings.
const nativeMatchMedia=window.matchMedia.bind(window);let reduce=false;
window.matchMedia=query=>query==='(prefers-reduced-motion: reduce)'?{matches:reduce}:nativeMatchMedia(query);
const root=document.querySelector('#app'),titles=[...root.querySelectorAll('[data-app-caption] h3')],native=titles.map(e=>e.innerHTML),next=document.querySelector('#how-title'),nativeNext=next.innerHTML;
let app=new AppExample(root);const resize=()=>{app.resize();app.render(root.getBoundingClientRect().top+scrollY+innerHeight*4.3,false);};
const checks=[],check=(name,ok,details)=>{checks.push({name,ok,details});if(!ok)throw Error(name);};
const nativeReading=()=>{titles.forEach((el,i)=>{check('native heading '+i,el.innerHTML===native[i],el.innerHTML);check('bounded heading '+i,el.getBoundingClientRect().height<180,el.getBoundingClientRect().height);});check('native next heading',next.innerHTML===nativeNext,next.innerHTML);};
document.querySelector('#run').addEventListener('click',()=>{checks.length=0;try{
 resize();check('animated line masks exist',titles.every(el=>el.querySelector('div')),titles.map(el=>el.childElementCount));
 reduce=true;resize();nativeReading();reduce=false;resize();check('same instance resumes animation after reduced mode',titles.every(el=>el.querySelector('div')),titles.map(el=>el.childElementCount));
 app.useFallback();resize();nativeReading();resize();nativeReading();
 app.dispose();check('dispose restores native markup',titles.every((el,i)=>el.innerHTML===native[i]),titles.map(el=>el.innerHTML));
 app=new AppExample(root);resize();check('remount restores animated masks',titles.every(el=>el.querySelector('div')),titles.map(el=>el.childElementCount));
 app.useFallback();resize();nativeReading();document.querySelector('h1').textContent='PASS — fallback, resize, dispose and remount';document.body.dataset.result='pass';
}catch(error){document.querySelector('h1').textContent='FAIL — '+error.message;document.body.dataset.result='fail';}
document.querySelector('pre').textContent=JSON.stringify(checks,null,2);});
`;
await build({stdin:{contents:source,resolveDir:repo,sourcefile:'app-fallback-check.ts',loader:'ts'},bundle:true,platform:'browser',format:'esm',outfile:resolve(out,'check.js'),nodePaths:[resolve(repo,'src/node_modules')],logLevel:'silent'});
const markup=readFileSync(resolve(repo,'src/src/components/whoof/landing/AppExample.astro'),'utf8').replaceAll('src="/whoof/','src="http://localhost:4321/whoof/').replaceAll('poster="/whoof/','poster="http://localhost:4321/whoof/');
const css=readFileSync(resolve(repo,'src/src/styles/whoof-app-scene.css'),'utf8');
writeFileSync(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>App fallback regression</title><style>body{margin:0;background:#111315;color:#eee;font:16px Arial;--section-pad:34px}header{padding:25px}h1{font-size:24px}pre{white-space:pre-wrap;max-height:160px;overflow:auto}#run{padding:14px}section{position:relative}${css}</style><header><h1>App fallback regression</h1><button id="run">Run regression</button><pre></pre></header>${markup}<section class="how-it-works"><div class="connection-intro"><div class="connection-title-stage" data-app-next-title><h2 id="how-title">От трекера —<br/>к приложению.</h2></div></div></section><script type="module" src="/check.js"></script>`);
console.log(out+'\nServe on localhost:4341 and run the native regression button.');
