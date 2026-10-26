"""Manufactured house keys and an unbranded dog-walk bag dispenser, in Blender units."""
import bpy, math, random
from mathutils import Vector, Matrix

def replace_walk_keys(collection, portrait=False):
 for o in list(collection.objects):bpy.data.objects.remove(o,do_unlink=True)
 def own(o,name,mat=None,parent=None):
  o.name=name
  for c in list(o.users_collection):c.objects.unlink(o)
  collection.objects.link(o)
  if mat:o.data.materials.append(mat)
  if parent:o.parent=parent
  return o
 def material(name,color,rough,metal=0):
  m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
  p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
  return m,p
 nickel,p=material('Satin nickel key blank',(.34,.35,.335),.30,1);p.inputs['Anisotropic'].default_value=.45
 brass,p=material('Aged nickel-brass spare',(.29,.25,.185),.34,1);p.inputs['Anisotropic'].default_value=.35
 dark,p=material('Machined groove interior',(.12,.13,.12),.36,1)
 steel,p=material('Split ring polished steel',(.40,.42,.40),.20,1)
 polymer,p=material('Dispenser warm slate elastomer',(.058,.066,.061),.55);p.inputs['Specular IOR Level'].default_value=.30
 black,p=material('Dispenser recessed outlet',(.006,.008,.006),.80)
 bag,p=material('Folded olive bag film',(.105,.13,.088),.60);p.inputs['Sheen Weight'].default_value=.16
 # Microscopic directionality in the stock, not a smooth chrome toy surface.
 for m in (nickel,brass):
  n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=1;tex.inputs['Detail'].default_value=2
  coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeMapping');mapping.inputs['Scale'].default_value=(220,8,70)
  l.new(coord.outputs['Generated'],mapping.inputs['Vector']);l.new(mapping.outputs[0],tex.inputs[0])
  bump=n.new('ShaderNodeBump');bump.inputs['Distance'].default_value=.00013;bump.inputs['Strength'].default_value=.26
  l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],p.inputs['Normal'])
  ramp=n.new('ShaderNodeMapRange');ramp.inputs['To Min'].default_value=.24;ramp.inputs['To Max'].default_value=.4
  l.new(tex.outputs['Fac'],ramp.inputs['Value']);l.new(ramp.outputs[0],p.inputs['Roughness'])
 def bevel(o,w):
  b=o.modifiers.new('Small manufactured chamfer','BEVEL');b.width=w;b.segments=8
  for face in o.data.polygons:face.use_smooth=True
  b=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');b.keep_sharp=True
  return o
 def box(name,loc,scale,radius,mat,parent=None):
  bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=own(bpy.context.object,name,mat,parent);o.scale=scale
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  return bevel(o,radius)
 def curve(name,points,radius,mat,parent=None):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=3
  s=c.splines.new('POLY');s.points.add(len(points)-1)
  for p,v in zip(s.points,points):p.co=(*v,1)
  o=bpy.data.objects.new(name,c);collection.objects.link(o);c.materials.append(mat)
  if parent:o.parent=parent
  return o
 def empty(name):
  o=bpy.data.objects.new(name,None);collection.objects.link(o);return o
 def applymod(o,mod):
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 def cut(o,cutter):
  # Bake preceding solidification and edge modifiers before exact boolean cuts.
  for mod in list(o.modifiers):applymod(o,mod)
  m=o.modifiers.new('Machining','BOOLEAN');m.operation='DIFFERENCE';m.object=cutter;applymod(o,m)
  bpy.data.objects.remove(cutter,do_unlink=True)
 def cylinder(name,loc,r,depth,mat,parent=None):
  bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=depth,location=loc)
  return own(bpy.context.object,name,mat,parent)
 root=empty('Walk key set');root.location=(-2.58+(.74 if portrait else 0),.50,.0);root.rotation_euler.z=-.1
 # Ring stands at an oblique angle: its wire actually threads the key holes.
 # Its lowest wire touches the table. The two turns are offset along its normal.
 ring_tilt=math.radians(64);ring_radius=.151;ring_z=ring_radius*math.sin(ring_tilt)+.0108
 def ring_point(t,turn=0):
  return Vector((ring_radius*math.cos(t),ring_radius*math.sin(t)*math.cos(ring_tilt)-turn*.014*math.sin(ring_tilt),ring_z+ring_radius*math.sin(t)*math.sin(ring_tilt)+turn*.014*math.cos(ring_tilt)))
 pts=[ring_point(-.25+j/320*math.tau*1.94,j/320) for j in range(321)]
 curve('Double split ring with cut ends',pts,.0085,steel,root)
 for i in range(2):
  group=empty('Main house key' if i==0 else 'Spare house key');group.parent=root
  anchor=ring_point(-2.04 if i==0 else -.68,.4)
  angle=(-.22 if portrait else -.48) if i==0 else (.22 if portrait else .43)
  tilt=math.atan2(anchor.z-.013,.65)
  group.rotation_euler=(tilt,0,angle)
  group.location=anchor-group.rotation_euler.to_matrix()@Vector((0,.020,0))
  group['hole_anchor']=list(anchor);group['rest_angle']=angle;group['rest_tilt']=tilt
  # Different head shapes; narrow blade with genuine sloped bitting shoulders.
  if i==0:
   outline=[(-.068,-.15),(-.068,-.61),(-.035,-.65),(.049,-.65),(.061,-.60),(.061,-.55),(.026,-.521),(.061,-.492),(.061,-.459),(.043,-.435),(.043,-.410),(.074,-.381),(.074,-.349),(.034,-.321),(.055,-.294),(.055,-.270),(.080,-.245),(.080,-.16),(.116,-.137),(.144,-.10),(.152,-.035),(.131,.04),(.085,.086),(-.086,.086),(-.135,.045),(-.152,-.035),(-.140,-.10),(-.111,-.138)]
  else:
   outline=[(-.065,-.15),(-.065,-.59),(-.022,-.638),(.042,-.638),(.064,-.60),(.064,-.55),(.034,-.515),(.068,-.482),(.068,-.453),(.028,-.418),(.069,-.385),(.069,-.355),(.052,-.326),(.074,-.294),(.074,-.159),(.126,-.118),(.142,-.072),(.14,.054),(.071,.103),(-.08,.10),(-.142,.044),(-.14,-.069),(-.12,-.122)]
  mesh=bpy.data.meshes.new('Stamped blank outline');mesh.from_pydata([(x,y,0) for x,y in outline],[],[tuple(range(len(outline)))]);mesh.update()
  key=bpy.data.objects.new('Nickel cylinder key' if i==0 else 'Brass spare cylinder key',mesh);collection.objects.link(key);key.data.materials.append(nickel if i==0 else brass)
  solid=key.modifiers.new('Stock thickness 2mm','SOLIDIFY');solid.thickness=.023;solid.offset=0;applymod(key,solid)
  hole=cylinder('Key ring hole',(0,.020,0),.041,.2,None);cut(key,hole)
  # True shallow channels, with real exposed sidewalls.
  for x,w,depth in [(-.031,.021,.006),(.009,.013,.004)]:
   cutter=box('Longitudinal milling tool',(x,-.385,.0115),(w,.44,depth*2),.002,None)
   for mod in list(cutter.modifiers):applymod(cutter,mod)
   cut(key,cutter)
  bevel(key,.0018);key.parent=group
  # Fine stamped head outline and a few discontinuous handling scratches.
  curve('Head stamped edge',[(-.105,-.072,.012),(-.095,.024,.012),(-.066,.055,.012),(.066,.055,.012),(.105,.022,.012)],.0012,dark,group)
  random.seed(24+i)
  for j in range(9):
   x=random.uniform(-.09,.08);y=random.uniform(-.12,-.060);length=random.uniform(.015,.052)
   curve('Fine key wear',[(x,y,.0123),(x+length,y+.007,.0123)],.00032,dark,group)
  # Tiny stamped manufacturing code, intentionally not a third-party brand.
  c=bpy.data.curves.new('Key blank stamp','FONT');c.body='72' if i==0 else '6';c.size=.039;c.extrude=.00015;c.align_x='CENTER'
  ob=bpy.data.objects.new('Stamped key code',c);collection.objects.link(ob);c.materials.append(dark);ob.parent=group;ob.location=(0,-.098,.0122)
 # Compact bag dispenser. Its soft attachment loop is physically connected to the ring.
 dispenser=empty('Dog walk bag dispenser');dispenser.parent=root;dispenser.location=(.23,.35,.174);dispenser.rotation_euler.z=-.36
 body=box('Rounded matte dispenser body',(0,0,0),(.35,.67,.30),.137,polymer)
 # Oval through outlet on the top-facing surface; actual cavity + dark internal roll.
 cutter=box('Dispensing aperture cutter',(0,-.035,.14),(.094,.245,.15),.041,None)
 for mod in list(cutter.modifiers):applymod(cutter,mod)
 cut(body,cutter);bevel(body,.0025);body.parent=dispenser
 inside=box('Bag roll inside aperture',(0,-.035,.085),(.12,.26,.04),.02,black,dispenser)
 # Cap lip and thin join at the far end, separate material gap.
 cap=box('Twist-off end cap',(0,.266,0),(.346,.157,.296),.074,polymer,dispenser)
 points=[]
 for j in range(97):
  t=math.tau*j/96;points.append((.166*math.cos(t),.22,.14*math.sin(t)))
 curve('Fine cap assembly seam',points,.0015,black,dispenser)
 # Closed flexible loop: its lower span crosses the open interior of the ring;
 # both upper ends disappear into the molded dispenser eye.
 attach=[(.105,.19,.105),(.075,.13,.068),(.021,.068,.055),(-.016,.029,.070),(-.029,.014,.104),(-.014,.034,.135),(.040,.095,.148),(.101,.181,.146),(.105,.19,.105)]
 # Smooth Bezier interpolation avoids angular silicone wire.
 c=bpy.data.curves.new('Closed silicone loop','CURVE');c.dimensions='3D';c.bevel_depth=.012;c.bevel_resolution=4;c.resolution_u=16
 spl=c.splines.new('BEZIER');spl.bezier_points.add(len(attach)-2)
 for point,co in zip(spl.bezier_points,attach[:-1]):point.co=co;point.handle_left_type='AUTO';point.handle_right_type='AUTO'
 spl.use_cyclic_u=True
 o=bpy.data.objects.new('Closed dispenser attachment through ring',c);collection.objects.link(o);c.materials.append(polymer);o.parent=root
 # A folded, irregular bag tip makes the object's use legible without branding.
 verts=[];faces=[]
 for j in range(9):
  t=j/8
  for k in range(5):
   u=k/4;verts.append(((u-.5)*(.073+.024*t),-.038-.235*t,.15+.039*math.sin(t*math.pi)+.008*math.sin(u*math.tau*1.5+t*5)))
 for j in range(8):
  for k in range(4):a=j*5+k;faces.append((a,a+1,a+6,a+5))
 mesh=bpy.data.meshes.new('Crumpled bag film');mesh.from_pydata(verts,[],faces);mesh.update()
 ob=bpy.data.objects.new('Single bag tip',mesh);collection.objects.link(ob);mesh.materials.append(bag);ob.parent=dispenser
 for p in mesh.polygons:p.use_smooth=True
 sol=ob.modifiers.new('Thin film thickness','SOLIDIFY');sol.thickness=.001
 # Raised same-material paw mark on the cap, small enough to read as molded detail.
 for x,y,sx,sy in [(0,.255,.023,.020),(-.027,.282,.009,.012),(0,.293,.009,.012),(.027,.282,.009,.012)]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=(x,y,.146))
  ob=own(bpy.context.object,'Subtle molded paw',polymer,dispenser);ob.scale=(sx,sy,.007)
  for p in ob.data.polygons:p.use_smooth=True
 bpy.context.view_layer.update()
 return root
