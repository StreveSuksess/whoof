// Native UI checks against production files; faults exist only on localhost4341.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../../src/dist');
const modes=new Set(['slow','nomodule','skip','failure','reduced','nojs']);
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2','.mp4':'video/mp4'};
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost:4341'),parts=decodeURIComponent(url.pathname).split('/').filter(Boolean),mode=modes.has(parts[0])?parts.shift():'';
    const relative=parts.length?parts.join('/'):'index.html',file=resolve(root,relative);if(!file.startsWith(root+sep)||!((await stat(file)).isFile()))throw Error('Not found');
    if(mode==='failure'&&/OpeningScene.*\.js$/.test(file)){res.writeHead(503);res.end('Expected test failure');return;}
    if((mode==='slow'||mode==='skip')&&/OpeningScene.*\.js$/.test(file))await new Promise(r=>setTimeout(r,mode==='skip'?12000:3000));
    if(mode==='nomodule'&&/index\.astro_astro_type_script.*\.js$/.test(file))await new Promise(r=>setTimeout(r,12000));
    let body=await readFile(file);
    if(relative==='index.html'){
      let html=body.toString().replaceAll('/_astro/',`/${mode?mode+'/':''}_astro/`);
      if(mode==='nojs')html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
      if(mode==='reduced')html=html.replace('<head>','<head><script>const nativeQuery=matchMedia.bind(window);window.matchMedia=q=>q.includes("prefers-reduced-motion")?Object.assign(new EventTarget(),{matches:true,media:q,onchange:null,addListener(){},removeListener(){}}):nativeQuery(q);</script>');
      body=Buffer.from(html);
    }
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(4341,'127.0.0.1',()=>console.log('Native entry cases: localhost4341/{slow,nomodule,skip,failure,reduced,nojs}/'));
