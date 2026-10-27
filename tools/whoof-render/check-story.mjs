import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const base=resolve(import.meta.dirname,'../../src/src/engine/whoof');
const {outputFiles}=await build({stdin:{contents:`export {getStoryState,getStoryFraming,getStoryRowState,STORY_VISIBILITY} from '${base}/landing/StoryMotion.ts';export {collarContact} from '${base}/OpeningTransition.ts';`,resolveDir:base,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {getStoryState,getStoryFraming,getStoryRowState,STORY_VISIBILITY,collarContact}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
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
assert.equal(getStoryState(0).studio,0,'initial hero has no added studio illumination');
assert.equal(getStoryState(.62).studio,0,'studio lights wait until after ground release');
assert.equal(getStoryState(1.28).studio,1);
let previous=getStoryState(0);
const forward=[];
for(let i=0;i<=5000;i++){
 const s=i/1000,state=getStoryState(s,4);forward.push(state);
 for(const key of ['lift','atmosphere','title','description','table','turn','exit','studio'])assert.ok(state[key]>=0&&state[key]<=1&&state[key]>=previous[key]);
 assert.ok(Math.abs(state.lift-previous.lift)<.006,'no pose jump');
 assert.ok(Math.abs(state.studio-previous.studio)<.005,'no lighting jump');
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
assert.ok(Math.abs(getStoryRowState(.85).fade-STORY_VISIBILITY.content)<1e-10);
for(let p=-1;p<=2;p+=.01){
 const row=getStoryRowState(p);
 assert.ok(row.media>=.96,'every media frame remains clearly visible');
 assert.ok(row.meta*row.fade>.55,'supporting information does not disappear');
 assert.ok(STORY_VISIBILITY.character*row.fade>.4,'inactive title characters remain readable');
}
assert.deepEqual(getStoryRowState(-10,true),{show:1,meta:1,media:1,fade:1,scale:1});
const lightingBuild=await build({stdin:{contents:`export {StoryLighting} from '${base}/landing/StoryLighting.ts';export {Scene} from 'three';`,resolveDir:base,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {StoryLighting,Scene}=await import('data:text/javascript;base64,'+Buffer.from(lightingBuild.outputFiles[0].text).toString('base64'));
const scene=new Scene(),capturedEnvironment={name:'captured hero environment'};scene.environment=capturedEnvironment;
const lights=new StoryLighting(scene);
assert.equal(lights.key.intensity,0);assert.equal(lights.rim.intensity,0);
lights.setStrength(getStoryState(1.28).studio);
assert.ok(lights.key.intensity>0&&lights.rim.intensity>0);
assert.equal(scene.environment,capturedEnvironment,'softboxes never replace the captured environment');
lights.setStrength(getStoryState(0).studio);
assert.equal(lights.key.intensity+lights.rim.intensity,0,'reverse restores original hero lighting');
console.log('Story: measured full-section/reverse/columns, smooth studio ramp, visible media/readable text floors, reduced motion and shadow release passed.');
