import {build} from '../../src/node_modules/esbuild/lib/main.js';
import assert from 'node:assert/strict';
const result=await build({entryPoints:['src/src/engine/whoof/HeroPropMotion.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {HeroPropMotion}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
for(const kind of ['keys','leash','ball']){
 const passive=new HeroPropMotion(kind);for(let i=0;i<600;i++)passive.step(1/60,true);assert.equal(passive.q,0);
 const values=[30,60,120].map(fps=>{const m=new HeroPropMotion(kind);m.impulse(3);for(let i=0;i<fps*.5;i++)m.step(1/fps,true);return m.q;});
 assert.ok(Math.max(...values)-Math.min(...values)<.005,`${kind}: frame-rate dependent ${values}`);
 const m=new HeroPropMotion(kind);
 for(let i=0;i<500;i++){m.impulse(i<250?2:-2);m.step(1/30,true);assert.ok(Number.isFinite(m.q)&&Math.abs(m.q)<=1);}
 for(let i=0;i<1800;i++)m.step(1/60,true);assert.ok(Math.abs(m.velocity)<.002,`${kind}: does not settle`);
 m.impulse(3);m.step(1/60,false);assert.equal(m.q,0);assert.equal(m.velocity,0);
 console.log(`${kind}: bounded, deterministic, settles, disabled resets`);
}
const ball=new HeroPropMotion('ball');ball.impulse(2);for(let i=0;i<600;i++)ball.step(1/60,true);assert.ok(ball.q>.1,'Ball must stop after rolling, not spring back toward the cursor');
const leash=new HeroPropMotion('leash');leash.impulse(2);for(let i=0;i<600;i++)leash.step(1/60,true);
assert.ok(leash.q>.1,'A resting rope must stop through friction, not spring back');
const rest=leash.q;for(let i=0;i<600;i++)leash.step(1/60,true);assert.equal(leash.q,rest);assert.equal(leash.moving,false);
