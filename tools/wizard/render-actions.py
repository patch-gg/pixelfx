import json,math,random,zipfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets'/'wizard'
D=json.loads((OUT/'actions-frames.json').read_text());FPS=D['fps']
BODY_SIZE=tuple(D['bodySize']);BO=tuple(D['bodyOrigin']);FX_SIZE=tuple(D['effectSize']);FO=tuple(D['effectOrigin'])
def body(raw):
 im=Image.new('RGBA',BODY_SIZE)
 for x,y,c in zip(raw['xs'],raw['ys'],raw['color']):
  assert 0<=BO[0]+x<BODY_SIZE[0] and 0<=BO[1]+y<BODY_SIZE[1],(x,y)
  im.putpixel((BO[0]+x,BO[1]+y),(c&255,(c>>8)&255,(c>>16)&255,(c>>24)&255))
 return im
def center_body(im):
 out=Image.new('RGBA',FX_SIZE);out.alpha_composite(im,(FO[0]-BO[0],FO[1]-BO[1]));return out
VIOLET='#7853a5';LIGHT='#b39be1';GOLD='#d8bb79';CREAM='#fff1cb';DARK='#4c326b'
BAYER=((0,8,2,10),(12,4,14,6),(3,11,1,9),(15,7,13,5))
rng=random.Random(2917);motes=[(rng.random()*math.tau,rng.random(),rng.uniform(.6,1.2)) for _ in range(17)]
def fx(f):
 back=Image.new('RGBA',FX_SIZE);front=Image.new('RGBA',FX_SIZE)
 t=f['t'];near=f['hands']['near'];far=f['hands']['far']
 def pixel(im,x,y,col,alpha=1):
  x=round(FO[0]+x);y=round(FO[1]+y)
  if 0<=x<FX_SIZE[0] and 0<=y<FX_SIZE[1] and alpha*16>BAYER[y%4][x%4]:im.putpixel((x,y),tuple(bytes.fromhex(col[1:]))+(255,))
 def circle(im,x,y,r,col,alpha=1,filled=True):
  for yy in range(math.floor(y-r),math.ceil(y+r)+1):
   for xx in range(math.floor(x-r),math.ceil(x+r)+1):
    ds=(xx-x)**2+(yy-y)**2
    if ds<=r*r and (filled or ds>max(0,r-1)**2):pixel(im,xx,yy,col,alpha)
 def star(im,x,y,col,size=1,alpha=1):
  pixel(im,x,y,col,alpha)
  for i in range(1,size+1):
   for dx,dy in [(i,0),(-i,0),(0,i),(0,-i)]:pixel(im,x+dx,y+dy,col,alpha)
 if .5<=t<1.75:
  u=(t-.5)/1.25;x=(near[0]+far[0])/2+1;y=(near[1]+far[1])/2-1
  r=1+3*u
  circle(back,x,y,r+3,VIOLET,.3+.4*u,False)
  for a,phase,speed in motes:
   q=(t*speed+phase)%1;rr=r+2+(1-q)*10;ang=a+t*1.6
   px=x+math.cos(ang)*rr;py=y+math.sin(ang)*rr*.7
   star(back,px,py,GOLD if phase>.6 else LIGHT,size=0,alpha=(.3+.7*q)*min(1,u*4))
  circle(front,x,y,r+.8,DARK);circle(front,x-.4,y-.3,r,VIOLET)
  circle(front,x-.5,y-.5,max(1,r*.7),LIGHT)
  circle(front,x-.5,y-.8,max(.5,r*.3),CREAM)
  if u>.35:
   for j in range(3):
    ang=t*2.3+j*math.tau/3
    star(front,x+math.cos(ang)*(r+2),y+math.sin(ang)*(r+2)*.6,GOLD,size=0)
 age=t-1.75
 if 0<=age<.63:
  hx,hy=D['releaseHand'][:2];x=hx+2+95*age;y=hy-1-1.4*math.sin(age*math.pi/.63)
  fade=min(1,(.63-age)/.17)
  for j in range(13,0,-1):
   circle(front,x-j,y+.25*math.sin(j*.6+t*6),max(.6,2.7-j*.13),VIOLET if j>5 else LIGHT,fade*(1-j/15))
  circle(front,x,y,4,DARK,fade)
  circle(front,x-.5,y,3.1,VIOLET,fade);circle(front,x-1,y-.4,2.1,LIGHT,fade)
  circle(front,x-.3,y-.8,1.25,CREAM,fade)
  if age<.2:
   rr=2+age*25
   circle(front,hx+1,hy,rr,GOLD,(1-age/.2)*.8,False)
   star(front,hx+1,hy,CREAM,size=2,alpha=1-age/.2)
  for j,(a,phase,speed) in enumerate(motes[:10]):
   life=.25+phase*.3
   if age<life:
    px=hx+1+age*(10+phase*27);py=hy+age*math.sin(a)*24+age*age*10
    pixel(back,px,py,GOLD if j%3==0 else LIGHT,1-age/life)
 return back,front
idle=[body(f['body']) for f in D['idle']]
cast_body=[body(f['body']) for f in D['cast']]
spell=[];cast_full=[]
for f,b in zip(D['cast'],cast_body):
 back,front=fx(f);eff=back.copy();eff.alpha_composite(front);spell.append(eff)
 full=back.copy();full.alpha_composite(center_body(b));full.alpha_composite(front);cast_full.append(full)

def save_gif(frames,path,scale=1,repeat=True):
 colors=sorted({p[:3] for im in frames for p in im.getdata() if p[3]})
 assert len(colors)<255,len(colors)
 pal=[0,0,0]+[v for rgb in colors for v in rgb];pal+=[0]*(768-len(pal));lut={rgb:i+1 for i,rgb in enumerate(colors)}
 out=[]
 for im in frames:
  p=Image.new('P',im.size);p.putpalette(pal);p.putdata([lut[c[:3]] if c[3] else 0 for c in im.getdata()])
  if scale!=1:p=p.resize((p.width*scale,p.height*scale),Image.Resampling.NEAREST)
  out.append(p)
 durations=[int(round((i+1)*100/FPS)-round(i*100/FPS))*10 for i in range(len(frames))]
 args={'save_all':True,'append_images':out[1:],'duration':durations,'transparency':0,'disposal':2,'optimize':False}
 if repeat:args['loop']=0
 out[0].save(path,**args)
 # Verify exact RGBA palette, transparency, merged-frame timing and full duration.
 gif=Image.open(path);elapsed=0;starts=[sum(durations[:i]) for i in range(len(frames))]
 for i in range(gif.n_frames):
  gif.seek(i);n=min(range(len(starts)),key=lambda j:abs(starts[j]-elapsed))
  expected=frames[n].resize((frames[n].width*scale,frames[n].height*scale),Image.Resampling.NEAREST)
  assert gif.convert('RGBA').tobytes()==expected.tobytes(),(path.name,i,n)
  elapsed+=gif.info.get('duration',0)
 assert elapsed==round(len(frames)*1000/FPS)
 return {'sourceFrames':len(frames),'encodedFrames':gif.n_frames,'durationMs':elapsed,'colors':len(colors)}

def sheet(frames,name,loop,origin,events=None):
 w,h=frames[0].size;cols=8;rows=math.ceil(len(frames)/cols)
 im=Image.new('RGBA',(cols*w,rows*h))
 for i,f in enumerate(frames):im.paste(f,((i%cols)*w,(i//cols)*h))
 im.save(OUT/(name+'-sheet.png'))
 entries={f'{name}_{i:02}.png':{'frame':{'x':(i%cols)*w,'y':(i//cols)*h,'w':w,'h':h},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'sourceSize':{'w':w,'h':h},'duration':round((i+1)*1000/FPS)-round(i*1000/FPS)} for i in range(len(frames))}
 meta={'app':'pixelfx wizard actions','image':name+'-sheet.png','format':'RGBA8888','size':{'w':im.width,'h':im.height},'scale':'1','frameTags':[{'name':name,'from':0,'to':len(frames)-1,'direction':'forward'}],'pixelfx':{'fps':FPS,'loop':loop,'pivot':{'x':origin[0],'y':origin[1]}}}
 if events:meta['pixelfx']['events']=[{'name':k,'time':v,'frame':min(len(frames)-1,round(v*FPS))} for k,v in events.items()]
 (OUT/(name+'-sheet.json')).write_text(json.dumps({'frames':entries,'meta':meta},indent=2),encoding='utf-8')

checks={}
checks['idle']=save_gif(idle,OUT/'wizard-idle-native.gif')
save_gif(idle,OUT/'wizard-idle-preview.gif',8)
checks['castBody']=save_gif(cast_body,OUT/'wizard-cast-body-native.gif',repeat=False)
save_gif(cast_body,OUT/'wizard-cast-body-preview.gif',8)
checks['castFull']=save_gif(cast_full,OUT/'wizard-cast-full-native.gif',repeat=False)
save_gif(cast_full,OUT/'wizard-cast-full-preview.gif',6)
sheet(idle,'wizard-idle',True,BO)
sheet(cast_body,'wizard-cast-body',False,BO,D['events'])
sheet(spell,'wizard-spell-fx',False,FO,D['events'])
sheet(cast_full,'wizard-cast-full',False,FO,D['events'])
idle[0].save(OUT/'wizard-idle-base.png')
# Compare the true next-cycle endpoint rather than forcing a duplicate frame.
end=body(D['idleEndpoint']['body'])
def changed(a,b):return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))
checks['idleLoop']={'endpointDifferencePixels':changed(idle[0],end),'lastToFirstDifferencePixels':changed(idle[-1],idle[0]),'maxAdjacentDifferencePixels':max(changed(a,b) for a,b in zip(idle[:-1],idle[1:]))}
assert checks['idleLoop']['lastToFirstDifferencePixels']<=max(5,checks['idleLoop']['maxAdjacentDifferencePixels']*1.5),checks['idleLoop']
assert not spell[0].getbbox() and not spell[-1].getbbox()
assert spell[21].getbbox(),'Release frame must contain spell effect'
# Compact contact sheet of the full action, including the recovery.
def ui_font(size):
 for name in ['C:/Windows/Fonts/segoeui.ttf','DejaVuSans.ttf']:
  try:return ImageFont.truetype(name,size)
  except OSError:pass
 return ImageFont.load_default()
font=ui_font(17)
small=ui_font(14)
board=Image.new('RGB',(1024,600),'#1d2433');draw=ImageDraw.Draw(board)
for row,(frames,indices,labels) in enumerate([(idle,[0,12,24,36],['IDLE 0s','IDLE 1s','IDLE 2s','IDLE 3s']),(cast_full,[6,15,21,42],['PREPARE .5s','CHARGE 1.25s','RELEASE 1.75s','RECOVER 3.5s'])]):
 for col,(index,label) in enumerate(zip(indices,labels)):
  src=center_body(frames[index]) if row==0 else frames[index]
  crop=src.crop((18,4,82,76)).resize((224,252),Image.Resampling.NEAREST)
  board.paste(crop,(col*256+12,row*300+38),crop);draw.text((col*256+18,row*300+12),label,font=font,fill='#e1d5b8')
board.save(OUT/'wizard-actions-contact.png')
(OUT/'validation.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps(checks))
