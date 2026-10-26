"""Extract an existing coherent film into bounded-resolution, exact-pose frames.

Example (from repository):
PYTHONPATH=../tmp/companion/video-python python3 tools/whoof-render/companion-film/import.py \
    source.mp4 --output src/public/whoof/companion-film/sequence --start 0 --end 4 --neutral .5

No interpolation, generated motion, product editing or source upload occurs here.
"""
import argparse
import json
import math
from pathlib import Path

import av
from PIL import Image, ImageDraw, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--start', type=float, default=0)
    parser.add_argument('--end', type=float)
    parser.add_argument('--neutral', type=float, default=.5, help='Neutral position in selected clip, 0..1')
    parser.add_argument('--fps', type=float, default=30)
    parser.add_argument('--long-edge', type=int, default=1280)
    args = parser.parse_args()
    if not 0 <= args.neutral <= 1 or not 1 <= args.fps <= 60 or not 320 <= args.long_edge <= 1440:
        parser.error('neutral must be 0..1, fps 1..60, long-edge 320..1440')
    if not math.isfinite(args.start) or args.start < 0:
        parser.error('start must be nonnegative and finite')
    if args.output.exists() and any(args.output.iterdir()):
        parser.error('output must be new or empty; existing exports are never overwritten')
    with av.open(str(args.source)) as container:
        stream = container.streams.video[0]
        duration = float(stream.duration * stream.time_base) if stream.duration else container.duration / av.time_base
        end = args.end if args.end is not None else duration
        if not math.isfinite(end) or not args.start < end <= duration + .05:
            parser.error('selected interval must fall inside source duration')
        rate = min(args.fps, float(stream.average_rate or 30), 239 / (end - args.start))
        args.output.mkdir(parents=True, exist_ok=True)
        next_time = args.start
        images, times, names = [], [], []
        size = None
        for frame in container.decode(stream):
            time = frame.time
            if time is None or time + 1e-6 < next_time:
                continue
            if time >= end or len(names) >= 240:
                break
            image = frame.to_image().convert('RGB')
            image.thumbnail((args.long_edge, args.long_edge), Image.Resampling.LANCZOS)
            if size is None:
                size = image.size
            if image.size != size:
                raise ValueError('Source changes resolution mid-clip')
            name = f'{len(names):04d}.webp'
            image.save(args.output / name, quality=90, method=6)
            names.append(name)
            times.append(round(time, 6))
            images.append(ImageOps.contain(image, (320, 190)))
            next_time = args.start + len(names) / rate
        if len(names) < 2:
            raise ValueError('Selected clip contains fewer than two decodable frames')
        neutral = min(range(len(times)), key=lambda i: abs(times[i] - (args.start + (end - args.start) * args.neutral)))
        manifest = dict(version=1, width=size[0], height=size[1], neutral=neutral,
                        frames=names, poster=names[neutral], timestamps=times,
                        source=args.source.name, sourceDuration=duration, sampleRate=rate)
        (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        picked = sorted(set(round(i * (len(names) - 1) / 11) for i in range(12)))
        sheet = Image.new('RGB', (1280, 660), '#eeeae3')
        draw = ImageDraw.Draw(sheet)
        for slot, i in enumerate(picked):
            x, y = slot % 4 * 320, slot // 4 * 220
            sheet.paste(images[i], (x, y + 24))
            draw.text((x + 8, y + 6), f'{i:03d} / {times[i]:.3f}s', fill='#26272c')
        sheet.save(args.output / 'contact-sheet.jpg', quality=90)
        print(json.dumps(dict(frames=len(names), width=size[0], height=size[1], neutral=neutral,
                              compressedBytes=sum((args.output / n).stat().st_size for n in names))))


if __name__ == '__main__':
    main()
