"""Length-preserving, grounded bend of the saved neutral walking lead."""
import math
from mathutils import Matrix, Vector

class LeashPose:
 def __init__(self, collection):
  self.collection=collection
  self.cord=next(o for o in collection.objects if o.name=='Woven walking lead')
  self.world=self.cord.matrix_world.copy()
  self.rest=[Vector(p.co[:3]) for p in self.cord.data.splines[0].points]
  count=len(self.rest)-1
  # Both endpoints lie inside molded sleeves; the whole handle stays fixed.
  self.start=round(count*8/21);self.end=round(count*15/21)
  self.arc=[0.]
  for a,b in zip(self.rest,self.rest[1:]):self.arc.append(self.arc[-1]+(b-a).length)
  self.curves={o.name:[[Vector(p.co[:3]) for p in s.points] for s in o.data.splines] for o in collection.objects if o.type=='CURVE'}
  self.matrices={o.name:o.matrix_world.copy() for o in collection.objects if o.type!='CURVE'}
  self.points=[p.copy() for p in self.rest]
  self.terminal=Matrix.Identity(4)
 def angle(self, arc, q):
  t=max(0.,min(1.,(arc-self.arc[self.start])/(self.arc[self.end]-self.arc[self.start])))
  return q*.22*math.sin(t*math.pi/2)**2
 def apply(self, q):
  points=[p.copy() for p in self.rest]
  for i in range(self.start+1,self.end+1):
   mid=(self.arc[i]+self.arc[i-1])*.5
   points[i]=points[i-1]+Matrix.Rotation(self.angle(mid,q),3,'Y')@(self.rest[i]-self.rest[i-1])
  end_rotation=Matrix.Rotation(q*.22,4,'Y')
  terminal=Matrix.Translation(points[self.end])@end_rotation@Matrix.Translation(-self.rest[self.end])
  for i in range(self.end+1,len(points)):points[i]=terminal@self.rest[i]
  rotations=[Matrix.Rotation(self.angle(s,q),3,'Y') for s in self.arc]
  for o in self.collection.objects:
   if o.type=='CURVE':
    for spline,rest in zip(o.data.splines,self.curves[o.name]):
     for j,(p,c) in enumerate(zip(spline.points,rest)):
      if o.name=='Woven walking lead':v=points[j]
      elif o.name.startswith('Braided lead fiber'):
       v=points[j]+rotations[j]@(c-self.rest[j])
      else:v=terminal@c
      p.co=(*v,1)
   elif o.name=='Handle double-cord molded splice':o.matrix_world=self.matrices[o.name]
   else:o.matrix_world=self.world@terminal@self.world.inverted()@self.matrices[o.name]
  self.points=points;self.terminal=terminal
  return points
 def contacts(self):
  # Contact only on free cord and rigid snap. Never drive the free end by
  # touching the anchored handle or an empty part of its loop.
  indices=list(range(self.start+38,self.end,36))+[self.end]
  segments=[(self.points[a],self.points[b]) for a,b in zip(indices,indices[1:])]
  hook=[self.rest[self.end],Vector((1.04,.079,.90)),Vector((1.065,.018,1.052)),Vector((.97,.018,1.22)),Vector((1.05,.018,1.35)),Vector((1.15,.018,1.25))]
  segments.extend((self.terminal@a,self.terminal@b) for a,b in zip(hook,hook[1:]))
  return segments
 def validate(self):
  original_lengths=[(b-a).length for a,b in zip(self.rest,self.rest[1:])]
  world_rest=[self.world@p for p in self.rest]
  world_lengths=[(b-a).length for a,b in zip(world_rest,world_rest[1:])]
  for i in range(65):
   q=(i-32)/32;points=self.apply(q)
   assert max(abs((b-a).length-length) for a,b,length in zip(points,points[1:],original_lengths))<2e-6,'Rope stretches'
   assert max(abs(a.y-b.y) for a,b in zip(points,self.rest))<2e-6,'Rope lifts off the pad'
   world_points=[self.world@p for p in points]
   assert max(abs(a.z-b.z) for a,b in zip(world_points,world_rest))<2e-6,'World-space ground contact changes'
   assert max(abs((b-a).length-length) for a,b,length in zip(world_points,world_points[1:],world_lengths))<2e-6,'World-space rope length changes'
   assert max((a-b).length for a,b in zip(points[:self.start+1],self.rest[:self.start+1]))<1e-7,'Handle moves'
   for name,splines in self.curves.items():
    if name.startswith('Braided lead fiber'):
     obj=self.collection.objects[name]
     for j in range(0,len(points),50):
      r=(splines[0][j]-self.rest[j]).length
      actual=(Vector(obj.data.splines[0].points[j].co[:3])-points[j]).length
      assert abs(actual-r)<2e-6,'Rope section shears'
    elif name!='Woven walking lead':
     obj=self.collection.objects[name]
     for p,c in zip(obj.data.splines[0].points,splines[0]):assert (Vector(p.co[:3])-self.terminal@c).length<2e-6,'Rigid hardware separates'
  self.apply(0)
