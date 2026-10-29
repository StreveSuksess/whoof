import {build} from '../../src/node_modules/esbuild/lib/main.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const repo=resolve(import.meta.dirname,'../..');
const result=await build({entryPoints:[resolve(repo,'src/src/engine/whoof/landing/app/AppArtwork.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {renderAppArtwork}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const destination=resolve(repo,'src/public/whoof/app-v55');await mkdir(destination,{recursive:true});
for(const mode of ['day','week'])for(const full of [false,true]){
 const name=(full?'screen-':'')+mode+'.svg';
 await writeFile(resolve(destination,name),renderAppArtwork(mode,full));
}
console.log('Four vector derivatives written from AppArtwork.ts. Illustrative data only.');
