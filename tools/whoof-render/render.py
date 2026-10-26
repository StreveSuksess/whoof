"""Deterministic offline first-frame renderer. Geometry comes from ProductCollar.ts.
Run Blender -b -t 8 --python tools/whoof-render/render.py -- --draft
"""
import bpy, json, math, sys, argparse
from pathlib import Path
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT.parent/'tmp/whoof-render'
OUT=ROOT/'src/public/whoof/hero-v14'
OUT.mkdir(parents=True,exist_ok=True)
MASTERS=TMP/'masters';MASTERS.mkdir(parents=True,exist_ok=True)
a=argparse.ArgumentParser(); a.add_argument('--draft',action='store_true');a.add_argument('--portrait',action='store_true');a.add_argument('--layers',action='store_true');a.add_argument('--frame',default='hero')
args=a.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24 if args.draft else 128
scene.cycles.use_denoising=True;scene.cycles.adaptive_threshold=.035 if args.draft else .012
scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='METAL';p.get_devices()
 for d in p.devices:d.use=d.type=='METAL'
 if any(d.type=='METAL' for d in p.devices):scene.cycles.device='GPU'
except Exception as e:print('CPU renderer:',e)
scene.render.resolution_x=1200 if args.draft else 2560
scene.render.resolution_y=750 if args.draft else 1600
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
scene.world=bpy.data.worlds.new('Window bounce');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.77,.80,.83,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.065

def material(name,color,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m,p

def noise_bump(m,scale,distance,strength=.3):
 n=m.node_tree.nodes; l=m.node_tree.links;p=n.get('Principled BSDF')
 tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=3
 bump=n.new('ShaderNodeBump');bump.inputs['Distance'].default_value=distance;bump.inputs['Strength'].default_value=strength
 l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
 return tex

plastic,p=material('Same black polymer — housing, button, keepers',(.0056,.0056,.0056),.43);p.inputs['IOR'].default_value=1.46;p.inputs['Specular IOR Level'].default_value=.30
noise_bump(plastic,420,.0002,.2)
yarn,p=material('Black woven nylon yarn',(.0035,.0035,.0035),.48);p.inputs['Sheen Weight'].default_value=.22;p.inputs['Sheen Roughness'].default_value=.5
noise_bump(yarn,1000,.00018,.23)
webbing,p=material('Dense black webbing backing',(.008,.008,.008),.87)
rubber,p=material('Recess',(.004,.004,.004),.7)
metal,p=material('Brushed nickel',(.58,.59,.57),.23,1);p.inputs['Anisotropic'].default_value=.35
noise_bump(metal,290,.00012,.15)
lead,p=material('Charcoal braided lead',(.007,.008,.008),.8);p.inputs['Sheen Weight'].default_value=.35
noise_bump(lead,280,.002,.4)
fiber,p=material('Braided lead threads',(.015,.016,.016),.8)
leather,p=material('Graphite leather fob',(.030,.033,.032),.52);noise_bump(leather,280,.001,.35)
ball,p=material('Stone felt ball',(.28,.30,.25),.9);p.inputs['Sheen Weight'].default_value=.75
noise_bump(ball,350,.003,.7)
seam,p=material('Ball recessed seam',(.14,.16,.13),.9)
wood,p=material('Neutral smoked ash',(.22,.18,.14),.38)
def mapped_texture(m, prefix, scale, color_scale, rough_min, normal_strength, uv=False):
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
 coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=scale
 l.new(coord.outputs['UV' if uv else 'Generated'],mapping.inputs['Vector'])
 maps={}
 for kind in ['Diffuse','Rough','nor_gl']:
  tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'tools/whoof-render/textures'/f'{prefix}-{kind}.jpg'));tex.extension='REPEAT'
  if kind!='Diffuse':tex.image.colorspace_settings.name='Non-Color'
  l.new(mapping.outputs[0],tex.inputs[0]);maps[kind]=tex
 gray=n.new('ShaderNodeRGBToBW');l.new(maps['Diffuse'].outputs['Color'],gray.inputs[0])
 tint=n.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;tint.inputs[2].default_value=(*color_scale,1);l.new(gray.outputs[0],tint.inputs[1]);l.new(tint.outputs[0],p.inputs['Base Color'])
 rough=n.new('ShaderNodeMapRange');rough.inputs['To Min'].default_value=rough_min;rough.inputs['To Max'].default_value=min(1,rough_min+.3);l.new(maps['Rough'].outputs['Color'],rough.inputs['Value']);l.new(rough.outputs[0],p.inputs['Roughness'])
 normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=normal_strength;l.new(maps['nor_gl'].outputs['Color'],normal.inputs['Color']);l.new(normal.outputs[0],p.inputs['Normal'])
 return p
mapped_texture(wood,'wood',(1.8,1.4,1),(.65,.57,.46),.3,.6)
pad,p=material('Warm graphite woven pad',(.05,.055,.052),.9);p.inputs['Sheen Weight'].default_value=.16
mapped_texture(pad,'fabric',(6,6,1),(.19,.20,.19),.65,.5)
mapped_texture(lead,'fabric',(85,2,1),(.07,.07,.067),.58,.45,True)

# Three y-up -> Blender z-up. Keep authored shape/normals and shared instances.
convert=Matrix.Rotation(math.pi/2,4,'X')
data=json.loads((TMP/'assembly.json').read_text())
geo={}
for key,g in data['geometries'].items():
 vertices=[g['position'][i:i+3] for i in range(0,len(g['position']),3)]
 ids=g['index'] if g['index'] else list(range(len(vertices)))
 mesh=bpy.data.meshes.new(key);mesh.from_pydata(vertices,[],[ids[i:i+3] for i in range(0,len(ids),3)]);mesh.update()
 for poly in mesh.polygons:poly.use_smooth=True
 if g['normal']:mesh.normals_split_custom_set_from_vertices([g['normal'][i:i+3] for i in range(0,len(g['normal']),3)])
 if g['uv']:
  uv=mesh.uv_layers.new(name='UVMap')
  for loop in mesh.loops:uv.data[loop.index].uv=g['uv'][loop.vertex_index*2:loop.vertex_index*2+2]
 geo[key]=mesh

def matrix(values):return Matrix([values[i:i+4] for i in range(0,16,4)]).transposed()
collections={}
for name in ['collar','Walking lead','House keys','Play ball','surface']:
 c=bpy.data.collections.new(name);scene.collection.children.link(c);collections[name]=c
# Three-space transformation saved for the browser's corresponding camera.
collar_transform=Matrix.Translation((0,.305,0)) @ Matrix.Rotation(-.28,4,'Y') @ Matrix.Scale(1.2,4)
for ob in data['objects']:
 name,role=ob['name'],ob['role']
 if role=='environment':continue
 mat=plastic
 if role=='collar':
  if 'yarn' in name:mat=yarn
  elif name=='Woven band':mat=webbing
  elif ob['material']['roughness']>.7:mat=rubber
 elif role=='Walking lead':
  mat=metal if ob['material']['metalness']>.5 else (fiber if ob['material']['roughness']>.85 else lead)
 elif role=='House keys':mat=metal if ob['material']['metalness']>.5 else leather
 elif role=='Play ball':mat=seam if name=='Woven walking lead' else ball
 mesh=geo[ob['geometry']]
 if not mesh.materials:mesh.materials.append(mat)
 base=matrix(ob['matrix'])
 if role=='collar':base=collar_transform@base
 elif role=='Walking lead':base=Matrix.Translation((-.55,0,-1.4))@base
 elif role=='House keys':base=Matrix.Translation((.2,.006,-.55))@base
 elif role=='Play ball':base=Matrix.Translation((-.50,0,.05))@base
 instances=ob['instances']
 transforms=[base@matrix(instances[i:i+16]) for i in range(0,len(instances),16)] if instances else [base]
 for i,t in enumerate(transforms):
  o=bpy.data.objects.new(name if not instances else f'{name}.{i}',mesh);collections[role].objects.link(o);o.matrix_world=convert@t
  if role=='collar' and not instances:o.pass_index=1

# Braided lead: two crossing families of real yarn, not a smooth hose.
lead_mesh=next(o for o in data['objects'] if o['role']=='Walking lead' and len(data['geometries'][o['geometry']]['position'])==191*11*3)
g=data['geometries'][lead_mesh['geometry']];raw=g['position'];centers=[];radials=[]
for i in range(191):
 ring=[Vector(raw[(i*11+j)*3:(i*11+j)*3+3]) for j in range(10)]
 c=sum(ring,Vector())/10;centers.append(c);radials.append((ring[0]-c).normalized())
world=convert@Matrix.Translation((-.55,0,-1.4))@matrix(lead_mesh['matrix'])
for strand in range(20):
 curve=bpy.data.curves.new(f'Braided cord yarn {strand}','CURVE');curve.dimensions='3D';curve.bevel_depth=.0045;curve.bevel_resolution=2
 spline=curve.splines.new('POLY');count=1521;spline.points.add(count-1)
 for j in range(count):
  t=j/(count-1)*190;i=min(189,int(t));f=t-i;c=centers[i].lerp(centers[i+1],f);normal=radials[i].lerp(radials[i+1],f).normalized();tangent=(centers[i+1]-centers[i]).normalized();binormal=tangent.cross(normal).normalized()
  direction=1 if strand<10 else -1;phase=j/(count-1)*math.tau*60*direction+(strand%10)*math.tau/10
  radius=.049+.002*math.sin(j/(count-1)*math.tau*120+(strand%10)*math.pi)
  v=world@(c+radius*(normal*math.cos(phase)+binormal*math.sin(phase)))
  spline.points[j].co=(*v,1)
 o=bpy.data.objects.new(f'Braided lead fiber {strand}',curve);collections['Walking lead'].objects.link(o);curve.materials.append(fiber)
# Felt fibres keep the toy from reading as a polished plastic sphere.
sphere=next(o for o in collections['Play ball'].objects if o.name=='Soft rubber ball')
bpy.context.view_layer.objects.active=sphere;sphere.select_set(True)
bpy.ops.object.particle_system_add();ps=sphere.particle_systems[-1].settings;ps.type='HAIR';ps.count=16000;ps.hair_length=.006;ps.hair_step=2;ps.root_radius=.001;ps.tip_radius=.0002;ps.radius_scale=.5
sphere.select_set(False)

def rounded_box(name,location,scale,bevel,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=location);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=5
 mod=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');mod.keep_sharp=True
 o.data.materials.append(mat)
 for c in list(o.users_collection):c.objects.unlink(o)
 collections['surface'].objects.link(o)
 return o
rounded_box('Ash entryway bench',(0,0,-.13),(18,14,.26),.055,wood)
mat=rounded_box('Woven landing pad',(1.30,.9,.020),(5.45,5.5,.040),.024,pad);mat.rotation_euler.z=-.10
# Fine stitched perimeter catches light and establishes a manufactured textile scale.
stitch,p=material('Pad edge stitching',(.11,.112,.108),.8)
curve=bpy.data.curves.new('Inset perimeter stitching','CURVE');curve.dimensions='3D';curve.bevel_depth=.002;curve.bevel_resolution=2
for axis,limit,other in [(0,2.67,2.70),(1,2.70,2.67)]:
 for side in [-1,1]:
  for i in range(int(2*limit/.045)):
   a=-limit+i*.045;b=a+.026
   s=curve.splines.new('POLY');s.points.add(1)
   for pnt,v in zip(s.points,[a,b]):pnt.co=((v if axis==0 else side*other),(side*other if axis==0 else v),.042,1)
o=bpy.data.objects.new('Pad stitches',curve);collections['surface'].objects.link(o);o.location=(1.30,.9,0);o.rotation_euler.z=-.10;curve.materials.append(stitch)

def area(name,position,power,size,target=(0,0,0),color=(1,1,1),size_y=None):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='RECTANGLE';d.size=size;d.size_y=size if size_y is None else size_y
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=position;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
area('Large window — main reflection',(-4,1,5),700,2.8,color=(1,.965,.92),size_y=3.5)
area('Front softbox — textile detail',(-3.6,-3,2.2),420,2.0,color=(1,.98,.95),size_y=3)
area('Pale wall bounce',(4,-2,4),100,4,color=(.90,.95,1))
area('Long upper rim',(-.5,4,5),260,3.2,color=(1,.98,.95),size_y=1.2)
# Window frame produces subtle broad tonal structure, using actual occlusion.
block,p=material('Window mullion',(.035,.035,.035),.8)
# Camera uses a controlled 50 mm-style perspective rather than a wide room view.
d=bpy.data.cameras.new('Hero camera');camera=bpy.data.objects.new('Hero camera',d);scene.collection.objects.link(camera);scene.camera=camera
camera.location=(0,-6.1,9.0);target=Vector((0,0,0));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();d.type='PERSP';d.sensor_fit='VERTICAL';d.sensor_height=24;d.lens=24/(2*math.tan(math.radians(27)/2));d.clip_end=100
# Center product slightly above center to give the lower editorial UI breathing room.
d.shift_y=-.025
if args.portrait:
 scene.render.resolution_x=840 if args.draft else 1600;scene.render.resolution_y=1200 if args.draft else 2286
 d.lens=24/(2*math.tan(math.radians(31.5)/2));d.shift_y=-.005
 # Physical props retained; portrait crop uses a dedicated plate so the product stays visible.
 for role in ['Walking lead','House keys','Play ball']:
  for o in collections[role].objects:
   if role=='Walking lead':o.location.x-=.4
   elif role=='House keys':o.location.x+=.7
   elif role=='Play ball':o.location.x-=1.1
 # Reframe product to upper half, preserving the same collar geometry.
 d.shift_y=-.14
scene.render.film_transparent=False
suffix='portrait' if args.portrait else 'landscape'
metadata={'camera':{'position':[0,9,6.1],'target':[0,0,0],'fov':31.5 if args.portrait else 27,'shiftY':d.shift_y},'product':{'position':[0,.305,0],'rotationY':-.28,'scale':1.2},'width':scene.render.resolution_x,'height':scene.render.resolution_y,'renderer':'Blender 4.5.9 Cycles','samples':scene.cycles.samples,'source':'ProductCollar.ts and supplied device.stl'}
(OUT/f'{suffix}.json').write_text(json.dumps(metadata,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(TMP/f'hero-{suffix}.blend'))
scene.render.filepath=str((TMP if args.draft else MASTERS)/f'{suffix}.png')
bpy.ops.render.render(write_still=True)
if args.layers:
 dest=TMP if args.draft else MASTERS
 roles={'collar':'collar','Walking lead':'leash','House keys':'keys','Play ball':'ball'}
 scene.render.film_transparent=False
 for role in roles:collections[role].hide_render=True
 scene.render.filepath=str(dest/f'{suffix}-background.png');bpy.ops.render.render(write_still=True)
 scene.render.film_transparent=True
 for o in collections['surface'].objects:o.is_shadow_catcher=True
 projected={}
 for role,slug in roles.items():
  collections[role].hide_render=False
  points=[world_to_camera_view(scene,camera,o.matrix_world@Vector(c)) for o in collections[role].objects for c in o.bound_box]
  xs=[v.x for v in points];ys=[1-v.y for v in points]
  projected[slug]={'x':(min(xs)+max(xs))/2,'y':(min(ys)+max(ys))/2,'width':max(xs)-min(xs),'height':max(ys)-min(ys)}
  scene.render.filepath=str(dest/f'{suffix}-{slug}.png');bpy.ops.render.render(write_still=True)
  collections[role].hide_render=True
 metadata['layers']=projected
 (OUT/f'{suffix}.json').write_text(json.dumps(metadata,indent=2))
print('WHOOF_RENDER_COMPLETE',scene.render.filepath)
