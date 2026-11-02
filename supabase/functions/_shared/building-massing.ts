/** Forecourts and terraces are part of a new paid plan, never changes to an old plan. */
export function buildingSetbacks(kind:string,depth:number,style:'forest'|'coastal'|'desert'='forest'){
 const rows:Record<string,[number,number,number,number]>={house:[.2,0,0,.12],villa:[0,.3,.18,0],apartment:[.1,.2,0,.08],palace:[.2,.2,0,0],restaurant:[.25,0,0,.12],mall:[.06,.12,.16,.28],hotel:[.12,.28,0,.12],resort:[.25,.08,.08,.22],school:[.12,.12,0,.12],university:[.22,.35,0,0],clinic:[.28,0,0,.1],hospital:[.08,.2,.1,0],garage:[0,0,0,0],museum:[.25,.25,0,0],office:[.1,.3,0,.08]};
 const [lf,rf,lb,rb]=rows[kind]??[0,0,0,0];
 if(style==='desert'&&kind!=='garage'&&!kind.startsWith('tower_'))return {leftFront:depth*.3,rightFront:depth*.3,leftBack:depth*.04,rightBack:0};
 const factor=style==='coastal'?1.18:1;return {leftFront:lf*depth*factor,rightFront:rf*depth*factor,leftBack:lb*depth*factor,rightBack:rb*depth*factor};
}
