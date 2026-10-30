/** Keep assets, auth callbacks and invites inside the GitHub Pages repository. */
export const APP_BASE=import.meta.env.BASE_URL||'/';
export function appPath(path:string){return APP_BASE+path.replace(/^\/+/, '');}
export function appUrl(path:string){const target=import.meta.env.VITE_ROUTER_MODE==='hash'?APP_BASE+'#/'+path.replace(/^\/+/, ''):appPath(path);return new URL(target,window.location.origin).href;}
