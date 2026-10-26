import bpy,math,json,random,bisect
from pathlib import Path
from mathutils import Vector, Matrix
root=Path(__file__).resolve().parents[4]/'tmp/companion'
bpy.ops.wm.open_mainfile(filepath=str(root/'seated.blend'))
rig=bpy.data.objects['Dog Armature'];body=bpy.data.objects['Object_0'];mesh=body.data
parts=json.loads((root/'parts.json').read_text());partof={v:i for i,p in enumerate(parts) for v in p['ids']}
# Keep source UVs; assign optical response by real anatomical region before deforming.
base=mesh.materials[0];bs=base.node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.76;bs.inputs['Sheen Weight'].default_value=.22
for link in list(base.node_tree.links):
 if link.to_socket in [bs.inputs['Metallic'],bs.inputs['Roughness']]:base.node_tree.links.remove(link)
bs.inputs['Specular IOR Level'].default_value=.25
for n in base.node_tree.nodes:
 if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.42
wet=base.copy();wet.name='Cornea and wet nose';w=wet.node_tree.nodes.get('Principled BSDF');w.inputs['Roughness'].default_value=.20;w.inputs['Coat Weight'].default_value=.45;w.inputs['Coat Roughness'].default_value=.08;w.inputs['Specular IOR Level'].default_value=.48;w.inputs['Sheen Weight'].default_value=0
mesh.materials.append(wet)
colour_image=next(n.image for n in base.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and n.image.name.startswith('Image_0'))
pixels=list(colour_image.pixels);iw,ih=colour_image.size;uv0=mesh.uv_layers.active.data
for p in mesh.polygons:
 c=p.center
 tex=sum((uv0[i].uv for i in p.loop_indices),Vector((0,0)))/len(p.loop_indices)
 offset=(int(tex.y%1*(ih-1))*iw+int(tex.x%1*(iw-1)))*4
 dark=max(pixels[offset:offset+3])<.30
 eye=.13<abs(c.x)<.32 and -2.13<c.y<-1.90 and 2.36<c.z<2.55
 nose=abs(c.x)<.18 and c.y<-2.45 and c.z>2.20
 if (eye or nose) and dark:p.material_index=1
# Remove old broad polygon whiskers; replace with physically narrow fibres below.
old=bpy.data.objects.get('mouth hair')
if old:bpy.data.objects.remove(old,do_unlink=True)
# Bake authored seated deformation into mesh and rest skeleton, preserving weights for interaction.
bpy.context.view_layer.objects.active=body;body.select_set(True)
skin={g.index:rig.pose.bones[g.name].matrix @ rig.data.bones[g.name].matrix_local.inverted() for g in body.vertex_groups if g.name in rig.pose.bones}
for v in mesh.vertices:
 delta=Matrix(((0,0,0,0),)*4);total=0
 for g in v.groups:
  if g.group in skin:delta+=skin[g.group]*g.weight;total+=g.weight
 if total<=0:continue
 delta*=1/total
 if mesh.shape_keys:
  for key in mesh.shape_keys.key_blocks:key.data[v.index].co=delta@key.data[v.index].co
  v.co=mesh.shape_keys.key_blocks[0].data[v.index].co
 else:v.co=delta@v.co
for mod in list(body.modifiers):
 if mod.type=='ARMATURE':body.modifiers.remove(mod)
body.select_set(False);rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)
arm=body.modifiers.new('Companion neck rig','ARMATURE');arm.object=rig
# Seated soft tissue: relax welded seam positions and give the neck its natural ruff.
mesh=body.data
clusters={}
for v in mesh.vertices:
 key=tuple(round(x,4) for x in v.co);clusters.setdefault(key,[]).append(v.index)
cluster_ids=list(clusters.values());member={v:i for i,ids in enumerate(cluster_ids) for v in ids}
positions=[mesh.vertices[ids[0]].co.copy() for ids in cluster_ids];adj=[set() for _ in positions]
for edge in mesh.edges:
 a,b=(member[v] for v in edge.vertices)
 if a!=b:adj[a].add(b);adj[b].add(a)
for iteration in range(14):
 fresh=[p.copy() for p in positions]
 for i,p in enumerate(positions):
  if .42<p.z<1.2 and p.y<.9 and any(partof.get(v)==1 for v in cluster_ids[i]) and adj[i]:
   weight=.35*max(0,1-abs(p.z-.8)/.4)
   avg=sum((positions[j] for j in adj[i]),Vector())/len(adj[i]);fresh[i]=p.lerp(avg,weight)
 positions=fresh
for ids,p in zip(cluster_ids,positions):
 if .48<p.z<1.1 and abs(p.x)<.48 and p.y<.7:
  # Tuck the belly behind the forelegs instead of leaving a flat stretched skin panel.
  p.y+=.24*math.sin((p.z-.48)/.62*math.pi)*max(0,1-(p.x/.48)**4)
 if 1.9<p.z<2.6 and -.95<p.y<.1:
  p.x*=1+.19*math.sin((p.z-1.9)/.7*math.pi)**2
 for i in ids:
  delta=p-mesh.vertices[i].co
  if mesh.shape_keys:
   for key in mesh.shape_keys.key_blocks:key.data[i].co+=delta
  mesh.vertices[i].co=p
mesh.update()
# Fur follows the source's UV colour and skin weights; short guard hairs bend along the coat.
rng=random.Random(810);mesh.calc_loop_triangles();uv=mesh.uv_layers.active.data
tris=[];areas=[];area=0
for t in mesh.loop_triangles:
 part=partof.get(t.vertices[0],999)
 if part not in [0,1,2,3,4,5,9,10,11]:continue
 if mesh.polygons[t.polygon_index].material_index!=0:continue
 co=[mesh.vertices[i].co for i in t.vertices];a=(co[1]-co[0]).cross(co[2]-co[0]).length/2
 area+=a;tris.append(t);areas.append(area)
verts=[];faces=[];uvs=[];weights=[]
for i in range(65000):
 t=tris[bisect.bisect_left(areas,rng.random()*area)];a=rng.random()**.5;b=rng.random();bc=(1-a,a*(1-b),a*b)
 pos=sum((mesh.vertices[j].co*w for j,w in zip(t.vertices,bc)),Vector());normal=sum((mesh.vertices[j].normal*w for j,w in zip(t.vertices,bc)),Vector()).normalized()
 part=partof.get(t.vertices[0]);length=(.035 if part==1 else .022)*rng.uniform(.55,1.4)
 if part==0:length=.009 if pos.y<-.9 else .014
 direction=Vector((pos.x*.12,.25,-1))
 if part==0:direction=Vector((pos.x*.35,.6,.05))
 if part in [10,11]:direction=Vector((0,0,-1))
 tangent=direction-normal*direction.dot(normal)
 if tangent.length<.001:tangent=normal.cross(Vector((1,0,0)))
 tangent.normalize();tangent=(tangent+normal.cross(tangent)*rng.uniform(-.3,.3)).normalized();side=normal.cross(tangent).normalized()
 tex=sum((uv[l].uv*w for l,w in zip(t.loops,bc)),Vector((0,0)))
 gw={}
 for j,w in zip(t.vertices,bc):
  for g in mesh.vertices[j].groups:gw[g.group]=gw.get(g.group,0)+g.weight*w
 gw=sorted(gw.items(),key=lambda x:-x[1])[:4];total=sum(v for _,v in gw);gw=[(k,v/total) for k,v in gw] if total else []
 start=len(verts);width=rng.uniform(.00065,.00115)
 for k in range(4):
  f=k/3;center=pos+normal*(.0002+length*(.36*f-.14*f*f))+tangent*length*f;rad=width*(1-f*.97)
  for s in [-1,1]:verts.append(center+side*rad*s);uvs.append(tex);weights.append(gw)
 for k in range(3):q=start+k*2;faces.append((q,q+1,q+3,q+2))
f=bpy.data.meshes.new('Tapered short guard hairs');f.from_pydata(verts,[],faces);f.update();layer=f.uv_layers.new(name='UVMap')
for l in f.loops:layer.data[l.index].uv=uvs[l.vertex_index]
for p in f.polygons:p.use_smooth=True
hair=bpy.data.objects.new('Short directional coat',f);bpy.context.scene.collection.objects.link(hair);hair.parent=rig
fm=base.copy();fm.name='Guard hair satin';p=fm.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.67;p.inputs['Sheen Weight'].default_value=.35
for n in list(fm.node_tree.nodes):
 if n.type=='NORMAL_MAP':fm.node_tree.nodes.remove(n)
f.materials.append(fm)
for g in body.vertex_groups:hair.vertex_groups.new(name=g.name)
for i,gs in enumerate(weights):
 for g,w in gs:hair.vertex_groups[g].add([i],w,'REPLACE')
am=hair.modifiers.new('Same neck skinning','ARMATURE');am.object=rig
# Save local editable master and a web-ready rig. Only model objects are exported.
bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(root/'companion.blend'))
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);hair.select_set(True);rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root/'companion.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
print('MODEL_READY',len(verts),'hair vertices',len(faces),'hair quads')
