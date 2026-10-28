import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const app=resolve(import.meta.dirname,'../../src');
const {outputFiles}=await build({entryPoints:[resolve(app,'src/engine/whoof/landing/trust/TrustMotion.ts')],bundle:true,write:false,format:'esm',platform:'node'});
const {getTrustState,getTrustClip,getTrustTextClip,TRUST_SCROLL_UNITS}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
for(const [width,height] of [[1440,900],[1020,1194],[390,844],[844,390]]){
 const end=TRUST_SCROLL_UNITS;let last=getTrustState(-height,height,width);
 for(let step=-999;step<=Math.ceil((end+3.5)*1000);step++){
  const t=step/1000,s=getTrustState(t*height,height,width);
  for(const v of [s.x,s.y,s.diameter,s.pitch,s.yaw,s.bank,s.spin,s.wearBlend,...s.episodes])assert.ok(Number.isFinite(v));
  for(const weight of [s.wearBlend,...s.episodes])assert.ok(weight>=0&&weight<=1);
  assert.ok(Math.abs(s.spin-last.spin)<.02,'no rotation jumps');
  assert.ok(Math.abs(s.x-last.x)<width*.004&&Math.abs(s.diameter-last.diameter)<width*.004,'continuous framing');
  assert.deepEqual(s,getTrustState(t*height,height,width),'pure/reversible');last=s;
 }
 assert.equal(getTrustState(end*height,height,width).wearBlend,1,'exact source wearing pose at handoff');
 const a=getTrustState((end-.001)*height,height,width),b=getTrustState(end*height,height,width);
 assert.ok((b.wearBlend-a.wearBlend)/.001<.01,'zero blend velocity at source handoff');
 assert.equal(getTrustState((end+2)*height,height,width).wearBlend,1);
}
assert.equal(getTrustTextClip(-900,900,100),0);
assert.equal(getTrustTextClip(0,900,100),100);
assert.ok(getTrustTextClip(3.8*900,900,100)>450);
assert.equal(getTrustTextClip(TRUST_SCROLL_UNITS*900,900,100),900);
assert.deepEqual(getTrustClip(1000,5000,0,900),{top:900,bottom:0});
assert.deepEqual(getTrustClip(1000,5000,800,900),{top:200,bottom:0});
assert.deepEqual(getTrustClip(1000,5000,6100,900),{top:0,bottom:100});
assert.deepEqual(getTrustClip(1000,5000,7000,900),{top:0,bottom:900});
if(process.argv.includes('--built')){
 const html=readFileSync(resolve(app,'dist/index.html'),'utf8');
 const trust=html.slice(html.indexOf('id="trust"'),html.indexOf('id="wearing"'));
 assert.equal((trust.match(/data-trust-episode=/g)||[]).length,3);
 for(const term of ['План проверки','Результаты проверки точности ещё не опубликованы','Консультации специалистов','ООО «ВУФ»'])assert.ok(trust.includes(term),term);
 assert.ok(!trust.includes('<video')&&!trust.includes('accuracy'),'no unrelated marketing film presented as validation');
 assert.ok(html.includes('id="how-steps"')&&(html.match(/class="life-card"/g)||[]).length===7);
 const ui=readFileSync(resolve(app,'src/engine/whoof/landing/trust/TrustStage.ts'),'utf8');
 assert.ok(ui.includes('getTrustClip')&&ui.includes('dispose()')&&ui.includes('useFallback()'));
}
console.log('Trust sequence: responsive continuous/reversible poses, zero-velocity source handoff, actual clip boundaries and factual content passed.');
