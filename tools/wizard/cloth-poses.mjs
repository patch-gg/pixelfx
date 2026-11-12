// Small-stride locomotion designed for the robe, using unchanged original bones.
export function robeRun(t){
 const s=Math.sin(t*Math.PI*5),c=Math.cos(t*Math.PI*5);
 return {turn:.48,lean:1.1,crouch:.8+.45*(1-c*c),
  ffx:-2+3.5*s,fbx:3-3.5*s,ffy:-4-1.5*Math.max(0,c),fby:-4-1.5*Math.max(0,-c),
  fx:-3-2*s,fy:-16+.5*c,bx:5+2*s,by:-16-.5*c};
}
export function moveStop(t){
 const start=.6,stop=2.8,blend=.4;
 const speed=t<start?0:t<start+blend?(t-start)/blend:t<stop?1:t<stop+blend?1-(t-stop)/blend:0;
 const walk=robeRun(Math.min(t,stop+blend));
 const rest={turn:.48,lean:0,crouch:0,ffx:-2,fbx:3,ffy:-4,fby:-4,fx:-3,fy:-15,bx:5,by:-15};
 const pose={};for(const k of new Set([...Object.keys(rest),...Object.keys(walk)]))pose[k]=(rest[k]??0)+((walk[k]??0)-(rest[k]??0))*speed;
 // Integrated trapezoidal velocity, with finite acceleration and deceleration.
 let d=0;if(t>start){const u=t-start;if(u<blend)d=u*u/(2*blend);else if(t<stop)d=u-blend/2;else {const v=Math.min(blend,t-stop);d=stop-start-blend/2+v-v*v/(2*blend);}}
 return {...pose,x:d*14};
}
