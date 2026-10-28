import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const app=resolve(import.meta.dirname,'../../src');
const {outputFiles}=await build({entryPoints:[resolve(app,'src/engine/whoof/landing/how/HowMotion.ts')],bundle:true,write:false,format:'esm',platform:'node'});
const {getHowState,howStops,HOW_SCROLL_UNITS}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
assert.equal(howStops.length,4);assert.equal(getHowState(-3).index,0);
for(const [index,stop] of howStops.entries())assert.equal(getHowState(stop).index,index,'each scene has an exact readable hold');
assert.equal(getHowState(20).index,3);assert.ok(HOW_SCROLL_UNITS-howStops.at(-1)>1.2,'last explanation has a hold before native exit');
let previous=getHowState(-2);
for(let step=1;step<=9000;step++){
 const t=-2+step/1000,s=getHowState(t);
 for(const key of ['titleSlide','titleShrink','reveal','glow','pulse'])assert.ok(Number.isFinite(s[key])&&s[key]>=0&&s[key]<=1,key);
 assert.ok(s.index>=previous.index&&s.index-previous.index<.004,'transport remains continuous and monotonic');
 assert.deepEqual(s,getHowState(t),'scroll state has no directional hysteresis');
 previous=s;
}
assert.deepEqual(getHowState(NaN),getHowState(-2));
const markup=readFileSync(resolve(app,'dist/index.html'),'utf8');
const how=markup.slice(markup.indexOf('id="how"'),markup.indexOf('data-block="6"'));
assert.equal((how.match(/data-how-scene=/g)||[]).length,4);
assert.equal((markup.match(/id="how-title"/g)||[]).length,1,'v44 next heading keeps a single owner');
assert.ok(how.includes('connection-intro')&&how.includes('data-app-next-title'));
for(const term of ['Bluetooth','интернет на телефоне','после синхронизации','время последнего обновления','2–6 недель'])assert.ok(how.includes(term),term);
assert.ok(!how.includes('flow-number')&&!how.includes('<video'),'no numbered prose grid or fake photo videos');
const names=[...how.matchAll(/data-how-scene="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(names).size,4);
for(const name of names){const p=resolve(app,`public/whoof/how-v45/${name}.webp`),n=statSync(p).size;assert.ok(n>20000&&n<500000,`${name} asset encoding budget: ${n}`);}
const css=readFileSync(resolve(app,'src/styles/whoof-how.css'),'utf8');
assert.ok(css.includes('position:sticky')&&!css.includes('position:fixed'),'natural entry/exit boundaries');
assert.ok(css.includes('.has-how-story:not(.how-static)'),'native illustrated reading before enhancement and in reduced motion');
const runtime=readFileSync(resolve(app,'src/engine/whoof/landing/how/HowStory.ts'),'utf8');
assert.ok(runtime.includes('this.frame.inert=false')&&runtime.includes('dispose()')&&runtime.includes('ArrowLeft'));
console.log('How: four distinct assets, clear product constraints, native/reduced reading, one heading, 9000 reversible motion samples and natural section boundaries passed.');
