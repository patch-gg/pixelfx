// Cloth geometry bound to the *actual* original pixelfx bone frames.
// Coordinates are x right, y up, z towards viewer, as in rig.js.
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mv=(m,p)=>[m[0]*p[0]+m[1]*p[1]+m[2]*p[2],m[3]*p[0]+m[4]*p[1]+m[5]*p[2],m[6]*p[0]+m[7]*p[1]+m[8]*p[2]];
const tv=(m,p)=>[m[0]*p[0]+m[3]*p[1]+m[6]*p[2],m[1]*p[0]+m[4]*p[1]+m[7]*p[2],m[2]*p[0]+m[5]*p[1]+m[8]*p[2]];
const transform=(f,p)=>add(f.t,mv(f.R,p));
const mix=(a,b,u)=>a.map((x,i)=>x+(b[i]-x)*u);
const PART={robe:25,nearSleeve:26,farSleeve:27,hood:28,belt:29};
export const WIZARD_BINDINGS={
 hood:['head'],cowl:['chest','neck'],torso:['chest','waist','pelvis'],belt:['pelvis'],
 nearSleeve:['upperN','foreN'],farSleeve:['upperF','foreF'],
 skirt:['pelvis (pinned waist)','free cloth particles (leg collision)'],
};
export function createWizardSkin(rest){
 const vertices=[],triangles=[];
 const vertex=(world,weights)=>{
  const sum=Object.values(weights).reduce((a,b)=>a+b,0);
  if(Math.abs(sum-1)>1e-9)throw Error('Skin weights must sum to one');
  const bind=Object.entries(weights).filter(([,w])=>w>0).map(([bone,weight])=>({bone,weight,local:tv(rest[bone].R,sub(world,rest[bone].t))}));
  vertices.push({rest:world,bind});return vertices.length-1;
 };
 const connect=(a,b,part,material='cloth',choose=null)=>{
  for(let i=0;i<a.length;i++){
   const n=(i+1)%a.length;
   const mat=choose?choose(i):material;
   triangles.push({v:[a[i],b[n],b[i]],part,material:mat});
   triangles.push({v:[a[i],a[n],b[n]],part,material:mat});
  }
 };
 const ring=(bone,local,r0,r1,weights,n=16,axis='y')=>Array.from({length:n},(_,i)=>{
  const t=i/n*Math.PI*2,c=Math.cos(t),s=Math.sin(t);
  const q=axis==='y'?[local[0]+r0*c,local[1],local[2]+r1*s]:[local[0],local[1]+r0*c,local[2]+r1*s];
  return vertex(transform(rest[bone],q),typeof weights==='function'?weights(t):weights);
 });
 // Cowl and torso use several rings so chest bending does not move the belt.
 const torso=[
  ring('neck',[0,0,0],1.8,2.2,{neck:.55,chest:.45}),
  ring('chest',[0,2.7,0],3.4,5.9,{chest:1}),
  ring('chest',[0,-1.5,0],3.8,5.4,{chest:.85,waist:.15}),
  ring('waist',[0,0,0],3.4,4.6,{chest:.2,waist:.8}),
  ring('pelvis',[0,0,0],3.8,4.8,{pelvis:1}),
 ];
 for(let i=0;i<torso.length-1;i++)connect(torso[i],torso[i+1],PART.robe);
 // Belt stays rigidly on pelvis, independent of arms and lower-leg motion.
 connect(ring('pelvis',[0,.6,0],3.95,4.95,{pelvis:1}),ring('pelvis',[0,-.2,0],3.95,4.95,{pelvis:1}),PART.belt,'gold');
 // Only the waist is pinned. Lower rows are *not* skinned to the shins.
 // The simulator uses these rest rings as a free particle cloth mesh.
 const skirt=[torso.at(-1)];
 for(let row=1;row<=9;row++){
  const u=row/9;
  skirt.push(ring('pelvis',[0,-17.8*u,0],3.8+3.6*u,4.8+3*u,{pelvis:1}));
 }
 for(let i=0;i<skirt.length-1;i++)connect(skirt[i],skirt[i+1],PART.robe);
 // The last band is the gold hem, part of the same physical fabric.
 for(const t of triangles)if(t.part===PART.robe&&t.v.every(i=>skirt.at(-1).includes(i)||skirt.at(-2).includes(i)))t.material='gold';
 // Continuous shoulder/elbow/wrist tubes. The elbow ring is shared by both bones.
 for(const [suffix,part] of [['N',PART.nearSleeve],['F',PART.farSleeve]]){
  const upper='upper'+suffix,fore='fore'+suffix;
  const rings=[
   ring(upper,[0,0,0],2.95,2.95,{[upper]:1},12,'x'),
   ring(upper,[4.1,0,0],2.65,2.65,{[upper]:1},12,'x'),
   ring(fore,[0,0,0],2.6,2.6,{[upper]:.5,[fore]:.5},12,'x'),
   ring(fore,[4,0,0],2.8,2.8,{[fore]:1},12,'x'),
   ring(fore,[6.4,0,0],2.25,2.25,{[fore]:1},12,'x'),
  ];
  for(let i=0;i<rings.length-1;i++)connect(rings[i],rings[i+1],part);
  connect(rings.at(-1),ring(fore,[7,0,0],2.25,2.25,{[fore]:1},12,'x'),part,'gold');
  // Shoulder end cap hides the stock dummy underneath the garment.
  const center=vertex(transform(rest[upper],[0,0,0]),{[upper]:1});
  for(let i=0;i<12;i++)triangles.push({v:[center,rings[0][(i+1)%12],rings[0][i]],part,material:'cloth'});
 }
 // Hood is rigidly attached to the head; the front opening is black surface.
 // There is no face/eye layer anywhere in this mesh.
 const hood=[
  ring('head',[-.2,-3.6,0],3.55,3.4,{head:1}),
  ring('head',[0,-1.7,0],4,3.6,{head:1}),
  ring('head',[-.3,1.4,0],4,3.55,{head:1}),
  ring('head',[-.7,3.3,0],2.9,2.8,{head:1}),
  ring('head',[-1.2,4.7,0],.15,.15,{head:1}),
 ];
 for(let row=0;row<hood.length-1;row++)connect(hood[row],hood[row+1],PART.hood,'cloth',(i)=>{
  const c=Math.cos((i+.5)/16*Math.PI*2);
  return row===1&&c>.38?'void':'cloth';
 });
 // A bent wizard-hat crown and brim over the dark hood opening.
 // All vertices stay in the same rigid head binding as the hood.
 const hat=[
  ring('head',[0,1.45,0],4.25,3.8,{head:1}),
  ring('head',[-.45,4.25,0],3.2,2.95,{head:1}),
  ring('head',[-1.35,6.6,0],1.85,1.8,{head:1}),
  ring('head',[-2.65,8.35,0],.8,.8,{head:1}),
  ring('head',[-4.05,8.9,0],.1,.1,{head:1}),
 ];
 for(let i=0;i<hat.length-1;i++)connect(hat[i],hat[i+1],PART.hood);
 // Shallow brim has a visible thickness and stays clear of the face void.
 const brimInner=ring('head',[0,1.35,0],4.05,3.6,{head:1});
 const brimOuter=ring('head',[.15,.8,0],6.2,5.2,{head:1});
 const brimLip=ring('head',[.15,.35,0],6.05,5.05,{head:1});
 connect(brimInner,brimOuter,PART.hood);
 connect(brimOuter,brimLip,PART.hood);
 connect(brimLip,brimInner,PART.hood);
 // Restrained gold hatband, matching the robe's belt and hem.
 connect(ring('head',[-.03,1.55,0],4.28,3.83,{head:1}),ring('head',[-.14,2.2,0],4.08,3.67,{head:1}),PART.hood,'gold');
 const mesh={vertices,triangles,bindings:WIZARD_BINDINGS,cloth:{rings:skirt,pinned:skirt[0],indices:skirt.flat()}};
 return mesh;
}
export function evaluateWizardSkin(mesh,frames){
 return mesh.vertices.map(v=>{
  const p=[0,0,0];
  for(const b of v.bind){const q=transform(frames[b.bone],b.local);for(let i=0;i<3;i++)p[i]+=q[i]*b.weight;}
  return p;
 });
}
export function skinDiagnostics(mesh,frames){
 const points=evaluateWizardSkin(mesh,frames);
 return {vertices:points.length,triangles:mesh.triangles.length,finite:points.every(p=>p.every(Number.isFinite)),maxRestError:Math.max(...points.map((p,i)=>Math.hypot(...sub(p,mesh.vertices[i].rest))))};
}
