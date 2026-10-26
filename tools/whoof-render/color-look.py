"""Bake the saved hero's complete OCIO display transform into a small 3D LUT.
Run with tmp/color-tools/bin/python (PyOpenColorIO); no runtime Python dependency.
Input lattice is scene-linear sRGB in logarithmic coordinates; output is sRGB.
"""
from pathlib import Path
import struct
import PyOpenColorIO as ocio

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT.parent / 'tmp/render-tools/blender-mount/Blender.app/Contents/Resources/4.5/datafiles/colormanagement/config.ocio'
config = ocio.Config.CreateFromFile(str(CONFIG))
view = ocio.DisplayViewTransform(src='Linear Rec.709', display='sRGB', view='AgX')
pipeline = ocio.LegacyViewingPipeline()
pipeline.setDisplayViewTransform(view)
pipeline.setLooksOverride('AgX - Medium High Contrast')
pipeline.setLooksOverrideEnabled(True)
cpu = pipeline.getProcessor(config).getDefaultCPUProcessor()
size = 33
lo, hi = -12.47393, 4.026069
stops = [2 ** (lo + (hi - lo) * i / (size - 1)) for i in range(size)]
pixels = bytearray()
for b in stops:
    for g in stops:
        for r in stops:
            rgb = cpu.applyRGB([r, g, b])
            pixels.extend(struct.pack('<4e', *rgb, 1))
out = ROOT / 'src/public/whoof/lighting/hero-look.bin'
out.write_bytes(pixels)
for gray in [.0035, .0056, .01, .05, .18, 1]:
    print(gray, cpu.applyRGB([gray] * 3))
print('WHOOF_COLOR_LOOK_COMPLETE', len(pixels), out)
