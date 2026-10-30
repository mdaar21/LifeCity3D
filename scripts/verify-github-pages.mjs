import {spawn} from 'node:child_process';

// Verify exactly the compiled artifact on an isolated, ephemeral localhost port.
// Nothing here uploads files or changes the user's GitHub account.
const server=spawn(process.execPath,['scripts/preview-github-pages.mjs'],{
 env:{...process.env,LIFECITY_PREVIEW_PORT:'0'},stdio:['ignore','pipe','inherit']
});
try{
 const base=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Local Pages simulation did not start within 15 seconds.')),15_000);
  let output='';
  server.stdout.on('data',chunk=>{
   output+=chunk.toString();
   const match=output.match(/LOCAL GitHub Pages simulation: (http:\/\/\S+) \(not published\)/);
   if(match){clearTimeout(timer);resolve(match[1].replace(/\/$/,''));}
  });
  server.once('error',error=>{clearTimeout(timer);reject(error);});
  server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Local Pages simulation exited early (${code}).`));});
 });
 for(const script of ['scripts/check-github-pages.ts','scripts/check-pwa.ts']){
  await new Promise((resolve,reject)=>{
   const check=spawn(process.execPath,['--import','tsx',script],{
    env:{...process.env,REVIEW_BASE:base},stdio:'inherit'
   });
   check.once('error',reject);
   check.once('exit',(code,signal)=>code===0?resolve():reject(new Error(`${script} failed (${signal||code}).`)));
  });
 }
}finally{
 if(server.exitCode===null){
  const closed=new Promise(resolve=>server.once('exit',resolve));
  server.kill('SIGTERM');
  await closed;
 }
}
