import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const base=resolve(import.meta.dirname,'../../src/src/engine/whoof');
const {outputFiles}=await build({stdin:{contents:`export {getStoryState,getStoryFraming} from '${base}/landing/StoryMotion.ts';export {collarContact} from '${base}/OpeningTransition.ts';`,resolveDir:base,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {getStoryState,getStoryFraming,collarContact}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
assert.equal(getStoryState(0).lift,0);
assert.equal(getStoryState(.32).lift,0,'table pose retained until release');
assert.equal(getStoryState(.86).lift,1,'final pose reached before full section');
assert.equal(getStoryState(1).lift,1);
assert.equal(getStoryState(1).exit,0);
assert.equal(getStoryState(1.5).exit,.5,'model follows section out, never stays over later copy');
assert.equal(getStoryState(.58).title,0,'story title does not cross the exiting hero card');
assert.equal(getStoryState(.92).title,1);
assert.equal(getStoryState(.5).description,0);
assert.equal(getStoryState(1).description,1);
let previous=getStoryState(0);
const forward=[];
for(let i=0;i<=2000;i++){
 const s=i/1000,state=getStoryState(s);forward.push(state);
 for(const key of ['lift','atmosphere','title','description'])assert.ok(state[key]>=0&&state[key]<=1&&state[key]>=previous[key]);
 assert.ok(Math.abs(state.lift-previous.lift)<.006,'no pose jump');
 if(state.lift>=.06)assert.equal(collarContact(s),0,'no grounded shadow on a flying collar');
 previous=state;
}
for(let i=2000;i>=0;i--)assert.deepEqual(getStoryState(i/1000),forward[i],'reverse is deterministic');
for(const [w,h] of [[1060,1194],[1296,1194],[1440,900],[1920,1080]]){
 const {diameter,centerX}=getStoryFraming(w,h);
 assert.ok(centerX+diameter/2<=w*.687-17,'product does not collide with the right text column');
 assert.ok(centerX-diameter/2>=w*.03,'product stays inside the viewport');
}
assert.equal(getStoryFraming(390,844).centerX,195,'mobile product remains centered above the copy');
console.log('Story: continuous lift, hero-clearing source character reveal, text-column clearance, section-following exit, reverse and shadow release passed.');
