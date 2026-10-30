import {BufferGeometry,Float32BufferAttribute,type InstancedMesh,Vector3} from 'three';
const TAU=Math.PI*2;
export function chooseYarnDetail(pixels:number,previous=-1){
  const thresholds=[420,800,1500];
  if(previous<0)return pixels<thresholds[0]?0:pixels<thresholds[1]?1:pixels<thresholds[2]?2:3;
  let level=previous;
  while(level<3&&pixels>thresholds[level]*1.12)level++;
  while(level>0&&pixels<thresholds[level-1]*.88)level--;
  return level;
}
/** Same continuous over/under yarn, only its sampling density changes. */
export function createYarnGeometry(steps:number,sides:number){
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[],colors:number[]=[];
  const center=(a:number)=>new Vector3(.0101*Math.cos(a),.0071*Math.sin(a),.003*Math.sin(2*a));
  for(let i=0;i<=steps;i++){
    const a=i/steps*TAU,p=center(a),tangent=center(a+.001).sub(p).normalize();
    const radial=new Vector3(Math.cos(a),Math.sin(a),0).normalize(),binormal=new Vector3().crossVectors(tangent,radial).normalize();
    for(let j=0;j<=sides;j++){
      const b=j/sides*TAU,rope=.0043*(1+.19*Math.cos(b*3-a*6));
      const v=p.clone().addScaledVector(radial,Math.cos(b)*rope).addScaledVector(binormal,Math.sin(b)*rope);
      positions.push(v.x,v.y,v.z);uvs.push(i/steps,j/sides);
      const occlusion=.42+.58*(.5+.5*Math.sin(a*2));colors.push(occlusion,occlusion,occlusion);
      if(i<steps&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
    }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export class CollarDetail{
  private level=-1;
  private geometries=[createYarnGeometry(8,5),createYarnGeometry(16,6),createYarnGeometry(24,7),createYarnGeometry(40,9)];
  constructor(private yarns:InstancedMesh[]){}
  update(projectedPixels:number){
    const level=chooseYarnDetail(projectedPixels,this.level);
    if(level===this.level)return false;this.level=level;
    this.yarns.forEach(mesh=>{mesh.geometry=this.geometries[level];});return true;
  }
  dispose(){this.geometries.forEach(g=>g.dispose());}
}
