// Stateful XPBD cloth. Fixed 120 Hz, inverse-bind waist pins, stretch/shear/bend
// constraints, gravity, aerodynamic forcing, damping, capsule and floor contact.
// Units match the original rig (one rest-body pixel = one simulation unit).
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const len=v=>Math.hypot(...v);
const dist=(a,b)=>len(sub(a,b));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function capsuleDistance(p,c){
 const ab=sub(c.b,c.a),ap=sub(p,c.a),t=Math.max(0,Math.min(1,dot(ap,ab)/Math.max(1e-9,dot(ab,ab))));
 const q=c.a.map((v,i)=>v+ab[i]*t);return {q,d:dist(p,q),r:c.r};
}
export function createClothSimulation(mesh,initialTargets,options={}){
 const dt=1/120,iterations=options.iterations??12,floor=options.floor??1.65;
 const ids=mesh.cloth.indices,pins=new Set(mesh.cloth.pinned),rings=mesh.cloth.rings;
 const particles=new Map(ids.map(id=>[id,{p:initialTargets[id].slice(),old:initialTargets[id].slice(),w:pins.has(id)?0:1}]));
 const constraints=[],seen=new Set();
 const edge=(a,b,type)=>{
  const key=[a,b].sort((a,b)=>a-b).join(':');if(seen.has(key))return;seen.add(key);
  constraints.push({a,b,rest:dist(mesh.vertices[a].rest,mesh.vertices[b].rest),compliance:type==='bend'?.0008:type==='shear'?.000035:.000001,lambda:0,type});
 };
 for(let r=0;r<rings.length;r++)for(let i=0;i<rings[r].length;i++){
  const n=rings[r].length;edge(rings[r][i],rings[r][(i+1)%n],'stretch');edge(rings[r][i],rings[r][(i+2)%n],'bend');
  if(r+1<rings.length){edge(rings[r][i],rings[r+1][i],'stretch');edge(rings[r][i],rings[r+1][(i+1)%n],'shear');edge(rings[r][(i+1)%n],rings[r+1][i],'shear');}
  if(r+2<rings.length)edge(rings[r][i],rings[r+2][i],'bend');
 }
 let time=0,steps=0;
 const wind=options.wind??[11,0,4],damping=options.damping??3.8,gravity=options.gravity??70;
 const collide=(p,capsules)=>{
  for(const c of capsules){
   const {q,d,r}=capsuleDistance(p,c);if(d>=r)continue;
   let v=d>1e-7?sub(p,q).map(x=>x/d):[0,0,1];
   for(let k=0;k<3;k++)p[k]=q[k]+v[k]*(r+.002);
  }
  p[1]=Math.max(floor,p[1]);
 };
 const solveEdge=e=>{
  const a=particles.get(e.a),b=particles.get(e.b),v=sub(a.p,b.p),d=len(v),w=a.w+b.w;
  if(!w||d<1e-8)return;
  const alpha=e.compliance/(dt*dt),dl=(-(d-e.rest)-alpha*e.lambda)/(w+alpha);e.lambda+=dl;
  for(let k=0;k<3;k++){const q=v[k]/d*dl;a.p[k]+=q*a.w;b.p[k]-=q*b.w;}
 };
 const step=(targets,capsules,forceScale=1)=>{
  time+=dt;steps++;
  const damp=Math.exp(-damping*dt),gust=.72+.2*Math.sin(time*1.3)+.08*Math.sin(time*3.7);
  for(const id of ids){const a=particles.get(id);
   if(!a.w){a.p=targets[id].slice();a.old=a.p.slice();continue;}
   const prior=a.p.slice(),vel=sub(a.p,a.old),speed=len(vel),cap=1.5;
   if(speed>cap)for(let k=0;k<3;k++)vel[k]*=cap/speed;
   const flow=typeof wind==='function'?wind(time):wind;
   const force=[flow[0]*gust*forceScale,flow[1]*gust*forceScale-gravity,flow[2]*gust*forceScale];
   for(let k=0;k<3;k++)a.p[k]+=vel[k]*damp+force[k]*dt*dt;
   a.old=prior;
  }
  for(const e of constraints)e.lambda=0;
  for(let it=0;it<iterations;it++){
   for(const e of constraints)solveEdge(e);
   for(const id of ids){const a=particles.get(id);if(a.w)collide(a.p,capsules);}
  }
  for(const id of ids){const a=particles.get(id);if(!a.w)continue;
   // Hard final projection leaves no particle inside a leg or below the floor.
   for(let pass=0;pass<3;pass++)collide(a.p,capsules);
   if(a.p[1]<=floor+.01){a.old[0]=a.p[0]-(a.p[0]-a.old[0])*.65;a.old[2]=a.p[2]-(a.p[2]-a.old[2])*.65;a.old[1]=Math.min(a.old[1],a.p[1]);}
  }
 };
 const positions=()=>new Map(ids.map(id=>[id,particles.get(id).p.slice()]));
 const diagnostics=(targets,capsules)=>{
  let penetration=0,below=0,stretch=0,pinError=0;
  for(const [id,a] of particles){
   if(!a.w){pinError=Math.max(pinError,dist(a.p,targets[id]));continue;}
   below=Math.max(below,floor-a.p[1]);
   for(const c of capsules){const s=capsuleDistance(a.p,c);penetration=Math.max(penetration,s.r-s.d);}
  }
  for(const e of constraints)if(e.type==='stretch')stretch=Math.max(stretch,dist(particles.get(e.a).p,particles.get(e.b).p)/e.rest-1);
  return {steps,time,particles:particles.size,constraints:constraints.length,maxPenetration:penetration,maxBelowFloor:below,maxStretch:stretch,maxPinError:pinError,finite:[...particles.values()].every(a=>a.p.every(Number.isFinite))};
 };
 return {step,positions,diagnostics,dt,reset(targets){for(const [id,a] of particles){a.p=targets[id].slice();a.old=a.p.slice();}time=0;steps=0;}};
}
