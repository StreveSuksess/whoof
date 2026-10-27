import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const base=resolve(import.meta.dirname,'../../src/src/engine/whoof');
const {outputFiles}=await build({stdin:{contents:`export {getStoryState,getStoryFraming,getStoryRowState} from '${base}/landing/StoryMotion.ts';export {collarContact} from '${base}/OpeningTransition.ts';`,resolveDir:base,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {getStoryState,getStoryFraming,getStoryRowState,collarContact}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
assert.equal(getStoryState(0).lift,0);
assert.equal(getStoryState(.32).lift,0,'table pose retained until release');
assert.equal(getStoryState(.86).lift,1,'final pose reached before full section');
assert.equal(getStoryState(1).lift,1);
assert.equal(getStoryState(1).exit,0);
assert.equal(getStoryState(2.1,4).exit,0,'model remains held throughout lower rows');
assert.equal(getStoryState(3.25,4).exit,0,'exit waits for the measured end');
assert.equal(getStoryState(4,4).exit,1,'model clears before the following section');
assert.equal(getStoryState(2,4).table,1,'table receives its centered pose');
assert.equal(getStoryState(.58).title,0,'story title does not cross the exiting hero card');
assert.equal(getStoryState(.92).title,1);
assert.equal(getStoryState(.5).description,0);
assert.equal(getStoryState(1).description,1);
let previous=getStoryState(0);
const forward=[];
for(let i=0;i<=5000;i++){
 const s=i/1000,state=getStoryState(s,4);forward.push(state);
 for(const key of ['lift','atmosphere','title','description','table','turn','exit'])assert.ok(state[key]>=0&&state[key]<=1&&state[key]>=previous[key]);
 assert.ok(Math.abs(state.lift-previous.lift)<.006,'no pose jump');
 if(state.lift>=.06)assert.equal(collarContact(s),0,'no grounded shadow on a flying collar');
 previous=state;
}
for(let i=5000;i>=0;i--)assert.deepEqual(getStoryState(i/1000,4),forward[i],'reverse is deterministic');
for(const [w,h] of [[1060,1194],[1296,1194],[1440,900],[1920,1080]]){
 const {diameter,centerX}=getStoryFraming(w,h);
 assert.ok(centerX+diameter/2<=w*.687-17,'product does not collide with the right text column');
 assert.ok(centerX-diameter/2>=w*.03,'product stays inside the viewport');
 const table=getStoryFraming(w,h,1);
 assert.ok(table.centerX-table.diameter/2>=w*.25625,'left table text column remains clear');
 assert.ok(table.centerX+table.diameter/2<=w*.74375,'right table media column remains clear');
}
assert.equal(getStoryFraming(390,844).centerX,195,'mobile product remains centered above the copy');
assert.equal(getStoryRowState(.15).show,0);
assert.equal(getStoryRowState(.45).show,1);
assert.equal(getStoryRowState(.55).fade,1);
assert.ok(Math.abs(getStoryRowState(.85).fade-.2)<1e-10);
assert.deepEqual(getStoryRowState(-10,true),{show:1,meta:1,fade:1,scale:1});
console.log('Story: full measured section hold/exit, reversible lift/pose, table-column clearance, source row reveal, reduced-motion readability and shadow release passed.');
