import {buildingSetbacks} from '../../supabase/functions/_shared/building-massing';
import {BoxGeometry,BufferGeometry,Color,CylinderGeometry,ExtrudeGeometry,Float32BufferAttribute,Shape,SphereGeometry} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {FloorPlan,Rect} from '../../supabase/functions/_shared/world-types';
export type ArchitectureStyle='forest'|'coastal'|'desert';
export type ArchitectureFamily='house'|'villa'|'apartment'|'palace'|'restaurant'|'mall'|'hotel'|'resort'|'school'|'university'|'clinic'|'hospital'|'garage'|'museum'|'office';
export interface ArchitectureInput{family:ArchitectureFamily;width:number;depth:number;floors:Pick<FloorPlan,'index'|'height'|'rooms'|'corridor'|'stairs'|'elevator'>[];style:ArchitectureStyle;finished:boolean;roofPaid:boolean;low?:boolean;wallAt?:(floor:number)=>string;roofColor?:string;glassAt?:(floor:number)=>string;doorColor?:string}
/** Room-bearing pavilions and connecting galleries replace the old full-box shell.
 * Every volume derives from the saved floor plan; these meshes create no assets. */
export function premiumArchitecture(p:ArchitectureInput){
 const parts={wall:[] as BufferGeometry[],roof:[] as BufferGeometry[],glass:[] as BufferGeometry[],trim:[] as BufferGeometry[]},w=p.width,d=p.depth,variant=p.style==='forest'?0:p.style==='coastal'?1:2;
 const colors={stone:p.finished?(p.style==='desert'?'#dbc19d':p.style==='coastal'?'#e7eee6':'#ded9c4'):'#a8aca3',roof:p.roofColor??(variant===0?'#a66d50':variant===1?'#618a94':'#ac8b62'),wood:variant===2?'#a5855e':'#597c71',trim:'#d7d9cb',glass:'#7faeb7'};
 const add=(kind:keyof typeof parts,g:BufferGeometry,tone:string,x:number,y:number,z:number,ry=0)=>{const shape=g.index?g.toNonIndexed():g.clone();g.dispose();shape.rotateY(ry);shape.translate(x,y,z);shape.deleteAttribute('uv');const c=new Color(tone),rgb=new Float32Array(shape.getAttribute('position').count*3);for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}shape.setAttribute('color',new Float32BufferAttribute(rgb,3));parts[kind].push(shape);};
 const box=(kind:keyof typeof parts,x:number,y:number,z:number,ww:number,h:number,dd:number,c:string,ry=0)=>add(kind,new BoxGeometry(Math.max(.01,ww),Math.max(.01,h),Math.max(.01,dd)),c,x,y,z,ry);
 const column=(x:number,y:number,z:number,r:number,h:number,c=colors.stone)=>add('trim',new CylinderGeometry(r,r,h,p.low?6:10),c,x,y,z);
 const rounded=(kind:keyof typeof parts,r:Rect,y:number,h:number,tone:string,round=.12)=>{const radius=Math.min(round,r.width*.12,r.depth*.12),s=new Shape();s.moveTo(radius,0);s.lineTo(r.width-radius,0);s.quadraticCurveTo(r.width,0,r.width,radius);s.lineTo(r.width,r.depth-radius);s.quadraticCurveTo(r.width,r.depth,r.width-radius,r.depth);s.lineTo(radius,r.depth);s.quadraticCurveTo(0,r.depth,0,r.depth-radius);s.lineTo(0,radius);s.quadraticCurveTo(0,0,radius,0);const g=new ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:p.low?1:4});g.rotateX(Math.PI/2);add(kind,g,tone,r.x,y+h,r.z);};
 const gable=(r:Rect,y:number,h:number,tone=colors.roof)=>{const ww=r.width,dd=r.depth,g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([0,0,0,ww,0,0,ww/2,h,0,0,0,dd,ww,0,dd,ww/2,h,dd],3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);g.computeVertexNormals();add('roof',g,tone,r.x,y,r.z);};
 const vault=(r:Rect,y:number,rise:number)=>{const g=new CylinderGeometry(1,1,r.depth,p.low?8:16,1,false,0,Math.PI);g.rotateX(Math.PI/2);g.rotateZ(Math.PI/2);g.scale(r.width/2,rise,r.depth/r.depth);add('roof',g,colors.roof,r.x+r.width/2,y,r.z+r.depth/2);};
 const levels=[...p.floors].filter(f=>f.index>=0).sort((a,b)=>a.index-b.index),total=levels.reduce((n,f)=>n+f.height,0),residential=['house','villa','apartment','palace'].includes(p.family),commercial=['mall','hotel','office','restaurant'].includes(p.family);
 let baseY=0;
 for(const [index,f]of levels.entries()){
  const tone=p.wallAt?.(f.index)??colors.stone,h=f.height,top=baseY+h,sb=buildingSetbacks(p.family,d,p.style),rooms=f.rooms.length?f.rooms:[{x:0,z:sb.leftFront,width:w*.4,depth:d-sb.leftFront-sb.leftBack},{x:w*.6,z:sb.rightFront,width:w*.4,depth:d-sb.rightFront-sb.rightBack}];
  box('wall',w/2,baseY+.05,d/2,w,.1,d,'#9aa79c');
  if(p.family==='garage'){
   for(const x of [.22,w-.22])for(let z=.4;z<d;z+=Math.max(2.5,d/3))column(x,baseY+h/2,z,.13,h,tone);
   if(index<levels.length-1||p.roofPaid)box('roof',w/2,top-.1,d/2,w,.2,d,'#a6b0a6');if(index===levels.length-1&&p.roofPaid){if(variant===1){vault({x:0,z:0,width:w/2,depth:d},top,.6);vault({x:w/2,z:0,width:w/2,depth:d},top,.6);}else if(variant===2)gable({x:0,z:0,width:w,depth:d},top,.8);}
   for(const room of rooms)for(let z=room.z+.2;z<room.z+room.depth-.2;z+=4)for(let x=room.x+.1;x<room.x+room.width-.1;x+=2.2){box('trim',x,baseY+.12,z+1.7,.035,.015,3.3,'#e6d8b0');box('trim',x+1,baseY+.12,z,.035,.015,1.7,'#e6d8b0',Math.PI/2);}
   box('wall',w/2,baseY+h*.8,.2,w,h*.28,.25,colors.wood);
  }else for(const [j,r]of rooms.entries()){
   const inset=p.family==='resort'?.15:.035,roofStep=p.family==='villa'&&index===levels.length-1?j%2*.35:0,rr={x:r.x+inset,z:r.z+inset,width:r.width-2*inset,depth:r.depth-2*inset};rounded('wall',rr,baseY+.12,h-.22+roofStep,tone,['clinic','museum','hotel'].includes(p.family)?.2+variant*.1:.04+variant*.12);
   if(p.finished){
    const glass=p.glassAt?.(f.index)??colors.glass;
    const face=(length:number,x:number,z:number,angle:number)=>{const bays=p.low?1:Math.max(1,Math.min(5,Math.floor(length/(residential?2:1.7)))),bay=length/bays;
     for(let k=0;k<bays;k++){const offset=(k+.5)*bay-length/2,xx=x+Math.cos(angle)*offset,zz=z-Math.sin(angle)*offset,ww=Math.max(.2,Math.min(bay*.7,commercial?1.9:1.5)),hh=h*(commercial?.65:.5);box('trim',xx,baseY+h*.55,zz,ww+.12,hh+.12,.07,'#35525d',angle);box('glass',xx+Math.sin(angle)*.05,baseY+h*.55,zz+Math.cos(angle)*.05,ww,hh,.035,glass,angle);
      if(!p.low){box('trim',xx,baseY+h*.55,zz+.08,ww,.035,.02,colors.trim,angle);if(['villa','apartment','hotel','resort'].includes(p.family)&&index>0){box('trim',xx,baseY+.25,zz+.12,ww+.2,.11,.32,colors.trim,angle);box('glass',xx,baseY+.63,zz+.23,ww+.14,.55,.04,glass,angle);}}
     }};
    face(r.width,r.x+r.width/2,r.z+.015,Math.PI);face(r.width,r.x+r.width/2,r.z+r.depth-.015,0);if(r.x<.1)face(r.depth,.015,r.z+r.depth/2,-Math.PI/2);if(r.x+r.width>w-.1)face(r.depth,w-.015,r.z+r.depth/2,Math.PI/2);
   }
   if(index===levels.length-1&&p.roofPaid){
    if(['house','school','resort'].includes(p.family)||p.family==='villa'&&variant===0)gable(rr,top+roofStep,Math.min(r.width*.3,variant===2?.6:1.05));
    else if(p.family==='restaurant'&&j%2===0||p.family==='museum'&&j===0)vault(rr,top,Math.min(.85,r.width*.22));
    else{box('roof',r.x+r.width/2,top+.1+roofStep,r.z+r.depth/2,r.width,.2,r.depth,colors.roof);if(!p.low&&['villa','resort','office'].includes(p.family))for(let slat=0;slat<7;slat++)box('trim',r.x+r.width*(.12+slat*.12),top+.35,r.z+r.depth/2,.06,.13,r.depth*.8,colors.wood);}
   }
  }
  const c=f.corridor,glazing=p.finished?(p.glassAt?.(f.index)??colors.glass):'#7d918d';
  if(p.family!=='garage'){
   box('glass',c.x+c.width/2,baseY+h*.48,.06,Math.max(.35,c.width-.15),h*(.87-variant*.1),.08,glazing);
   if(p.finished&&!p.low)for(const x of [c.x+.08,c.x+c.width-.08])box('trim',x,baseY+h*.5,.05,.065,h,.15,colors.wood);
   if(f.stairs){rounded('wall',f.stairs,baseY+.1,h-.12,tone,.12);if(p.finished)box('glass',w-.045,baseY+h*.55,f.stairs.z+f.stairs.depth/2,.08,h*.7,f.stairs.depth*.72,glazing);}
   if(f.elevator){rounded('glass',f.elevator,baseY+.12,h-.12,glazing,.15);if(!p.low)box('trim',f.elevator.x+f.elevator.width/2,top-.08,f.elevator.z+f.elevator.depth/2,f.elevator.width,.1,f.elevator.depth,colors.wood);}
   if(p.roofPaid&&index===levels.length-1){const gallery={x:c.x,z:0,width:c.width,depth:d};if(variant===1||['restaurant','hotel','mall'].includes(p.family))vault(gallery,top-.08,.65);else gable(gallery,top,.55+variant*.13);}
  }
  baseY=top;
 }
 if(levels.length&&p.finished){
  const entry=Math.min(w*.3,2.7),height=Math.min(2.7,levels[0].height-.15);box('glass',w/2,height/2,.015,entry*.6,height,.09,p.doorColor??'#365461');box('trim',w/2,height+.15,.45,Math.min(w*.5,4),.18,.9,colors.wood);
  for(const x of [w/2-entry*.6,w/2+entry*.6])column(x,height/2,.45,.065,height);
  if(['school','university'].includes(p.family)){box('trim',w/2,total+.6,d*.25,w*.23,.9,d*.16,colors.stone);if(p.roofPaid)gable({x:w*.365,z:d*.17,width:w*.27,depth:d*.2},total+1.05,.55);}
  if(['clinic','hospital'].includes(p.family)){box('trim',w*.79,2.1,.035,.68,.17,.08,'#609a87');box('trim',w*.79,2.1,.035,.17,.68,.09,'#609a87');box('roof',w*.23,2.2,.6,w*.3,.18,1.2,'#6b91a4');}
  if(p.family==='museum'||p.family==='university'||p.family==='palace'){const radius=Math.min(w*.19,d*.18),rise=Math.min(1.5,radius*.55);if(p.roofPaid){const dome=new SphereGeometry(1,p.low?8:20,p.low?4:10,0,Math.PI*2,0,Math.PI/2);dome.scale(radius,rise,radius);add('roof',dome,colors.roof,w/2,total+.2,d*.52);}for(const x of [w*.18,w*.32,w*.68,w*.82])column(x,1.25,.25,.1,2.5);}
  if(p.family==='palace'){for(const side of [-1,1]){const x=w/2+side*w*.37;add('wall',new CylinderGeometry(w*.105,w*.12,total+.7,p.low?8:14),colors.stone,x,(total+.7)/2,d*.22);if(p.roofPaid)add('roof',new CylinderGeometry(0,w*.135,.8,p.low?8:14),colors.roof,x,total+1.1,d*.22);}}
  if(p.family==='mall'){const rr=Math.min(w*.16,d*.2);add('glass',new CylinderGeometry(rr,rr,Math.min(3.2,total),p.low?10:24,1,false,Math.PI/2,Math.PI),colors.glass,w/2,Math.min(3.2,total)/2,d*.24);}
  if(p.family==='office'&&!p.low){for(const side of [-1,1])box('trim',w/2+side*w*.34,total*.5,.025,.12,total*.9,.1,colors.wood,side*.12);}
  if(p.family==='resort'&&p.roofPaid){for(let slat=0;slat<(p.low?4:10);slat++)box('trim',w/2,total+.2,d*(slat+.5)/(p.low?4:10),w*.2,.12,.1,colors.wood);}
  if(p.family==='restaurant'&&!p.low)for(const x of [w*.16,w*.84]){column(x,.45,.7,.045,.9,colors.wood);box('trim',x,.9,.7,.7,.07,.55,colors.wood);}
 }
 const merge=(list:BufferGeometry[])=>{if(!list.length){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([],3));return g;}const g=mergeGeometries(list)!;list.forEach(v=>v.dispose());g.computeBoundingBox();g.computeBoundingSphere();return g;};
 return {wall:merge(parts.wall),roof:merge(parts.roof),glass:merge(parts.glass),trim:merge(parts.trim)};
}
