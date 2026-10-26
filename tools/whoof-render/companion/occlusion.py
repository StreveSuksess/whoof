import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[4]/'tmp/companion';out=Path(__file__).resolve().parents[3]/'src/public/whoof/companion'
bpy.ops.wm.open_mainfile(filepath=str(root/'companion.blend'));s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=32
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.get_devices()
for d in p.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';bpy.ops.object.select_all(action='DESELECT');o=bpy.data.objects['Object_0'];o.select_set(True);bpy.context.view_layer.objects.active=o
for other in s.objects:
 if other.type=='MESH' and other!=o:other.hide_render=True
im=bpy.data.images.new('Local soft tissue occlusion',width=2048,height=2048,alpha=False);im.colorspace_settings.name='Non-Color'
for m in o.data.materials:
 n=m.node_tree.nodes;l=m.node_tree.links;output=n.get('Material Output')
 for link in list(l):
  if link.to_node==output:l.remove(link)
 ao=n.new('ShaderNodeAmbientOcclusion');ao.inputs['Distance'].default_value=.30;ao.samples=32;ao.only_local=True
 e=n.new('ShaderNodeEmission');l.new(ao.outputs['Color'],e.inputs[0]);l.new(e.outputs[0],output.inputs['Surface'])
 tex=n.new('ShaderNodeTexImage');tex.image=im;n.active=tex;tex.select=True
s.render.bake.margin=12;bpy.ops.object.bake(type='EMIT',use_clear=True)
im.filepath_raw=str(out/'occlusion.png');im.file_format='PNG';im.save();print('AO_READY')
