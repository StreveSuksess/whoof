import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[4]/'tmp/companion'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'source/source/Labrador.glb'))
for o in bpy.data.objects:
 if o.animation_data:o.animation_data_clear()
bpy.context.view_layer.update()
report=[]
for o in bpy.data.objects:
 entry={'name':o.name,'type':o.type,'location':list(o.location),'rotation':list(o.rotation_euler),'scale':list(o.scale),'dimensions':list(o.dimensions)}
 if o.type=='ARMATURE':
  entry['bones']=[{'name':b.name,'head':list(b.head_local),'tail':list(b.tail_local),'parent':b.parent.name if b.parent else None} for b in o.data.bones]
 if o.type=='MESH':entry.update(vertices=len(o.data.vertices),polygons=len(o.data.polygons),materials=[m.name for m in o.data.materials],vertexGroups=[g.name for g in o.vertex_groups])
 report.append(entry)
(root/'inventory.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(root/'original.blend'))
print(json.dumps(report))
