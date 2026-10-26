"""Extract three portrait shots from the user's original Whoof product film."""
from pathlib import Path
from fractions import Fraction
import json
import av
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path('/Users/s.gavrilin/Downloads/drop_without offer.mp4')
DEST = ROOT / 'src/public/whoof/life-gallery'
PROOF = ROOT.parent / 'tmp/life-gallery'
# Exact source frame intervals, end exclusive. Avoid the flash transition at3s.
CUTS = [('detail', 2, 71), ('on-dog', 144, 219), ('outside', 222, 313)]
RATE = 24
DEST.mkdir(parents=True, exist_ok=True)
PROOF.mkdir(parents=True, exist_ok=True)
sheet = Image.new('RGB', (900, 3 * 528), '#efede8')
manifest = []
for row, (name, first, last) in enumerate(CUTS):
    frames = []
    with av.open(str(SOURCE)) as source:
        stream = source.streams.video[0]
        source.seek(int(Fraction(first, RATE) / stream.time_base), stream=stream)
        for frame in source.decode(stream):
            source_index = round(float(frame.pts * stream.time_base) * RATE)
            if source_index < first: continue
            if source_index >= last: break
            frames.append(frame.to_image().resize((720, 1280), Image.Resampling.LANCZOS))
    path = DEST / f'{name}.mp4'
    with av.open(str(path), 'w', options={'movflags': '+faststart'}) as output:
        video = output.add_stream('libx264', rate=RATE)
        video.width, video.height, video.pix_fmt = 720, 1280, 'yuv420p'
        video.options = {'crf': '19', 'preset': 'medium', 'profile': 'high', 'g': '24'}
        for i, picture in enumerate(frames):
            frame = av.VideoFrame.from_image(picture)
            frame.pts, frame.time_base = i, Fraction(1, RATE)
            for packet in video.encode(frame): output.mux(packet)
        for packet in video.encode(): output.mux(packet)
    frames[0].save(DEST / f'{name}.webp', quality=92)
    for column, index in enumerate([0, len(frames)//2, len(frames)-1]):
        thumb = frames[index].resize((280, 498), Image.Resampling.LANCZOS)
        sheet.paste(thumb, (column*300, row*528))
        ImageDraw.Draw(sheet).text((column*300+5, row*528+505), f'{name} - {index/RATE:.2f}s', fill='#26272c')
    item = {'id':name, 'source':SOURCE.name, 'sourceStartFrame':first, 'sourceEndFrameExclusive':last, 'sourceStart':first/RATE,'sourceEnd':last/RATE,'frames':len(frames),'duration':len(frames)/RATE,'fps':RATE,'width':720,'height':1280,'bytes':path.stat().st_size}
    manifest.append(item)
    print(item, flush=True)
sheet.save(PROOF / 'portrait-cuts-contact.jpg')
(DEST/'clips.json').write_text(json.dumps(manifest,indent=2)+'\n')
