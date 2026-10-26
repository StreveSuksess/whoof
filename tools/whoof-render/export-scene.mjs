import { build } from '../../src/node_modules/esbuild/lib/main.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const out=path.resolve(root,'../tmp/whoof-render');
await fs.mkdir(out,{recursive:true});
// Asset export only: reproduce the existing canvas pixels without a browser.
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}};}};
globalThis.fetch=async url=>{const data=await fs.readFile(path.join(root,'src/public',url));return {ok:true,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};};
await build({stdin:{contents:`export {createProductCollar} from './src/engine/whoof/ProductCollar.ts'; export {EntrywayScene} from './src/engine/whoof/EntrywayScene.ts';`,resolveDir:path.join(root,'src')},outfile:path.join(out,'assembly.mjs'),bundle:true,format:'esm',platform:'node'});
const {createProductCollar,EntrywayScene}=await import(path.join(out,'assembly.mjs'));
const collar=(await createProductCollar(true)).group;
const props=new EntrywayScene().group;
const geometries={},objects=[];
function collect(group,layer){group.updateMatrixWorld(true);group.traverse(o=>{if(!o.isMesh)return;
const g=o.geometry;
if(!geometries[g.uuid]) geometries[g.uuid]={position:Array.from(g.attributes.position.array),normal:Array.from(g.attributes.normal.array),uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,index:g.index?Array.from(g.index.array):null};
let role=layer;for(let p=o;p;p=p.parent){if(['Walking lead','House keys','Play ball'].includes(p.name))role=p.name;}
objects.push({name:o.name,layer,role,geometry:g.uuid,matrix:Array.from(o.matrixWorld.elements),instances:o.isInstancedMesh?Array.from(o.instanceMatrix.array):null,material:{color:o.material.color.toArray(),roughness:o.material.roughness,metalness:o.material.metalness}});
});}
collect(collar,'collar');collect(props,'environment');
await fs.writeFile(path.join(out,'assembly.json'),JSON.stringify({geometries,objects}));
console.log(`Exported ${objects.length} meshes / ${Object.keys(geometries).length} shared geometries to ${out}`);
