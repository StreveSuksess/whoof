"""Extract separate product color and contact-shadow passes from the saved scene."""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT.parent/'tmp/whoof-render';DEST=TMP/'masters'
for suffix in ['landscape','portrait']:
 bpy.ops.wm.open_mainfile(filepath=str(TMP/f'hero-{suffix}.blend'))
 scene=bpy.context.scene;scene.render.film_transparent=True
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
 for device in prefs.devices:device.use=device.type=='METAL'
 scene.cycles.device='GPU'
 for name in ['Walking lead','House keys','Play ball']:bpy.data.collections[name].hide_render=True
 product=list(bpy.data.collections['collar'].objects);surfaces=list(bpy.data.collections['surface'].objects)
 for o in surfaces:o.is_shadow_catcher=True
 for o in product:o.visible_camera=False
 scene.render.filepath=str(DEST/f'{suffix}-shadow.png');bpy.ops.render.render(write_still=True)
 for o in product:o.visible_camera=True
 for o in surfaces:o.is_shadow_catcher=False;o.visible_camera=False
 scene.render.filepath=str(DEST/f'{suffix}-collar.png');bpy.ops.render.render(write_still=True)
print('PRODUCT_LAYERS_COMPLETE')
