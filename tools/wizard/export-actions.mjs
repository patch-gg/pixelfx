import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createWizardCharacter,skeleton} from '../../src/core/rig-wizard.js';
import {idlePose,castPose,IDLE_SECONDS,CAST_SECONDS,FPS,CAST_EVENTS,RELEASE_TIME} from './wizard-actions.mjs';
const out=new URL('../../assets/wizard/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const pack=r=>({xs:Array.from(r.xs),ys:Array.from(r.ys),color:Array.from(r.color),bounds:[r.x0,r.y0,r.x1,r.y1]});
const sample=(actor,t)=>{
 const state=actor.state(),j=skeleton(state.pose).joints,d=state.diagnostics;
 assert.ok(d.finite&&d.maxPinError<1e-9&&d.maxBelowFloor<1e-9);
 return {t,pose:state.pose,body:pack(actor.pixels()),hands:{near:j.handN,far:j.handF},diagnostics:d};
};
// Warm through four full breathing cycles to reach a repeatable cloth cycle.
const idleActor=createWizardCharacter({initialPose:idlePose(0),wind:[0,0,0]});
for(let i=0;i<4*IDLE_SECONDS*120;i++)idleActor.update(1/120,idlePose);
const idle=[];
for(let i=0;i<IDLE_SECONDS*FPS;i++){
 idle.push(sample(idleActor,i/FPS));
 for(let j=0;j<120/FPS;j++)idleActor.update(1/120,idlePose);
}
const idleEndpoint=sample(idleActor,IDLE_SECONDS);
// Pre-settle the same robe in the ready stance, then run the entire cast once.
const castActor=createWizardCharacter({initialPose:castPose(0),wind:[0,0,0]});
for(let i=0;i<360;i++)castActor.update(1/120,castPose(0));
const cast=[];
for(let i=0;i<CAST_SECONDS*FPS;i++){
 cast.push(sample(castActor,i/FPS));
 for(let j=0;j<120/FPS;j++)castActor.update(1/120,castPose((i+(j+1)/(120/FPS))/FPS));
}
assert.deepEqual(castPose(0),castPose(CAST_SECONDS));
assert.equal(CAST_EVENTS.release*FPS,21);
const releaseHand=skeleton(castPose(RELEASE_TIME)).joints.handN;
fs.writeFileSync(new URL('actions-frames.json',out),JSON.stringify({fps:FPS,idle,cast,idleEndpoint,releaseHand,events:CAST_EVENTS,bodySize:[64,64],bodyOrigin:[30,54],effectSize:[128,80],effectOrigin:[40,61]}));
console.log(JSON.stringify({idleFrames:idle.length,castFrames:cast.length,releaseFrame:21,idleDuration:IDLE_SECONDS,castDuration:CAST_SECONDS,headBoundHat:true,noStaff:true}));
