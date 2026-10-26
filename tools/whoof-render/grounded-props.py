"""Repair and render constrained, camera-matched hero prop poses and their contact shadows."""
import bpy, math, sys, json, argparse, numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2];TMP=ROOT.parent/'tmp/whoof-render';OUT=ROOT/'src/public/whoof/hero-v22';MASTERS=TMP/'masters-v22'
OUT.mkdir(exist_ok=True);MASTERS.mkdir(exist_ok=True)
sys.path.insert(0,str(Path(__file__).parent))
from walk_keys import replace_walk_keys
from grounded_lead import replace_lead
parser=argparse.ArgumentParser();parser.add_argument('--portrait',action='store_true');parser.add_argument('--draft',action='store_true');parser.add_argument('--poses',action='store_true');parser.add_argument('--only',default='');parser.add_argument('--cpu',action='store_true');parser.add_argument('--metadata',action='store_true');parser.add_argument('--baseline',action='store_true');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
fmt='portrait' if args.portrait else 'landscape'
bpy.ops.wm.open_mainfile(filepath=str(TMP/f'hero-v15-{fmt}.blend'))
scene=bpy.context.scene;prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.cycles.device='CPU' if args.cpu else 'GPU';scene.cycles.samples=32 if args.draft else (64 if args.poses else 96);scene.cycles.adaptive_threshold=.015
scene.render.resolution_percentage=55 if args.draft else (75 if args.poses else 100)
scene.render.film_transparent=False;scene.render.use_border=False
scene.render.image_settings.color_mode='RGBA'
for c in bpy.data.collections:c.hide_render=False
for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=False;o.visible_camera=True
root=replace_walk_keys(bpy.data.collections['House keys'],args.portrait)
deform_lead,lead_world=replace_lead(bpy.data.collections['Walking lead'])
# The ball was intersecting the pad; its centre follows the radius above pad height.
ball_objects=list(bpy.data.collections['Play ball'].objects)
for o in ball_objects:o.location.z+=.04
bpy.context.view_layer.update()
ball_rest={o.name:o.matrix_world.copy() for o in ball_objects}
ball_centre=next(o for o in ball_objects if o.name=='Soft rubber ball').matrix_world.translation.copy()
key_groups=[o for o in bpy.data.collections['House keys'].objects if 'hole_anchor' in o]
def pose_keys(q):
 for i,g in enumerate(key_groups):
  g.rotation_euler=(g['rest_tilt'],0,g['rest_angle']+q*(.15 if i==0 else .075))
  g.location=Vector(g['hole_anchor'])-g.rotation_euler.to_matrix()@Vector((0,.020,0))
 bpy.context.view_layer.update()
def pose_ball(q):
 theta=q*.42;radius=.32;displacement=theta*radius
 transform=Matrix.Translation((displacement,0,0))@Matrix.Translation(ball_centre)@Matrix.Rotation(theta,4,'Y')@Matrix.Translation(-ball_centre)
 for o in ball_objects:o.matrix_world=transform@ball_rest[o.name]
 bpy.context.view_layer.update()
poses={'keys':pose_keys,'leash':deform_lead,'ball':pose_ball};roles={'keys':'House keys','leash':'Walking lead','ball':'Play ball'}
def projected(v):
 p=world_to_camera_view(scene,scene.camera,Vector(v));return (p.x,1-p.y)
def bounds(collection):
 bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
 pts=[]
 for o in collection.objects:
  if o.type not in {'MESH','CURVE','FONT'}:continue
  evaluated=o.evaluated_get(deps);mesh=evaluated.to_mesh()
  if mesh and len(mesh.vertices):
   coords=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',coords)
   coords=coords.reshape((-1,3));lo=coords.min(axis=0);hi=coords.max(axis=0)
   pts.extend(projected(o.matrix_world@Vector((x,y,z))) for x in (lo[0],hi[0]) for y in (lo[1],hi[1]) for z in (lo[2],hi[2]))
  evaluated.to_mesh_clear()
 return [min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)]

meta=json.loads((ROOT/f'src/public/whoof/hero-v15/{fmt}.json').read_text());meta['motion']={}
for name,fn in poses.items():
 both=[]
 for q in (-1,0,1):fn(q);both.append(bounds(bpy.data.collections[roles[name]]))
 fn(0)
 x0=max(0,min(b[0] for b in both)-.035);y0=max(0,min(b[1] for b in both)-.04);x1=min(1,max(b[2] for b in both)+.05);y1=min(1,max(b[3] for b in both)+.05)
 # Integer full-resolution crop, fixed across every pose (no drifting sprite origin).
 W,H=meta['width'],meta['height'];x0=math.floor(x0*W)/W;y0=math.floor(y0*H)/H;x1=math.ceil(x1*W)/W;y1=math.ceil(y1*H)/H
 b=bounds(bpy.data.collections[roles[name]]);meta['layers'][name]={'x':(b[0]+b[2])/2,'y':(b[1]+b[3])/2,'width':b[2]-b[0],'height':b[3]-b[1]}
 pivot=projected(root.matrix_world@Vector((0,0,.025))) if name=='keys' else projected(lead_world@Vector((.8,.045,.55))) if name=='leash' else projected(ball_centre)
 a=projected(Vector(ball_centre)+Vector((1,0,0))) if name=='ball' else projected(lead_world@Vector((1.8,.045,.55))) if name=='leash' else (pivot[0]+1,pivot[1])
 axis=[a[0]-pivot[0],a[1]-pivot[1]]
 meta['motion'][name]={'rect':[x0,y0,x1-x0,y1-y0],'frames':[f'{fmt}-{name}-{i:02d}.webp' for i in range(17)],'pivot':list(pivot),'axis':axis,'reach':meta['layers'][name]['height']*.6}
# Narrow contact paths exclude empty space inside the lead loop and around the keys.
meta['motion']['keys']['segments']=[[projected(g.matrix_world@Vector((0,.02,0))),projected(g.matrix_world@Vector((0,-.59,0)))] for g in key_groups]
lead_contacts=[(.30,.046,-1.15),(.29,.046,-.63),(-.15,.046,.02),(-.18,.046,.34),(-.18,.046,.72),(.11,.046,1.12),(.56,.046,.76),(.65,.046,.10),(.91,.046,-.1),(1.18,.046,.17),(1.065,.046,.57),(1.05,.046,.90),(1.065,.022,1.2)]
meta['motion']['leash']['segments']=[[projected(lead_world@Vector(a)),projected(lead_world@Vector(b))] for a,b in zip(lead_contacts,lead_contacts[1:])]
meta['motion']['keys']['radius']=.021;meta['motion']['leash']['radius']=.012
meta['motion']['ball']['segments']=[];meta['motion']['ball']['radius']=.01
meta['poseSamples']=64;meta['poseResolutionScale']=.75;meta['samples']=96
meta['walkProps']='Threaded key ring, hinged keys, closed lead eyes, grounded constrained motion'
if args.metadata:
 (OUT/f'{fmt}.json').write_text(json.dumps(meta,indent=2));print('METADATA_COMPLETE',fmt);sys.exit(0)
if args.baseline:
 scene.render.film_transparent=True;scene.render.resolution_percentage=75;scene.cycles.samples=64
 for c in ['collar','Walking lead','House keys','Play ball']:bpy.data.collections[c].hide_render=True
 for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=True
 scene.render.filepath=str(MASTERS/f'{fmt}-catcher-empty.png');bpy.ops.render.render(write_still=True)
 print('BASELINE_COMPLETE',fmt);sys.exit(0)
# Keep exactly the prior camera, studio illumination and collar geometry.
if not args.poses:
 scene.render.filepath=str(MASTERS/f'{fmt}{"-draft" if args.draft else ""}.png');bpy.ops.render.render(write_still=True)
 if not args.draft:bpy.ops.wm.save_as_mainfile(filepath=str(TMP/f'hero-v22-{fmt}.blend'))
else:
 scene.render.film_transparent=True;scene.render.use_border=True;scene.render.use_crop_to_border=True
 for c in ['collar','Walking lead','House keys','Play ball']:bpy.data.collections[c].hide_render=True
 for o in bpy.data.collections['surface'].objects:o.is_shadow_catcher=True
 for name,fn in poses.items():
  if args.only and args.only!=name:continue
  bpy.data.collections[roles[name]].hide_render=False
  x,y,w,h=meta['motion'][name]['rect'];scene.render.border_min_x=x;scene.render.border_max_x=x+w;scene.render.border_min_y=1-y-h;scene.render.border_max_y=1-y
  for i in range(17):
   output=MASTERS/f'{fmt}-{name}-{i:02d}.png'
   if output.exists():continue
   fn((i-8)/8);scene.render.filepath=str(output);bpy.ops.render.render(write_still=True)
  fn(0);bpy.data.collections[roles[name]].hide_render=True
(OUT/f'{fmt}.json').write_text(json.dumps(meta,indent=2));print('GROUNDED_PROPS_COMPLETE',fmt,flush=True)
