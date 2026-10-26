import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import sharp from '../../src/node_modules/sharp/lib/index.js';
const root='src/public/whoof',version=process.argv[2]??'v23';
const result={};
for(const format of ['landscape','portrait']){
 const meta=JSON.parse(await readFile(`${root}/hero-${version}/${format}.json`,'utf8'));
 let bytes=0,decoded=0;
 for(const [name,asset] of Object.entries(meta.motion)){
  assert.ok(asset.frames.length%2===1,'A complete neutral pose is required');
  const expected=name==='leash'&&version==='v23'?17:65;assert.equal(asset.frames.length,expected);
  if(version==='v24'&&name==='leash')assert.ok(asset.contacts.length>10,'Free-rope contact path missing');
  let size;
  for(let i=0;i<asset.frames.length;i++){
   const path=`${root}/hero-${version}/${asset.frames[i]}`;
   const image=await sharp(path).metadata();assert.ok(image.hasAlpha);
   const dimensions=[image.width,image.height];
   if(size)assert.deepEqual(dimensions,size,`${name} crop drifts between poses`);else size=dimensions;
   bytes+=(await stat(path)).size;decoded+=image.width*image.height*4;
   if(name!=='leash'&&i%4===0){
    const old=`${root}/hero-v22/${format}-${name}-${String(i/4).padStart(2,'0')}.webp`;
    assert.deepEqual(await readFile(path),await readFile(old),'Original physical pose or shading changed');
   }
   if(version==='v24'&&name==='leash'&&i===32){
    assert.deepEqual(await readFile(path),await readFile(`${root}/hero-v23/${format}-leash-08.webp`),'Neutral leash changed');
   }
  }
 }
 result[format]={bytes,decodedMiB:decoded/1024**2};
}
console.log(JSON.stringify(result,null,2));
