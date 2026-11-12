// Character actions, no staff. Original skeleton and its fixed bone lengths.
export const IDLE_SECONDS=4,CAST_SECONDS=4,FPS=12,RELEASE_TIME=1.75;
const REST={turn:.48,lean:0,crouch:0,ffx:-2,fbx:3,ffy:-4,fby:-4,fx:-3,fy:-15,bx:5,by:-15};
export function idlePose(t){
 const c=(1-Math.cos(t/IDLE_SECONDS*Math.PI*2))/2;
 return {...REST,crouch:.55*c,fx:-3-.2*c,fy:-15+.55*c,bx:5+.15*c,by:-15+.55*c,hy:.05*c};
}
export const CAST_KEYS=[
 [0,REST],
 [.25,{...REST,crouch:.45,lean:-.25,fx:2,fy:-20,bx:6,by:-21}],
 [.65,{...REST,crouch:1,lean:-.5,fx:9,fy:-27,bx:11,by:-25}],
 [1.25,{...REST,crouch:1.35,lean:-.8,fx:10,fy:-28,bx:12,by:-26}],
 [1.6,{...REST,crouch:1.1,lean:-1.3,fx:8,fy:-29,bx:11,by:-26}],
 [RELEASE_TIME,{...REST,crouch:1.5,lean:1.7,fx:20,fy:-26,bx:8,by:-23,ffx:0}],
 [2,{...REST,crouch:1.8,lean:2,fx:21,fy:-25,bx:7,by:-22,ffx:0}],
 [2.4,{...REST,crouch:.9,lean:.7,fx:14,fy:-23,bx:6,by:-20}],
 [3.05,{...REST,crouch:.3,fx:-1,fy:-17,bx:5,by:-16}],
 [3.5,REST],
 [CAST_SECONDS,REST],
];
export function castPose(t){
 if(t<=0)return {...REST};if(t>=CAST_SECONDS)return {...REST};
 for(let i=0;i<CAST_KEYS.length-1;i++){
  const [a,p]=CAST_KEYS[i],[b,q]=CAST_KEYS[i+1];if(t>=b)continue;
  const u=(t-a)/(b-a),e=u*u*(3-2*u),out={};
  for(const k of Object.keys(REST))out[k]=(p[k]??REST[k])+((q[k]??REST[k])-(p[k]??REST[k]))*e;
  return out;
 }
 return {...REST};
}
export const CAST_EVENTS={windup:0,charge:.5,release:RELEASE_TIME,recovery:2.1,ready:3.5,end:CAST_SECONDS};
