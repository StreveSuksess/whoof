import bpy,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[4]/'tmp/companion';bpy.ops.wm.open_mainfile(filepath=str(root/'original.blend'));o=bpy.data.objects['Object_0'];m=o.data
adj=[[] for v in m.vertices]
for e in m.edges:
 a,b=e.vertices;adj[a].append(b);adj[b].append(a)
seen=set();parts=[]
for i in range(len(adj)):
 if i in seen:continue
 todo=[i];seen.add(i);ids=[]
 while todo:
  q=todo.pop();ids.append(q)
  for n in adj[q]:
   if n not in seen:seen.add(n);todo.append(n)
 coords=[m.vertices[k].co for k in ids]
 parts.append({'count':len(ids),'min':[min(v[k] for v in coords) for k in range(3)],'max':[max(v[k] for v in coords) for k in range(3)],'ids':ids})
parts.sort(key=lambda x:-x['count']);(root/'parts.json').write_text(json.dumps(parts))
for i,p in enumerate(parts):
 if p['count']>10:print(i,p['count'],p['min'],p['max'])
