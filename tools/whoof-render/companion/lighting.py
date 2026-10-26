import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[4]/'tmp/companion';out=Path(__file__).resolve().parents[3]/'src/public/whoof/companion'
bpy.ops.wm.open_mainfile(filepath=str(root/'companion.blend'));s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=64;s.cycles.use_denoising=True
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.get_devices()
for d in p.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast'
s.world=bpy.data.worlds.new('Companion studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.75,.8,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.25
lights=[]
for name,pos,power,size in [('Key',(-3,-4,6),650,4),('Fill',(4,-1,3),180,3),('Rim',(0,3,5),400,3)]:
 l=bpy.data.lights.new(name,'AREA');l.energy=power;l.shape='DISK';l.size=size;o=bpy.data.objects.new(name,l);s.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,-.1,1.4))-o.location).to_track_quat('-Z','Y').to_euler();lights.append(o)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.027));floor=bpy.context.object;floor.name='Shadow floor';m=bpy.data.materials.new('Neutral floor');m.diffuse_color=(.45,.44,.42,1);floor.data.materials.append(m);floor.is_shadow_catcher=True
for o in s.objects:
 if o.type=='MESH' and o!=floor:o.visible_camera=False
cam=bpy.data.cameras.new('Shadow camera');o=bpy.data.objects.new('Shadow camera',cam);s.collection.objects.link(o);s.camera=o;o.location=(0,0,8);o.rotation_euler=(0,0,0);cam.type='ORTHO';cam.ortho_scale=6
s.render.resolution_x=s.render.resolution_y=1024;s.render.resolution_percentage=100;s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.filepath=str(out/'contact-shadow.png');bpy.ops.render.render(write_still=True)
# Capture broad studio reflections in scene-linear radiance.
floor.is_shadow_catcher=False
for obj in list(s.objects):
 if obj.type=='MESH' and obj!=floor:obj.hide_render=True
for light in lights:
 d=light.data;bpy.ops.mesh.primitive_plane_add(size=1);proxy=bpy.context.object;proxy.matrix_world=light.matrix_world.copy();proxy.scale=(d.size,d.size,1)
 proxy.visible_diffuse=proxy.visible_glossy=proxy.visible_shadow=proxy.visible_transmission=False
 mat=bpy.data.materials.new('Reflection '+light.name);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();e=n.new('ShaderNodeEmission');e.inputs[0].default_value=(1,1,1,1);e.inputs[1].default_value=d.energy/(math.pi*d.size*d.size);output=n.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(e.outputs[0],output.inputs['Surface']);proxy.data.materials.append(mat)
o=s.camera;o.location=(0,0,1.5);o.rotation_euler=Vector((1,0,0)).to_track_quat('-Z','Y').to_euler();cam.type='PANO';cam.panorama_type='EQUIRECTANGULAR';s.render.resolution_y=512;s.render.film_transparent=False;s.render.image_settings.file_format='HDR';s.render.image_settings.color_mode='RGB';s.render.filepath=str(out/'studio.hdr');bpy.ops.render.render(write_still=True)
