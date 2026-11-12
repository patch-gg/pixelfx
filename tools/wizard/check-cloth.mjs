import assert from 'node:assert/strict';
import {createWizardCharacter} from '../../src/core/rig-wizard.js';
import {moveStop} from './cloth-poses.mjs';
const a=createWizardCharacter({wind:[10,0,5]});
for(let i=0;i<360;i++)a.update(1/60,moveStop);
console.log(JSON.stringify(a.state().diagnostics));
assert.ok(a.state().diagnostics.finite);
const diag=a.state().diagnostics;
assert.equal(diag.maxPinError,0);
assert.equal(diag.maxBelowFloor,0);
assert.ok(diag.maxPenetration<.015);
assert.ok(diag.maxStretch<.4);
// A shared 120-Hz pose sampler must make display refresh rate irrelevant.
const samples=[];
for(const fps of [30,60,120]){
 const c=createWizardCharacter({wind:[10,0,5]});
 for(let i=0;i<fps*2;i++)c.update(1/fps,moveStop);
 samples.push([...c.state().points.values()]);
}
for(let n=1;n<samples.length;n++)for(let i=0;i<samples[0].length;i++)for(let k=0;k<3;k++)assert.ok(Math.abs(samples[0][i][k]-samples[n][i][k])<1e-9);
// Wind affects the free fabric while the waist remains pinned.
const calm=createWizardCharacter({wind:[0,0,0]}),windy=createWizardCharacter({wind:[40,0,15]});
for(let i=0;i<180;i++){calm.update(1/60,{});windy.update(1/60,{});}
let windDifference=0;
const s0=calm.state(),s1=windy.state();
for(const [id,p] of s0.points)windDifference=Math.max(windDifference,Math.hypot(...p.map((v,k)=>v-s1.points.get(id)[k])));
assert.ok(windDifference>.1,'Wind did not move cloth');
// Stop the forcing; the fabric should dissipate motion rather than gain energy.
const settle=createWizardCharacter({wind:t=>t<1?[45,0,20]:[0,0,0]});
let previous=null,early=0,late=0;
for(let i=0;i<600;i++){
 settle.update(1/60,{});const points=[...settle.state().points.values()];
 if(previous){const motion=points.reduce((sum,p,j)=>sum+p.reduce((s,v,k)=>s+(v-previous[j][k])**2,0),0)/points.length;if(i>60&&i<120)early+=motion;if(i>540)late+=motion;}
 previous=points;
}
assert.ok(late<early*.3,{early,late});
// Each actor owns its simulation. Updating one must never mutate another.
const frozen=[...calm.state().points.values()].map(p=>p.slice());
for(let i=0;i<30;i++)windy.update(1/60,moveStop);
assert.deepEqual([...calm.state().points.values()],frozen);
// Rendering is repeatable and bypasses the old pose-only image cache.
const p0=a.pixels(),p1=a.pixels();assert.deepEqual(Array.from(p0.color),Array.from(p1.color));
assert.ok(p0.n>200&&p0.x0>-64&&p0.x1<64&&p0.y0>-70&&p0.y1<20);
console.log(JSON.stringify({fixed_timestep:'30/60/120 fps identical',windDifference,settlingEnergy:{early,late},instanceIsolation:'passed',floorAndLegContact:'passed'}));
