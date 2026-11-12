import fs from 'node:fs';
const root=new URL('../../',import.meta.url);
let source=fs.readFileSync(new URL('src/core/rig.js',root),'utf8').replace(/\r\n/g,'\n');
const replaceOnce=(old,value)=>{if(source.split(old).length!==2)throw Error('Unexpected original rig source: '+old.slice(0,55));source=source.replace(old,value);};
source='import {createClothSimulation} from "./wizard-cloth.js";\nimport {createWizardSkin,evaluateWizardSkin} from "./wizard-skin.js";\nlet activeWizardPoints=null;\n'+source;
replaceOnce('offWeapon: 24 };','offWeapon: 24, robe: 25, nearSleeve: 26, farSleeve: 27, hood: 28, belt: 29 };');
replaceOnce('  void turn;\n}', '  drawWizardClothing(S);\n  void turn;\n}');
// Head/face geometry is fully replaced by the bound hood.
replaceOnce('  ellipsoid(F_("head").t, F_("head").R, [3, 3.3, 2.8], PART.head, 0);','  // Stock head hidden beneath wizard hood.');
replaceOnce('  ellipsoid(add(F_("head").t, mv(F_("head").R, [0.85, -0.45, 0])), F_("head").R, [2.4, 2.7, 2.35], PART.face, 0);','  // No stock face or eyes.');
// Hide the stock surfaces inside the garment, retaining only gloves and boots.
// The original solver/bone dimensions remain completely unchanged.
for(const line of [
 '  ellipsoid(add(F_("pelvis").t, mv(F_("pelvis").R, [0, -0.2, 0])), F_("pelvis").R, [2.9, 2.6, 4.2], PART.pelvis, 0);',
 '  sweep(F_("pelvis").t, F_("chest").t, 3, 3.3, PART.waist, 1);',
 '  ellipsoid(add(F_("chest").t, mv(F_("chest").R, [0.2, 0.9, 0])), F_("chest").R, [3.4, 4.2, 5.5], PART.chest, 0);',
 '  sweep(F_("neck").t, add(F_("neck").t, mv(F_("head").R, [0, 1.6, 0])), 1.25, 1.15, PART.neck, 1);',
 '    sphere(sh, 2.5, up, 0);',
 '    sweep(sh, A.joint, 2.1, 1.6, up, 0);',
 '    sphere(A.joint, 1.45, el, 1);',
 '    sweep(A.joint, A.end, 1.6, 1.2, fo, 0, 0.15);',
 '    sweep(hip, L.joint, 3.2, 2.2, th, 0);',
 '    sphere(L.joint, 1.9, kn, 1);',
 '    sweep(L.joint, L.end, 2.15, 1.4, sh, 0, 0.4);',
])replaceOnce(line,'  // Covered stock body surface omitted.');
replaceOnce('REST_FRAMES = solve({}).B;','REST_FRAMES = solve({}).B;\nconst WIZARD_MESH=createWizardSkin(REST_FRAMES);');
replaceOnce('  // where two parts meet: a soft seam if they touch, ink if one stands in front of the other',
 '  // Dark cloth/leather shoes replace the stock bright grey boot surface.\n  const bootRamp=["#8f7962","#6b5b50","#4e4450","#302a39"].map(hex);\n  for(const i of touched)if(Part[i]===PART.footN||Part[i]===PART.footF)Col[i]=bootRamp[tones.get(i)??2];\n  // where two parts meet: a soft seam if they touch, ink if one stands in front of the other');
source+='\n'+fs.readFileSync(new URL('tools/wizard/wizard-render-extension.txt',root),'utf8');
fs.writeFileSync(new URL('src/core/rig-wizard.js',root),source);
console.log('Built rig-wizard.js from unchanged original rig.js');
