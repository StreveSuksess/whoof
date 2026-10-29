import assert from 'node:assert/strict';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
import {resolve} from 'node:path';
const repo=resolve(import.meta.dirname,'../..');
async function load(path){const r=await build({entryPoints:[resolve(repo,path)],bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const {REFERENCE_DAY,EXAMPLE_DAY,compareWindow}=await load('src/src/engine/whoof/landing/app/AppComparison.ts');
assert.equal(REFERENCE_DAY.length,144);assert.equal(EXAMPLE_DAY.length,144);
assert.ok([...REFERENCE_DAY,...EXAMPLE_DAY].every(n=>Number.isFinite(n)&&n>=0&&n<=1));
for(let i=0;i<144;i++)if(i<42||i>=60)assert.equal(EXAMPLE_DAY[i],REFERENCE_DAY[i],'only the described morning window changes');
assert.ok(compareWindow(7,10).ratio<.5,'morning movement in the illustration falls substantially');
assert.equal(compareWindow(17,21).ratio,1,'evening really stays the same');
assert.throws(()=>compareWindow(10,7),RangeError);assert.throws(()=>compareWindow(-1,5),RangeError);
const {APP_TRAVEL_UNITS,getAppAuthoredTime,getAppScrollTime,getAppSceneState}=await load('src/src/engine/whoof/landing/app/AppMotion.ts');
assert.equal(APP_TRAVEL_UNITS,6);
for(let p=-1;p<8;p+=.013){assert.ok(Math.abs(getAppScrollTime(getAppAuthoredTime(p))-p)<1e-10);}
assert.equal(getAppAuthoredTime(6),7);assert.equal(getAppAuthoredTime(7),8);
for(const p of [0,6]){const e=.0001;assert.ok(Math.abs((getAppAuthoredTime(p+e)-getAppAuthoredTime(p))/e-(getAppAuthoredTime(p)-getAppAuthoredTime(p-e))/e)<.00001,'retiming has continuous boundary velocity');}
assert.ok(getAppSceneState(6.7*900,900,1440).opacity<1,'pair leaves during the following section');
console.log('Worked example: only morning differs, identical evening, honest window comparison and reversible shortened scroll passed.');
