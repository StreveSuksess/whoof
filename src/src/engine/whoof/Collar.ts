import { BufferGeometry, CanvasTexture, Color, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, RepeatWrapping, Shape, Path, TubeGeometry, CatmullRomCurve3, Vector3, BoxGeometry, InstancedMesh, Matrix4, Quaternion, Vector2 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

export function strapGeometry(rx = 1.7, rz = 1.26, width = .48, thickness = .06) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const segments = 256, corners = 4, arcSteps = 5, radius = .018;
  const profile: Vector2[] = [];
  for (let c = 0; c < corners; c++) {
    const angle = c * Math.PI / 2;
    const cx = (c === 0 || c === 3 ? 1 : -1) * (thickness / 2 - radius);
    const cy = (c < 2 ? 1 : -1) * (width / 2 - radius);
    for (let i = 0; i <= arcSteps; i++) {
      const a = angle + i / arcSteps * Math.PI / 2;
      profile.push(new Vector2(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius));
    }
  }
  const n = profile.length;
  for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2;
    for (let j = 0; j <= n; j++) {
      const p = profile[j % n];
      positions.push((rx + p.x) * Math.cos(a), p.y, (rz + p.x) * Math.sin(a));
      uvs.push(i / segments * 28, j / n * 2);
      if (i < segments && j < n) {
        const v = i * (n + 1) + j;
        indices.push(v, v + 1, v + n + 1, v + 1, v + n + 2, v + n + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  return geometry;
}

function wovenTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!, data = ctx.createImageData(128,128);
  for(let y=0;y<128;y++) for(let x=0;x<128;x++) {
    const cx=x%16, cy=y%16, swap=(Math.floor(x/16)+Math.floor(y/16))%2;
    const across=swap?cx:cy, along=swap?cy:cx;
    const ridge=Math.pow(Math.sin(Math.PI*across/16),.65)*(.72+.28*Math.sin(Math.PI*along/16));
    const fiber=.06*Math.sin((swap?x:y)*Math.PI*.85);
    const v=Math.round(60+(ridge+fiber)*160), k=(y*128+x)*4;
    data.data[k]=data.data[k+1]=data.data[k+2]=v; data.data[k+3]=255;
  }
  ctx.putImageData(data,0,0);
  const texture=new CanvasTexture(canvas); texture.wrapS=texture.wrapT=RepeatWrapping;texture.anisotropy=8;
  return texture;
}
function rounded(w:number,h:number,d:number,r:number,material:MeshStandardMaterial) {
  return new Mesh(new RoundedBoxGeometry(w,h,d,5,r),material);
}
function ring(w:number,h:number,depth:number,r:number,material:MeshStandardMaterial) {
  const path=(s:Shape|Path, width:number,height:number,rad:number)=>{
    const x=-width/2,y=-height/2;
    s.moveTo(x+rad,y);s.lineTo(x+width-rad,y);s.quadraticCurveTo(x+width,y,x+width,y+rad);
    s.lineTo(x+width,y+height-rad);s.quadraticCurveTo(x+width,y+height,x+width-rad,y+height);
    s.lineTo(x+rad,y+height);s.quadraticCurveTo(x,y+height,x,y+height-rad);
    s.lineTo(x,y+rad);s.quadraticCurveTo(x,y,x+rad,y);
  };
  const shape=new Shape();path(shape,w,h,r);const hole=new Path();path(hole,w-.07,h-.07,Math.max(.01,r-.035));shape.holes.push(hole);
  const geometry=new ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.012,bevelThickness:.01,curveSegments:10});geometry.translate(0,0,-depth/2);
  return new Mesh(geometry,material);
}

export async function createCollar() {
  const group=new Group(), housing=new Group(), shell=new Group();
  const textile=new MeshStandardMaterial({color:'#171819',roughness:.92,metalness:0,bumpMap:wovenTexture(),bumpScale:.018});
  const plastic=new MeshStandardMaterial({color:'#151619',roughness:.34,metalness:.12});
  const darkRubber=new MeshStandardMaterial({color:'#0c0d0f',roughness:.6,metalness:0});
  const faceMaterial=new MeshStandardMaterial({color:'#36383b',roughness:.28,metalness:.18});
  const band=new Mesh(strapGeometry(),textile);band.castShadow=true;group.add(band);
  const seams=new InstancedMesh(new BoxGeometry(.023,.004,.006),new MeshStandardMaterial({color:'#53524f',roughness:1}),512);
  const matrix=new Matrix4(), quaternion=new Quaternion();
  for(let i=0;i<256;i++) for(let edge=0;edge<2;edge++) {
    const a=i/256*Math.PI*2;quaternion.setFromAxisAngle(new Vector3(0,1,0),-a);
    matrix.compose(new Vector3(1.733*Math.cos(a),(edge?1:-1)*.197,1.293*Math.sin(a)),quaternion,new Vector3(1,1,1));seams.setMatrixAt(i*2+edge,matrix);
  }
  group.add(seams);
  // Rounded housing from the supplied file sits behind the woven band.
  const response=await fetch('/whoof/device.stl');if(!response.ok)throw new Error('Could not load Whoof housing');
  const stl=new STLLoader().parse(await response.arrayBuffer());stl.center();stl.scale(.027,.027,.027);
  const body=new Mesh(toCreasedNormals(stl,Math.PI/5),plastic);stl.dispose();body.castShadow=true;
  body.position.z=-.12;housing.add(body);
  const mounting=rounded(1.23,.71,.095,.11,darkRubber);mounting.position.z=-.04;housing.add(mounting);
  const frame=rounded(.62,.28,.065,.12,plastic);frame.position.z=.075;shell.add(frame);
  const actuator=rounded(.51,.19,.027,.085,faceMaterial);actuator.position.z=.115;shell.add(actuator);
  const led=rounded(.035,.006,.006,.002,new MeshStandardMaterial({color:'#deded4',emissive:'#6b7769',emissiveIntensity:.08}));led.position.set(.15,.001,.132);shell.add(led);
  housing.position.set(0,0,1.235);shell.position.copy(housing.position);group.add(housing,shell);
  for(const side of [-1,1]) {
    const keeper=ring(.12,.56,.085,.045,plastic);keeper.position.set(side*.78,0,1.15);keeper.rotation.y=side*.28;keeper.castShadow=true;group.add(keeper);
  }
  const buckle=new Group();
  const latch=rounded(.67,.56,.15,.075,plastic);buckle.add(latch);
  const groove=rounded(.016,.50,.006,.003,darkRubber);groove.position.set(.07,0,.081);buckle.add(groove);
  for(const side of [-1,1]) { const press=rounded(.26,.11,.045,.025,faceMaterial);press.position.set(-.16,side*.18,.072);buckle.add(press); }
  buckle.position.set(-.48,0,-1.18);buckle.rotation.y=Math.PI+.23;group.add(buckle);
  const adjuster=ring(.15,.55,.10,.04,plastic);adjuster.position.set(.61,0,-1.19);adjuster.rotation.y=Math.PI-.26;group.add(adjuster);
  group.traverse(obj=>{if(obj instanceof Mesh){obj.castShadow=true;obj.receiveShadow=true}});
  return {group,housing,shell,band};
}
