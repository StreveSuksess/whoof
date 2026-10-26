import sharp from '../../src/node_modules/sharp/lib/index.js';
import {readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const version=process.argv[2]??'v14';
if(!/^v[0-9]+$/.test(version))throw new Error('Use a render version such as v15');
const root=fileURLToPath(new URL(`../../src/public/whoof/hero-${version}/`,import.meta.url));
const input=fileURLToPath(new URL(`../../../tmp/whoof-render/masters${version==='v14'?'':`-${version}`}/`,import.meta.url));
for(const name of await readdir(input)) {
 if(!name.endsWith('.png')||name.includes('draft'))continue;
 await sharp(input+name).webp({quality:94,alphaQuality:100,effort:6}).toFile(root+name.replace('.png','.webp'));
 console.log(name);
}
