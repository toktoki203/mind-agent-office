import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, resolve, sep } from 'node:path';
import agentHandler from '../api/agent.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const type={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/','http://localhost');
  const decoded=decodeURIComponent(url.pathname);
  if(decoded==='/api/agent'){
   if(req.method==='POST'){
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>50000){res.writeHead(413).end('Request too large');return;}chunks.push(chunk);}
    try{req.body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{res.writeHead(400).end('Invalid JSON');return;}
   }
   res.status=n=>{res.statusCode=n;return res;};
   res.json=obj=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(obj));return res;};
   await agentHandler(req,res);return;
  }
  const path=resolve(root,`.${decoded==='/'?'/index.html':decoded}`);
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
  if(!['/','/index.html','/favicon.svg'].includes(decoded)&&!/^\\/src\\/[a-zA-Z0-9_.-]+\\.(mjs|css)$/.test(decoded)){res.writeHead(404).end('Not found');return;}
  const info=await stat(path);if(!info.isFile()){res.writeHead(404).end('Not found');return;}
  res.writeHead(200,{'content-type':(type[extname(path)]||'application/octet-stream')+'; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(await readFile(path));
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,host,()=>console.log('MinD Agent Office V2 running at http://'+host+':'+port));
