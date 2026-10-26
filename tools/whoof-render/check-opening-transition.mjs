import assert from 'node:assert/strict';
import {build} from '../../src/node_modules/esbuild/lib/main.js';
const result=await build({entryPoints:['src/src/engine/whoof/OpeningTransition.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {collarLift,collarContact,liveCollarVisible}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
assert.equal(collarLift(.32),0);assert.equal(collarContact(.32),1);
assert.equal(collarContact(.46),0,'Detached ground ring must be gone before the product rises into the details stage');
assert.equal(collarContact(.55),0);
const forward=[];
for(let i=0;i<=1000;i++){
 const scroll=i/1000,contact=collarContact(scroll),lift=collarLift(scroll);
 assert.ok(contact>=0&&contact<=1&&lift>=0&&lift<=1);
 if(i)assert.ok(contact<=forward.at(-1)+1e-10,'Contact releases monotonically');
 forward.push(contact);
}
for(let i=1000;i>=0;i--)assert.equal(collarContact(i/1000),forward[i],'Reverse scroll restores the exact ground contact');
assert.equal(liveCollarVisible(0,0),false);
assert.equal(liveCollarVisible(.08,0),false);
assert.equal(liveCollarVisible(.081,0),true);
assert.equal(liveCollarVisible(1,0),true);
assert.equal(liveCollarVisible(5,1),false);
console.log('Opening visibility and reversible lift/contact checks passed');
