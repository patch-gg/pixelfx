import json,zipfile,argparse
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets'/'wizard'
data=json.loads((OUT/'cloth-frames.json').read_text())
parser=argparse.ArgumentParser()
parser.add_argument('--debug-mesh',action='store_true',help='Explicit debug-only color overlay; not garment material.')
DEBUG_MESH=parser.parse_args().debug_mesh
W,H,OX,OY=64,64,30,54
def ui_font(size):
 for name in ['C:/Windows/Fonts/segoeui.ttf','DejaVuSans.ttf']:
  try:return ImageFont.truetype(name,size)
  except OSError:pass
 return ImageFont.load_default()
font=ui_font(17)
small=ui_font(14)
def render(raw):
 im=Image.new('RGBA',(W,H))
 for x,y,c in zip(raw['xs'],raw['ys'],raw['color']):
  assert 0<=OX+x<W and 0<=OY+y<H,(x,y)
  im.putpixel((OX+x,OY+y),(c&255,(c>>8)&255,(c>>16)&255,(c>>24)&255))
 return im
def mesh_overlay(f):
 im=render(f['cloth']);d=ImageDraw.Draw(im)
 p=lambda i:(round(OX+f['points'][i][0]),round(OY-f['points'][i][1]))
 for r in data['cloth']['rings']:
  d.line([p(i) for i in r]+[p(r[0])],fill='#7cb7bd',width=1)
 for a,b in zip(data['cloth']['rings'][:-1],data['cloth']['rings'][1:]):
  for i,j in zip(a,b):d.line([p(i),p(j)],fill='#6e979d',width=1)
 for i in data['cloth']['pinned']:d.point(p(i),fill='#ffc075')
 return im
boards=[];solo=[]
for f in data['frames']:
 panels=[(render(f['rigid']),'RIGID WAIST BIND'),(render(f['cloth']),'CLOTH PHYSICS')]
 if DEBUG_MESH:panels.append((mesh_overlay(f),'DEBUG MESH OVERLAY'))
 board=Image.new('RGB',(320*len(panels),405),'#1d2433');d=ImageDraw.Draw(board)
 d.fontmode='1'  # Keep exact swatch colors in the shared GIF palette.
 for i,(im,title) in enumerate(panels):
  d.text((i*320+53,18),title,font=font,fill='#e3d6b7')
  im=im.resize((320,320),Image.Resampling.NEAREST);board.paste(im,(i*320,56),im)
 phase='MOVE / INERTIA' if f['t']<3.2 else 'STOP / SETTLE'
 d.text((25,380),f"{phase}   {f['t']:.1f}s   |   purple robe / gold hem",font=small,fill='#aebcd2')
 boards.append(board);solo.append(render(f['cloth']))
dur=[80,90,80]*24
# Every frame uses the same exact palette. No per-frame adaptive recoloring.
board_colors=sorted({rgb for frame in boards for rgb in frame.getdata()})
assert len(board_colors)<=256,len(board_colors)
board_lut={rgb:i for i,rgb in enumerate(board_colors)}
board_palette=[c for rgb in board_colors for c in rgb];board_palette+=[0]*(768-len(board_palette))
indexed_boards=[]
for frame in boards:
 q=Image.new('P',frame.size);q.putpalette(board_palette);q.putdata([board_lut[rgb] for rgb in frame.getdata()]);indexed_boards.append(q)
preview_name='wizard-cloth-debug-mesh.gif' if DEBUG_MESH else 'wizard-cloth-physics-preview.gif'
indexed_boards[0].save(OUT/preview_name,save_all=True,append_images=indexed_boards[1:],duration=dur,loop=0,disposal=2,optimize=False)
# Verify that decoded GIF colors match the source RGB frames exactly.
gif=Image.open(OUT/preview_name);elapsed=0;starts=[sum(dur[:i]) for i in range(len(dur))]
for n in range(gif.n_frames):
 gif.seek(n);i=min(range(len(starts)),key=lambda j:abs(starts[j]-elapsed))
 assert gif.convert('RGB').tobytes()==boards[i].tobytes(),(n,i)
 elapsed+=gif.info['duration']
assert elapsed==6000,elapsed
# The six-second start/stop demo resets on replay; it is not an idle-loop asset.
colors=sorted({p[:3] for im in solo for p in im.getdata() if p[3]});pal=[0,0,0]+[v for c in colors for v in c];pal+=[0]*(768-len(pal));lut={c:i+1 for i,c in enumerate(colors)}
indexed=[]
for im in solo:
 q=Image.new('P',im.size);q.putpalette(pal);q.putdata([lut[p[:3]] if p[3] else 0 for p in im.getdata()]);indexed.append(q.resize((384,384),Image.Resampling.NEAREST))
indexed[0].save(OUT/'wizard-cloth-move-stop.gif',save_all=True,append_images=indexed[1:],duration=dur,loop=0,transparency=0,disposal=2,optimize=False)
sheet=Image.new('RGBA',(W*12,H*6))
for i,im in enumerate(solo):sheet.paste(im,((i%12)*W,(i//12)*H))
sheet.save(OUT/'wizard-cloth-demo-sheet.png')
board=Image.new('RGB',(960,390),'#1d2433');d=ImageDraw.Draw(board)
for n,i in enumerate([11,23,35,47]):
 f=data['frames'][i];im=render(f['cloth']).resize((256,256),Image.Resampling.NEAREST)
 board.paste(im,(n*240-8,75),im);d.text((n*240+60,32),f"{f['t']:.1f} sec",font=font,fill='#e3d6b7')
d.text((24,345),'Waist pinned / free hem / small-stride original skeleton / no face or eyes',font=small,fill='#aebcd2')
board.save(OUT/'wizard-cloth-keyframes.png')
print(json.dumps({'preview':str(OUT/'wizard-cloth-physics-preview.gif'),'frames':len(solo),'palette':len(colors),'summary':data['summary']}))
