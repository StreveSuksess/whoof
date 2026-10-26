import bpy,math,json
from mathutils import Vector, Matrix
from pathlib import Path
root=Path(__file__).resolve().parents[4]/'tmp/companion'
bpy.ops.wm.open_mainfile(filepath=str(root/'original.blend'))
rig=bpy.data.objects['Dog Armature']
# World-space anatomical targets. Source points use Blender Z-up, nose toward -Y.
goals={
 'Back':((0,.85,.72),(0,.70,.79)),
 'Torso':((0,.46,.87),(0,.08,1.25)),
 'Torso2':((0,.08,1.25),(0,-.23,1.76)),
 'Torso3':((0,-.23,1.76),(0,-.40,2.06)),
 'Neck1':((0,-.40,2.06),(0,-.50,2.32)),
 'Neck2':((0,-.50,2.32),(0,-.63,2.46)),
 'Neck3':((0,-.63,2.46),(0,-.77,2.71)),
 'Head':((0,-.77,2.71),(0,-1.05,2.66)),
}
# Store transform matrices to reposition child ears/jaw and maintain their anatomical relationship.
deltas={}
def set_goal(name,head,tail,scale=False):
 b=rig.data.bones[name];pb=rig.pose.bones[name];h=Vector(head);t=Vector(tail)
 q=(b.tail_local-b.head_local).rotation_difference(t-h)
 d=Matrix.Translation(h)@q.to_matrix().to_4x4()@Matrix.Translation(-b.head_local)
 pb.matrix=d@b.matrix_local;deltas[name]=d;bpy.context.view_layer.update()
for name,points in goals.items():set_goal(name,*points)
for name in ['Ear1.L','Ear2.L','Ear3.L','Ear4.L','Ear1.R','Ear2.R','Ear3.R','Ear4.R','Neck3.001','Neck3.002']:
 b=rig.data.bones[name];d=deltas['Head']
 if name.startswith('Neck3.'):
  pivot=Vector((0,-.77,2.71));d=Matrix.Translation(pivot)@Matrix.Rotation(-.10,4,'X')@Matrix.Translation(-pivot)@d
 rig.pose.bones[name].matrix=d@b.matrix_local;bpy.context.view_layer.update()
for s,side in [(1,'L'),(-1,'R')]:
 set_goal('FrontShoulder.'+side,(s*.194,-.27,1.43),(s*.297,-.27,1.44))
 set_goal('FrontUpperLeg.'+side,(s*.297,-.27,1.44),(s*.31,-.29,1.08))
 set_goal('FrontLowerLeg.'+side,(s*.31,-.29,1.08),(s*.31,-.32,.726))
 for n in ['IKFrontLeg.','FF.']:
  b=rig.data.bones[n+side];offset=Vector((s*.014,.60,0));set_goal(n+side,b.head_local+offset,b.tail_local+offset)
 set_goal('BackShoulder.'+side,(s*.32,.77,.62),(s*.45,.77,.63))
 set_goal('BackLeg.'+side,(s*.45,.77,.63),(s*.56,.31,.49))
 # Imported shin is longer than weighted region; keep its rotation, use hip translation.
 set_goal('BackUpperLeg.'+side,(s*.56,.31,.49),(s*.56,1.05,.20))
 set_goal('BackLowerLeg.'+side,(s*.56,1.05,.20),(s*.56,.05,.04))
 for n in ['IKBackLeg.','FFB.']:
  b=rig.data.bones[n+side];offset=Vector((s*.17,-.80,0));set_goal(n+side,b.head_local+offset,b.tail_local+offset)
# Tail laid to side, not held up behind the seated rump.
pts=[(0,1,.69),(.07,1.15,.47),(.27,1.15,.28),(.53,1.11,.17),(.78,1,.10),(.92,.94,.09),(1.05,.87,.09)]
for i in range(6):set_goal('Tail'+str(i+1),pts[i],pts[i+1])
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(root/'seated.blend'))
(root/'pose.json').write_text(json.dumps({p.name:[list(row) for row in p.matrix] for p in rig.pose.bones},indent=2))
