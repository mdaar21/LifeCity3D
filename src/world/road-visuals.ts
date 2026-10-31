import type {CatalogItem,Placement} from '../lib/types';
export type RoadConnections=[boolean,boolean,boolean,boolean]; // local north, east, south, west
/** Visual joins only: no placement, collision, inventory or price changes. */
export function roadConnections(placements:Placement[],catalog:CatalogItem[]){
 const types=new Set(catalog.filter(c=>/road|path/.test(c.model)&&c.footprint_x===1&&c.footprint_z===1).map(c=>c.id));
 const roads=placements.filter(p=>types.has(p.catalog_id)),cells=new Set(roads.map(p=>`${p.catalog_id}:${p.x}:${p.z}`));
 return new Map(roads.map(p=>{const angle=p.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);return [p.id,[[0,-1],[1,0],[0,1],[-1,0]].map(([x,z])=>cells.has(`${p.catalog_id}:${p.x+Math.round(c*x+s*z)}:${p.z+Math.round(-s*x+c*z)}`)) as RoadConnections];}));
}
