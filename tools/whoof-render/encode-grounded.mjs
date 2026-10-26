import sharp from '../../src/node_modules/sharp/lib/index.js';
import {readFile,readdir,copyFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const version=process.argv[3]??'v22';
if(!/^v\d+$/.test(version))throw new Error('Expected version vNN');
const master=resolve(root,`../tmp/whoof-render/masters-${version}`);
const output=resolve(root,`src/public/whoof/hero-${version}`);
for(const format of (process.argv[2]?[process.argv[2]]:['landscape','portrait'])){
 const meta=JSON.parse(await readFile(`${output}/${format}.json`,'utf8'));
 for(const name of ['background','shadow','collar'])await copyFile(`${root}/src/public/whoof/hero-v15/${format}-${name}.webp`,`${output}/${format}-${name}.webp`);
 const files=await readdir(master);
 const empty=await sharp(`${master}/${format}-catcher-empty.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(files.includes(`${format}.png`))await sharp(`${master}/${format}.png`).webp({quality:94,effort:6}).toFile(`${output}/${format}.webp`);
 for(const [name,asset] of Object.entries(meta.motion)){
  const [x,y,w,h]=asset.rect,W=empty.info.width,H=empty.info.height;
  const left=Math.floor(x*W),top=H-Math.floor((1-y)*H);
  const cropWidth=Math.floor((x+w)*W)-left,cropHeight=H-Math.floor((1-y-h)*H)-top;
  const width=Math.round(w*meta.width*.75),height=Math.round(h*meta.height*.75);
  const baseline=await sharp(empty.data,{raw:empty.info}).extract({left,top,width:cropWidth,height:cropHeight}).resize(width,height,{fit:'fill'}).raw().toBuffer();
  for(const frame of asset.frames){
   const source=frame.replace('.webp','.png');if(!files.includes(source))continue;
   const rgba=await sharp(`${master}/${source}`).ensureAlpha().resize(width,height,{fit:'fill'}).raw().toBuffer();
   // The opaque background already contains the pad's self-shadow. Remove the
   // empty catcher's contribution instead of darkening it again inside a crop.
   for(let i=0;i<rgba.length;i+=4){
    const a=rgba[i+3]/255,b=baseline[i+3]/255;
    const clean=Math.max(0,Math.min(1,(a-b)/Math.max(1/255,1-b)));
    if(clean<1/255){rgba[i]=rgba[i+1]=rgba[i+2]=rgba[i+3]=0;continue;}
    for(let c=0;c<3;c++)rgba[i+c]=Math.max(0,Math.min(255,(rgba[i+c]*a-(1-clean)*baseline[i+c]*b)/clean));
    // Truncate only the far penumbra smoothly; full-frame boundaries retain
    // intentionally cropped objects. Geometry stays outside this padded margin.
    const px=(i/4)%width,py=Math.floor(i/4/width);
    const distance=Math.min(x>0?px:Infinity,x+w<.999999?width-1-px:Infinity,y>0?py:Infinity,y+h<.999999?height-1-py:Infinity);
    const t=Math.max(0,Math.min(1,distance/32)),feather=t*t*(3-2*t);
    rgba[i+3]=Math.round(clean*feather*255);
   }
   await sharp(rgba,{raw:{width,height,channels:4}}).webp({quality:94,alphaQuality:100,effort:5}).toFile(`${output}/${frame}`);
  }
  console.log(format,name,asset.frames.filter(f=>files.includes(f.replace('.webp','.png'))).length,'/',asset.frames.length);
 }
}
