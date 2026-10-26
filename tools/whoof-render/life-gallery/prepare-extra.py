"""Two additional landing-film cuts for the seven-card gallery."""
from pathlib import Path
from fractions import Fraction
import json
import av
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[3]
DEST=ROOT/'src/public/whoof/life-extra'
PROOF=ROOT.parent/'tmp/life-gallery/v26'
SOURCE=ROOT.parent/'tmp/companion/reference-slides.mp4'
DEST.mkdir(parents=True,exist_ok=True); PROOF.mkdir(parents=True,exist_ok=True)
# Crop static authored footage; remove original top captions/timer.
CUTS=[
 ('daytime',SOURCE,195,309,30,(700,120,1520,1182)),
 ('routine',SOURCE,330,453,30,(1490,120,2310,1182)),
]
sheet=Image.new('RGB',(900,len(CUTS)*440),'#26272c'); draw=ImageDraw.Draw(sheet); manifest=[]
for row,(name,source_path,first,last,rate,crop) in enumerate(CUTS):
 pictures=[]
 with av.open(str(source_path)) as source:
  stream=source.streams.video[0]
  source.seek(int(Fraction(first,rate)/stream.time_base),stream=stream)
  for frame in source.decode(stream):
   index=round(float(frame.pts*stream.time_base)*rate)
   if index<first:continue
   if index>=last:break
   target=(720,1280) if name=='activity' else (720,932)
   pictures.append(frame.to_image().crop(crop).resize(target,Image.Resampling.LANCZOS))
 assert len(pictures)==last-first,(name,len(pictures),last-first)
 path=DEST/f'{name}.mp4'
 with av.open(str(path),'w',options={'movflags':'+faststart'}) as output:
  stream=output.add_stream('libx264',rate=rate)
  stream.width,stream.height=pictures[0].size;stream.pix_fmt='yuv420p'
  stream.options={'crf':'19','preset':'medium','profile':'high','g':str(rate)}
  for i,picture in enumerate(pictures):
   frame=av.VideoFrame.from_image(picture);frame.pts=i;frame.time_base=Fraction(1,rate)
   for packet in stream.encode(frame):output.mux(packet)
  for packet in stream.encode():output.mux(packet)
 pictures[0].save(DEST/f'{name}.webp',quality=92)
 for col,index in enumerate((0,len(pictures)//2,len(pictures)-1)):
  thumb=pictures[index].copy();thumb.thumbnail((280,405),Image.Resampling.LANCZOS)
  sheet.paste(thumb,(col*300,row*440));draw.text((col*300+5,row*440+414),f'{name} / {index/rate:.2f}s',fill='white')
 item={'id':name,'source':source_path.name,'firstFrame':first,'endExclusive':last,'crop':crop,'fps':rate,'frames':len(pictures),'duration':len(pictures)/rate,'size':pictures[0].size,'bytes':path.stat().st_size}
 manifest.append(item);print(item,flush=True)
sheet.save(PROOF/'source-contact.jpg');(DEST/'clips.json').write_text(json.dumps(manifest,indent=2)+'\n')
