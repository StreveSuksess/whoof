"""Export the hero's radiance field for the live collar; no display transform.

The camera-only emitter proxies make the Cycles area lights visible in the
probe without adding their illumination a second time to the table surface.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT.parent / 'tmp/whoof-render'
OUT = ROOT / 'src/public/whoof/lighting'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(TMP / 'hero-v15-landscape.blend'))
scene = bpy.context.scene
bpy.data.collections['collar'].hide_render = True
for name in ['Walking lead', 'House keys', 'Play ball']:
    bpy.data.collections[name].hide_render = True
for obj in bpy.data.collections['surface'].objects:
    obj.is_shadow_catcher = False
    obj.visible_camera = True

for light in list(scene.objects):
    if light.type != 'LIGHT' or light.data.type != 'AREA':
        continue
    data = light.data
    bpy.ops.mesh.primitive_plane_add(size=1)
    proxy = bpy.context.object
    proxy.name = 'Probe reflection: ' + light.name
    proxy.matrix_world = light.matrix_world.copy()
    proxy.scale = (data.size, data.size_y, 1)
    proxy.visible_diffuse = proxy.visible_glossy = False
    proxy.visible_shadow = proxy.visible_transmission = False
    proxy.visible_volume_scatter = False
    material = bpy.data.materials.new(proxy.name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*data.color, 1)
    emission.inputs['Strength'].default_value = data.energy / (math.pi * data.size * data.size_y)
    material.node_tree.links.new(emission.outputs[0], output.inputs['Surface'])
    proxy.data.materials.append(material)

camera = scene.camera
camera.location = (0, 0, .305)
# Three equirectangular UV center is +X, right is +Z (Blender -Y), up is +Y.
camera.rotation_euler = Vector((1, 0, 0)).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'PANO'
camera.data.panorama_type = 'EQUIRECTANGULAR'
camera.data.shift_x = camera.data.shift_y = 0
scene.render.resolution_x = 1024
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.image_settings.file_format = 'HDR'
scene.render.image_settings.color_mode = 'RGB'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'METAL'
scene.cycles.device = 'GPU'
scene.render.filepath = str(OUT / 'hero.hdr')
bpy.ops.render.render(write_still=True)
print('WHOOF_LIGHT_PROBE_COMPLETE', scene.render.filepath)
