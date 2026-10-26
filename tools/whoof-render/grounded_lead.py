"""Continuous braided lead, closed handle splice and sewn terminal eye.
Coordinates are the original Three.js lead space (Y up); exported camera stays fixed.
"""
import bpy, math
from mathutils import Vector, Matrix

def replace_lead(collection, pose=0):
 old=next(o for o in collection.objects if o.name=='Woven walking lead')
 world=old.matrix_world.copy()
 for o in list(collection.objects):bpy.data.objects.remove(o,do_unlink=True)
 textile=bpy.data.materials['Charcoal braided lead'];fiber=bpy.data.materials['Braided lead threads'];metal=bpy.data.materials['Brushed nickel']
 rubber=bpy.data.materials.new('Matte molded lead splices');rubber.use_nodes=True
 p=rubber.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.006,.007,.0065,1);p.inputs['Roughness'].default_value=.53;p.inputs['Specular IOR Level'].default_value=.27
 def own(o,name,mat):
  o.name=name
  for c in list(o.users_collection):c.objects.unlink(o)
  collection.objects.link(o);o.data.materials.append(mat);return o
 def cord(name,points,r,mat):
  c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3
  s=c.splines.new('POLY');s.points.add(len(points)-1)
  for v,co in zip(s.points,points):v.co=(*co,1)
  o=bpy.data.objects.new(name,c);collection.objects.link(o);c.materials.append(mat);o.matrix_world=world
  return o
 def box(name,loc,scale,r,mat):
  bpy.ops.mesh.primitive_cube_add(size=1);o=own(bpy.context.object,name,mat);o.scale=scale
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  b=o.modifiers.new('Molded rounded edge','BEVEL');b.width=r;b.segments=8
  o.modifiers.new('Face weighted normals','WEIGHTED_NORMAL')
  for f in o.data.polygons:f.use_smooth=True
  o.matrix_world=world@Matrix.Translation(loc);return o
 def sample(points,count):
  # Catmull-Rom with short tangent at the ends, continuous at the splices.
  out=[]
  for k in range(count):
   f=k/(count-1)*(len(points)-1);i=min(len(points)-2,int(f));t=f-i
   p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(len(points)-1,i+2)])
   out.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
  return out
 h=.046
 controls=[(-.07,h,.35),(-.35,h,-.18),(-.58,h,-.72),(-.57,h,-1.18),(-.16,h,-1.48),(.28,h,-1.17),(.29,h,-.63),(-.15,h,.02),(-.18,h,.34),(-.18,h,.72),(.11,h,1.12),(.56,h,.76),(.65,h,.10),(.91,h,-.1),(1.18,h,.17),(1.065,h,.57),(1.005,h,.77),(.997,.079,.91),(1.07,.067,1.01),(1.17,h,.93),(1.12,h,.73),(1.10,h,.61)]
 points=sample(controls,1801)
 cord('Woven walking lead',points,.044,textile)
 # Twenty yarns in two crossing families, with constant arc-length pitch.
 distance=[0]
 for i in range(1,len(points)):distance.append(distance[-1]+(points[i]-points[i-1]).length)
 for strand in range(20):
  yarn=[];sign=1 if strand<10 else -1
  for j,c in enumerate(points):
   tangent=(points[min(len(points)-1,j+1)]-points[max(0,j-1)]).normalized();up=Vector((0,1,0));side=tangent.cross(up).normalized()
   phase=distance[j]*math.tau*7.5*sign+(strand%10)*math.tau/10
   radius=.044+.0017*math.sin(distance[j]*math.tau*15+(strand%10)*math.pi)
   yarn.append(c+radius*(up*math.cos(phase)+side*math.sin(phase)))
  cord(f'Braided lead fiber {strand}',yarn,.0042,fiber)
 box('Handle double-cord molded splice',(-.13,.0525,.34),(.235,.125,.38),.055,rubber)
 # The cut terminal end disappears inside this second sleeve beside the live cord.
 box('Terminal eye molded splice',(1.093,.053,.64),(.19,.126,.265),.050,rubber)
 # Metal eye stands through the rope loop: loop goes through its opening at z=.90.
 eye=[]
 for j in range(129):
  t=j/128*math.tau;eye.append((1.0+.078*math.cos(t),.079+.072*math.sin(t),.901))
 cord('Closed swivel eye through sewn rope loop',eye,.015,metal)
 cord('Swivel eye lower shank',[(1.0,.016,.901),(1.0,.022,.985),(1.066,.022,1.009)],.027,metal)
 # Swivel shank and snap hook lie on the pad. No unsupported floating barrel.
 box('Swivel barrel',(1.066,.022,1.009),(.078,.064,.155),.031,metal)
 # Cast snap bow with an opening closed by a separate spring gate.
 hook=sample([(1.065,.018,1.052),(.982,.018,1.084),(.961,.018,1.218),(.981,.018,1.321),(1.05,.018,1.354),(1.131,.018,1.329),(1.152,.018,1.258)],201)
 cord('Cast rounded snap hook',hook,.027,metal)
 cord('Straight spring gate',[(1.143,.020,1.278),(1.134,.020,1.097)],.014,metal)
 box('Spring gate pivot',(1.128,.020,1.105),(.05,.045,.058),.018,metal)
 # Cache pristine coordinates so each pose is derived from rest, never accumulated.
 original={}
 for o in collection.objects:
  if o.type=='CURVE':original[o.name]=[[tuple(p.co) for p in s.points] for s in o.data.splines]
  else:original[o.name]=o.matrix_world.copy()
 def deform(q):
  # Fixed handle and first splice; the free end bends across the tabletop.
  # Cubic falloff on the original local X keeps the two handle branches still.
  def weight(x):
   t=max(0,min(1,(x-.35)/.70));return t*t*(3-2*t)
  for o in collection.objects:
   if o.type=='CURVE':
    for s,coords in zip(o.data.splines,original[o.name]):
     for p,c in zip(s.points,coords):p.co=(c[0]+q*.09*(weight(c[0]) if o.name.startswith(('Woven','Braided')) else 1),c[1],c[2],1)
   else:
    rest=original[o.name];local=world.inverted()@rest.translation
    o.matrix_world=world@Matrix.Translation((q*.09*weight(local.x),0,0))@world.inverted()@rest
  bpy.context.view_layer.update()
 deform(pose)
 return deform,world
