export const READY={crouch:3,fx:11,fy:-21,bx:9,by:-21,ffx:7,fbx:-7};
// RUN_1..4 copied verbatim from status/haste.js at the pinned source commit.
const RUN={turn:.25,lean:4};
export const RUN_POSES=[
 {...RUN,crouch:3,ffx:12,ffy:-5,fbx:-10,fby:-8,toeB:true,fx:-7,fy:-19,bx:12,by:-27},
 {...RUN,crouch:1,ffx:4,ffy:-8,fbx:-1,fby:-5,fx:3,fy:-18,bx:5,by:-19},
 {...RUN,crouch:3,ffx:-10,ffy:-8,toeF:true,fbx:12,fby:-5,fx:14,fy:-27,bx:-5,by:-19},
 {...RUN,crouch:1,ffx:-1,ffy:-5,fbx:4,fby:-8,fx:5,fy:-19,bx:3,by:-18},
];
export const CHECK_POSES=[
 {name:'STAND',pose:{}},
 {name:'ARMS UP',pose:{fx:-8,fy:-40,bx:9,by:-39,ffx:-3,fbx:5,crouch:1}},
 {name:'CROUCH',pose:{...READY,crouch:10,lean:3,fy:-15,by:-15}},
 {name:'SPELL HOLD',pose:{...READY,x:-3,crouch:4,lean:2,fx:18,fy:-22,bx:11,by:-17,ffx:10,fbx:-8}},
 {name:'RUN A',pose:RUN_POSES[0]},
 {name:'RUN B',pose:RUN_POSES[2]},
 {name:'TURN',pose:{yaw:Math.PI/2}},
 {name:'BACK',pose:{yaw:Math.PI}},
];
