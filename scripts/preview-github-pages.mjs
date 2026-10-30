import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const report=JSON.parse(await readFile('docs/evidence/github-pages-build.json','utf8'));const base=report.base;const root=resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=createServer(async(request,response)=>{
 try{
  const url=new URL(request.url||'/', 'http://localhost');if(!url.pathname.startsWith(base)){response.writeHead(404);response.end('Outside app base');return;}
  const relative=decodeURIComponent(url.pathname.slice(base.length))||'index.html';const file=resolve(root,relative);if(file!==root&&!file.startsWith(root+sep)){response.writeHead(403);response.end();return;}
  let target=file,status=200;try{if(!(await stat(target)).isFile())throw new Error('Not a file');}catch{target=resolve(root,'404.html');status=404;}
  response.writeHead(status,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});response.end(await readFile(target));
 }catch{response.writeHead(500);response.end('Preview error');}
});
const port=Number(process.env.LIFECITY_PREVIEW_PORT||4176);server.listen(port,'127.0.0.1',()=>console.log(`LOCAL GitHub Pages simulation: http://127.0.0.1:${server.address().port}${base} (not published)`));
