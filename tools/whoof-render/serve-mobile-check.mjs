// Same production files, with a deliberately cold deferred 3D module.
// No browser automation or production hooks; inspect through the native browser.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../../src/dist');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2','.mp4':'video/mp4'};
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost:4341'),relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1),file=resolve(root,relative);
    if(!file.startsWith(root+sep))throw Error('Invalid path');
    if(!((await stat(file)).isFile()))throw Error('Not a file');
    if(/OpeningScene.*\.js$/.test(file))await new Promise(r=>setTimeout(r,8000));
    const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(4341,'127.0.0.1',()=>console.log('Cold-module native check: http://localhost:4341/ (3D import delayed 8s)'));
