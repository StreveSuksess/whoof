import bpy,math
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[4]/'tmp/companion'
bpy.ops.wm.open_mainfile(filepath=str(root/'companion.blend'));scene=bpy.context.scene
master=root.parent/'whoof-render/hero-v15-landscape.blend'
with bpy.data.libraries.load(str(master),link=False) as (source,target):target.collections=['collar']
col=target.collections[0];scene.collection.children.link(col);col.hide_render=False
bpy.context.view_layer.update()
convert=Matrix.Rotation(math.pi/2,4,'X');old=Matrix.Translation((0,.305,0))@Matrix.Rotation(-.28,4,'Y')@Matrix.Scale(1.2,4)
new=Matrix.Translation((0,2.23,.47))@Matrix.Rotation(.4,4,'X')@Matrix.Scale(.56,4)
for obj in col.objects:
 obj.hide_render=False;obj.visible_camera=True
 canonical=old.inverted()@convert.inverted()@obj.matrix_world
 if 'yarn' in obj.name or 'keeper' in obj.name:canonical.translation.x*=.87
 if obj.name=='Woven band':canonical=Matrix.Diagonal((.87,1,1,1))@canonical
 obj.matrix_world=convert@new@canonical
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.get_devices()
for d in p.devices:d.use=d.type=='METAL'
scene.cycles.device='GPU';scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.film_transparent=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.75,.8,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.25
for name,pos,power,size in [('Softbox',(-3,-4,6),650,4),('Fill',(4,-1,3),180,3),('Rim',(0,3,5),400,3)]:
 l=bpy.data.lights.new(name,'AREA');l.energy=power;l.shape='DISK';l.size=size;o=bpy.data.objects.new(name,l);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,-.1,1.4))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Poster');o=bpy.data.objects.new('Poster',d);scene.collection.objects.link(o);scene.camera=o;d.lens=60;o.location=(3,-7,3.2);o.rotation_euler=(Vector((0,0,1.6))-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(root/'poster.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'poster.blend'))
