import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const app=resolve(import.meta.dirname,'../../src');
const result=await build({entryPoints:[resolve(app,'src/engine/whoof/landing/OfferMotion.ts')],bundle:true,write:false,format:'esm',platform:'node'});
const {getOfferState,getSketchProximity,nextOfferTab,OFFER_SOURCE_FX,getOfferBloomWeights,getOfferBloomLayout,getOfferBrushRadius,getOfferSketchBreathing}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
for(const [height,mobile] of [[900,false],[1194,false],[844,true]]){
 const states=[];
 for(let y=-height*2;y<=height*3;y+=5){const state=getOfferState(y,height,mobile);states.push([y,state]);assert.ok(state.progress>=0&&state.progress<=1&&state.show>=0&&state.show<=1);assert.ok(state.pickerY>height*.15&&state.pickerY<height*.4);assert.ok(state.modelY>=height*.5&&state.modelY<height*.85);}
 for(const [y,state] of states.reverse())assert.deepEqual(getOfferState(y,height,mobile),state,'reverse restores the same composition');
 assert.equal(getOfferState(0,height,mobile,true).modelY,getOfferState(height,height,mobile,true).modelY,'reduced motion has a fixed product frame');
 assert.equal(getOfferState(0,height,mobile,true).yaw,getOfferState(height,height,mobile,true).yaw,'reduced motion has no scroll rotation');
}
assert.equal(getSketchProximity(.3),1);assert.equal(getSketchProximity(1.3),0);assert.equal(getSketchProximity(20),0);
assert.equal(nextOfferTab(0,'ArrowLeft'),1);assert.equal(nextOfferTab(1,'ArrowRight'),0);assert.equal(nextOfferTab(1,'Home'),0);assert.equal(nextOfferTab(0,'End'),1);
assert.deepEqual(OFFER_SOURCE_FX,{iterations:5,amount:6,radius:.25,threshold:.3,smoothWidth:.75,lumaStrength:0,selectiveStrength:4,saturation:2});
getOfferBloomWeights().forEach((weight,i)=>assert.ok(Math.abs(weight-[.3,.525,.9,1.5,2.4][i])<1e-10));
for(const [w,h] of [[1440,900],[1020,1194],[3840,2160],[1,1]]){
 const layout=getOfferBloomLayout(w,h);assert.ok(layout.width<=1600&&layout.height<=1600);assert.equal(layout.levels.length,5);
 let previous={width:layout.width,height:layout.height};for(const level of layout.levels){assert.equal(level.width,Math.ceil(previous.width/2));assert.equal(level.height,Math.ceil(previous.height/2));assert.ok(level.width>=1&&level.height>=1);previous=level;}
}
assert.equal(getOfferBrushRadius(100,1000,250),25);assert.equal(getOfferBrushRadius(10,1000,250),2.5);assert.equal(getOfferBrushRadius(0,1000,250),0);assert.equal(getOfferBrushRadius(100,1000,250,true),0);
for(let t=0;t<60;t+=.1){const b=getOfferSketchBreathing(t,.3);assert.ok(Math.abs(b.rotation)<=.1&&b.scale>=.9&&b.scale<=1.1);assert.deepEqual(getOfferSketchBreathing(t,.3,true),{rotation:0,scale:1});}
const html=readFileSync(resolve(app,'dist/index.html'),'utf8');
assert.equal((html.match(/data-offer-tab/g)||[]).length,2);assert.equal((html.match(/data-offer-panel/g)||[]).length,2);
for(const text of ['14 990','19 990','6 000','предзаказ.','Устройство остаётся вашим.'])assert.ok(html.includes(text),text);
for(const plan of ['one-year','two-years'])assert.ok(html.includes(`href="https://whoof.ru/checkout.html?plan=${plan}"`),'term reaches matching verified checkout');
assert.ok(html.includes('Опубликованный состав сервиса')&&html.includes('п. 21.3 оферты'),'base/paid difference retains the version limitation');
assert.ok(html.includes('role="tablist"')&&html.includes('aria-controls="offer-panel-two-years"'));
assert.ok(!html.includes('class="offer-options"'),'old price grid replaced');
for(const name of ['collar','walk','rest','day'])assert.ok(existsSync(resolve(app,`public/whoof/offer-v37/${name}.webp`)));
const scene=readFileSync(resolve(app,'src/engine/whoof/OpeningScene.ts'),'utf8');
assert.equal((scene.match(/new WebGLRenderer/g)||[]).length,1,'offer shares the established renderer');
assert.ok(scene.includes("import('./landing/OfferSketches')"),'sketch GPU code is deferred');
console.log('Offer FX: source Bloom profile/weights, five capped levels, raw brush response, breathing and quiet state passed.');
console.log('Offer: bounded/reversible/reduced composition, proximity, keyboard, two factual plans, generated plates and one deferred shared renderer passed.');
