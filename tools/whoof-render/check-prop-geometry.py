"""Validate real surface contact and key intersections on both saved final scenes.
Run Blender -b --python tools/whoof-render/check-prop-geometry.py
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];TMP=ROOT.parent/'tmp/whoof-render'
for fmt in ['landscape','portrait']:
 bpy.ops.wm.open_mainfile(filepath=str(TMP/f'hero-v22-{fmt}.blend'))
 groups=[o for o in bpy.data.collections['House keys'].objects if 'hole_anchor' in o]
 for q in [(i-8)/8 for i in range(17)]:
  for i,g in enumerate(groups):
   g.rotation_euler=(g['rest_tilt'],0,g['rest_angle']+q*(.15 if i==0 else .075))
   g.location=Vector(g['hole_anchor'])-g.rotation_euler.to_matrix()@Vector((0,.02,0))
  bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();trees=[]
  for name in ['Nickel cylinder key','Brass spare cylinder key']:
   o=bpy.data.objects[name];e=o.evaluated_get(deps);m=e.to_mesh()
   vertices=[o.matrix_world@v.co for v in m.vertices]
   pad=bpy.data.objects['Woven landing pad'];inverse=pad.matrix_world.inverted();half=pad.dimensions*.5
   for vertex in vertices:
    v=inverse@vertex
    assert not (abs(v.x)<half.x-.005 and abs(v.y)<half.y-.005 and v.z<half.z-.001),(fmt,q,name,'key penetrates pad')
   trees.append(BVHTree.FromPolygons(vertices,[tuple(f.vertices) for f in m.polygons]))
   bottom=min(v.z for v in vertices);assert -.001<bottom<.004,(fmt,q,name,'table contact',bottom)
   hole=o.matrix_world@Vector((0,.02,0));anchor=o.parent.parent.matrix_world@Vector(o.parent['hole_anchor'])
   assert (hole-anchor).length<1e-5,(name,'lost ring pivot')
   e.to_mesh_clear()
  overlaps=trees[0].overlap(trees[1]);assert not overlaps,(fmt,q,'intersecting keys',len(overlaps))
 sphere=bpy.data.objects['Soft rubber ball'];contact=sphere.matrix_world.translation.z-.32
 assert abs(contact-.042)<.001,(fmt,'ball pad contact',contact)
 print(fmt,'PASS: keys do not intersect across all 17 poses; key tips rest on wood; pivots fixed; ball sits on pad',flush=True)
