import publicService from './deployment/client-service.json';
import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'VITE_');
 const base=process.env.VITE_BASE_PATH||env.VITE_BASE_PATH||'/';
 if(!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base)||base.includes('..'))throw new Error('VITE_BASE_PATH must be / or /repository-name/.');
 const router=process.env.VITE_ROUTER_MODE||env.VITE_ROUTER_MODE||'browser';
 const backend=process.env.VITE_BACKEND_MODE||env.VITE_BACKEND_MODE||(publicService.enabled?'supabase':'demo');
 if(router==='hash'&&backend!=='demo')throw new Error('Hash routing is reserved for the clearly labeled local guest preview. Use browser routing for configured accounts.');
 const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'";
 return {
  base,
  plugins:[react(),tailwind(),{name:'lifecity-production-csp',apply:'build',transformIndexHtml(html){return html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${csp}">`);}},VitePWA({
   registerType:'prompt',includeAssets:['icons/icon.svg','fonts/*.ttf'],
   manifest:{name:'LifeCity 3D | لايف سيتي',short_name:'لايف سيتي',description:'ابنِ مدينتك بإنجازاتك',lang:'ar-SA',dir:'rtl',theme_color:'#173B32',background_color:'#F6F3E9',display:'standalone',start_url:base,scope:base,icons:[{src:base+'icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:base+'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:base+'icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},
   workbox:{globPatterns:['**/*.{js,css,html,png,svg,ttf}'],globIgnores:['**/api/**'],maximumFileSizeToCacheInBytes:5*1024*1024,navigateFallback:base+'index.html',navigateFallbackDenylist:[/\/api\//],runtimeCaching:[]},devOptions:{enabled:false}
  })],
  server:{port:5173,proxy:{'/api':{target:'http://127.0.0.1:4174',changeOrigin:false}}},
  build:{target:'es2022',rollupOptions:{output:{manualChunks(id){
   // Shared React entry points/helpers must not pull the entire 3D engine into
   // login, task and settings pages through a reverse chunk dependency.
   if(id.includes('commonjsHelpers')||id.includes('vite/preload-helper'))return 'vendor';
   const dependency=id.split('/node_modules/').at(-1)||'';
   if(/^(react|react-dom|react-router|react-router-dom|scheduler)\//.test(dependency))return 'vendor';
   if(/^(three\/|@react-three\/(fiber|drei)\/)/.test(dependency))return 'three';
   if(dependency.startsWith('@supabase/'))return 'cloud';
  }}}}
 };
});
