import fs from 'node:fs';
import {createWizardCharacter,posed as rigid,wizardSkinState} from '../../src/core/rig-wizard.js';
import {moveStop} from './cloth-poses.mjs';
const pack=r=>({xs:Array.from(r.xs),ys:Array.from(r.ys),color:Array.from(r.color),bounds:[r.x0,r.y0,r.x1,r.y1]});
const actor=createWizardCharacter({wind:[19,0,7]});
const frames=[];let maxStretch=0,maxPenetration=0;
for(let i=0;i<720;i++){
 actor.update(1/120,moveStop);
 const state=actor.state();maxStretch=Math.max(maxStretch,state.diagnostics.maxStretch);maxPenetration=Math.max(maxPenetration,state.diagnostics.maxPenetration);
 if(i%10===9){
  const sk=wizardSkinState(state.pose);const points=sk.points.map(p=>p.slice());
  for(const [id,p] of state.points)points[id]=p.map((v,k)=>v-state.root[k]);
  frames.push({t:(i+1)/120,pose:state.pose,rigid:pack(rigid(state.pose)),cloth:pack(actor.pixels()),points,diagnostics:state.diagnostics});
 }
}
const mesh=actor.state().mesh;
fs.mkdirSync(new URL('../../assets/wizard',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../../assets/wizard/cloth-frames.json',import.meta.url),JSON.stringify({fps:12,seconds:6,frames,triangles:mesh.triangles,cloth:mesh.cloth,summary:{maxStretch,maxPenetration,final:actor.state().diagnostics}}));
console.log(JSON.stringify({frames:frames.length,maxStretch,maxPenetration,final:actor.state().diagnostics}));
