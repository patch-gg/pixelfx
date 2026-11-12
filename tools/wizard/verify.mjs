import assert from 'node:assert/strict';
import {skeleton as originalSkeleton} from '../../src/core/rig.js';
import {skeleton,posed,posedParts,wizardSkinState,wizardBindingInfo} from '../../src/core/rig-wizard.js';
import {CHECK_POSES,RUN_POSES} from './poses.mjs';
let frames=0;
for(const {name,pose} of CHECK_POSES){
 assert.deepEqual(skeleton(pose),originalSkeleton(pose),'Original skeleton changed: '+name);
 const j=skeleton(pose).joints;
 for(const side of ['N','F'])for(const [a,b,L] of [['shoulder','elbow',7.6],['elbow','hand',7.4],['hip','knee',8.6],['knee','ankle',8.3]])
  assert.ok(Math.abs(Math.hypot(...j[a+side].map((v,i)=>v-j[b+side][i]))-L)<1e-6,`${name}: ${a}${side}-${b}${side}`);
 const s=wizardSkinState(pose);assert.ok(s.points.every(p=>p.every(Number.isFinite)));
 const px=posed(pose);assert.ok(px.n>100&&px.n<2500);assert.ok(px.x0>-80&&px.x1<80&&px.y0>-90&&px.y1<60);
 frames++;
}
const rest=wizardSkinState({});let maxRestError=0;
for(let i=0;i<rest.mesh.vertices.length;i++){
 const v=rest.mesh.vertices[i];assert.ok(Math.abs(v.bind.reduce((n,b)=>n+b.weight,0)-1)<1e-9);
 maxRestError=Math.max(maxRestError,Math.hypot(...rest.points[i].map((n,k)=>n-v.rest[k])));
}
assert.ok(maxRestError<1e-9);
// Hood remains a rigid head attachment; belt remains a rigid pelvis attachment.
for(const t of rest.mesh.triangles)if(t.part===28||t.part===29){
 const bone=t.part===28?'head':'pelvis';
 for(const id of t.v)assert.deepEqual(rest.mesh.vertices[id].bind.map(v=>[v.bone,v.weight]),[[bone,1]]);
}
assert.ok(rest.mesh.triangles.some(t=>t.material==='void'));
const parts=posedParts({});
for(const name of ['robe','nearSleeve','farSleeve','hood','belt'])assert.ok(parts.some(p=>p.name===name&&p.n>0),'Missing garment part: '+name);
assert.ok(!parts.some(p=>p.name==='face'||p.name==='head'),'Stock face/head must be hidden');
for(let i=0;i<120;i++){
 const a=RUN_POSES[Math.floor(i/3)%4];
 const p={...a,crouch:(a.crouch??0)+Math.sin(i*.1)*.2};
 assert.ok(wizardSkinState(p).points.every(p=>p.every(Number.isFinite)));frames++;
}
console.log(JSON.stringify({checks:'passed',poses:frames,rest_error:maxRestError,...wizardBindingInfo()},null,2));
