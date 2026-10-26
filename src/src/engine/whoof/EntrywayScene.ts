import {
  BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, ExtrudeGeometry, Group,
  Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  Path, PerspectiveCamera, PlaneGeometry, PMREMGenerator, RepeatWrapping, Scene,
  Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2,
  Vector3, WebGLRenderer,
} from 'three';

// One unit is roughly 10 cm for this composition, not a certified product size.
// The collar is ~22 cm across; keys, rope and ball use the same relative scale.
const TAU = Math.PI * 2;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const fract = (n: number) => n - Math.floor(n);
function random(x: number, y: number) { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453); }
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = fract(x), fy = fract(y);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = random(ix, iy), b = random(ix + 1, iy), c = random(ix, iy + 1), d = random(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function texture(kind: 'oak' | 'fabric' | 'rubber') {
  const canvas = document.createElement('canvas');
  canvas.width = kind === 'oak' ? 1024 : 256; canvas.height = canvas.width;
  const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(canvas.width, canvas.height);
  const size = canvas.width;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let value: number;
    if (kind === 'oak') {
      const bend = noise(x / 310, y / 185) * 13 + noise(x / 110, y / 71) * 2.5;
      const grain = Math.sin(y * .58 + bend) * .5 + .5;
      const pores = Math.pow(grain, 12) * noise(x / 18, y / 3);
      value = 173 + noise(x / 340, y / 26) * 22 + noise(x / 29, y / 1.8) * 12 - pores * 18 + random(x, y) * 4;
    } else if (kind === 'fabric') {
      value = 174 + Math.sin(x * Math.PI * .5) * 12 + Math.cos(y * Math.PI * .5 + (x % 4 < 2 ? 0 : Math.PI)) * 10 + random(x, y) * 16;
    } else value = 193 + noise(x / 3, y / 3) * 24 + random(x, y) * 12;
    const i = (y * size + x) * 4;
    pixels.data.set([value, value, value, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const t = new CanvasTexture(canvas); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function mesh<G extends Mesh['geometry']>(g: G, material: MeshStandardMaterial | MeshPhysicalMaterial, name: string) {
  const m = new Mesh(g, material); m.name = name; m.castShadow = true; m.receiveShadow = true; return m;
}
function rounded(w: number, h: number, d: number, radius: number, material: MeshStandardMaterial, name: string) {
  // Start from a UNIT cube: bevel normals are derived in normalized space.
  // Deriving them from the final (very flat) box tilts its entire top surface.
  const segments=9,r=Math.min(radius,w/2,h/2,d/2),g=new BoxGeometry(1,1,1,segments,segments,segments).toNonIndexed();
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,normal=new Vector3();
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i);
    normal.set(x-Math.sign(x)*.5/segments,y-Math.sign(y)*.5/segments,z-Math.sign(z)*.5/segments).normalize();
    const px=Math.sign(x)*(w/2-r)+normal.x*r,py=Math.sign(y)*(h/2-r)+normal.y*r,pz=Math.sign(z)*(d/2-r)+normal.z*r;
    p.setXYZ(i,px,py,pz);n.setXYZ(i,normal.x,normal.y,normal.z);
    if(Math.abs(ny)>.5)uv.setXY(i,px/w+.5,pz/d+.5);
    else if(Math.abs(nx)>.5)uv.setXY(i,pz/d+.5,py/h+.5);
    else uv.setXY(i,px/w+.5,py/h+.5);
  }
  return mesh(g,material,name);
}
function cord(points: Vector3[], radius: number, material: MeshStandardMaterial, closed = false, segments = 100) {
  return mesh(new TubeGeometry(new CatmullRomCurve3(points, closed, 'centripetal'), segments, radius, 10, closed), material, 'Woven walking lead');
}
function roundShape(w: number, h: number, r: number) {
  const s = new Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s;
}
function metalPlate(shape: Shape, depth: number, material: MeshStandardMaterial, name: string) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, bevelSize: .007, bevelThickness: .005, curveSegments: 24, steps: 1 });
  g.rotateX(-Math.PI / 2); return mesh(g, material, name);
}
function keys() {
  const group = new Group(); group.name = 'House keys';
  const metal = new MeshStandardMaterial({ color: '#a1a39e', metalness: .95, roughness: .28 });
  const darkMetal = new MeshStandardMaterial({ color: '#858a84', metalness: .92, roughness: .3 });
  const ring = mesh(new TorusGeometry(.16, .015, 10, 72), metal, 'Split key ring'); ring.rotation.x = Math.PI / 2; ring.position.y = .031; group.add(ring);
  const ring2 = ring.clone(); ring2.position.y += .018; ring2.rotation.z = .07; group.add(ring2);
  for (let i = 0; i < 2; i++) {
    const key = new Group(); key.rotation.y = i ? -.56 : .27;
    const s = new Shape();
    s.moveTo(-.115, .11); s.quadraticCurveTo(-.17, -.05, -.07, -.14);
    s.lineTo(-.053, -.52); s.lineTo(.012, -.56); s.lineTo(.058, -.51);
    for (const [x, y] of [[.058,-.45],[.025,-.43],[.025,-.4],[.073,-.38],[.073,-.34],[.032,-.31],[.064,-.27],[.064,-.14]]) s.lineTo(x,y);
    s.quadraticCurveTo(.16,-.08,.12,.08); s.quadraticCurveTo(0,.2,-.115,.11);
    const hole = new Path(); hole.absellipse(0,.055,.062,.041,0,TAU,true,0); s.holes.push(hole);
    const plate = metalPlate(s, .019, i ? darkMetal : metal, 'Cut house key'); plate.position.set(0,.023+i*.024,.14); key.add(plate);
    const groove = rounded(.019,.004,.28,.002,darkMetal,'Key groove'); groove.position.set(-.023,.05+i*.024,.48); key.add(groove); group.add(key);
  }
  const tagMat = new MeshPhysicalMaterial({color:'#333b33',roughness:.72});
  const tag = roundShape(.30,.70,.10); const hole = new Path(); hole.absarc(0,.24,.045,0,TAU,true); tag.holes.push(hole);
  const fob = metalPlate(tag,.035,tagMat,'Leather key fob'); fob.position.set(.28,.008,-.19); fob.rotation.y=-.60;group.add(fob);
  return group;
}
function leash() {
  const group = new Group(); group.name = 'Walking lead';
  const weave = texture('fabric'); weave.repeat.set(22, 2);
  const textile = new MeshPhysicalMaterial({color:'#252d28',roughness:.83,map:weave,bumpMap:weave,bumpScale:.006,sheen:.5,sheenColor:'#677162',sheenRoughness:.8});
  // A loose handle and folded lead. Height changes at crossings are real geometry.
  const points = [new Vector3(-.06,.068,.40),new Vector3(-.50,.07,-.40),new Vector3(-.62,.07,-1.18),new Vector3(-.16,.07,-1.52),new Vector3(.31,.07,-1.19),new Vector3(.28,.07,-.62),new Vector3(-.12,.13,.02),new Vector3(-.18,.075,.72),new Vector3(.11,.075,1.12),new Vector3(.56,.075,.76),new Vector3(.65,.075,.10),new Vector3(.91,.075,-.1),new Vector3(1.18,.075,.17),new Vector3(1.02,.075,.69)];
  group.add(cord(points,.051,textile,false,190));
  // Fine twisted strand relief follows the same curve and tangent frame.
  const curve = new CatmullRomCurve3(points,false,'centripetal'); const frames=curve.computeFrenetFrames(220,false);
  const fibers=new MeshStandardMaterial({color:'#41483f',roughness:.9});
  for(let strand=0;strand<4;strand++) {
    const p:Vector3[]=[];
    for(let j=0;j<=220;j++) {const phase=j/220*TAU*70+strand*TAU/4; p.push(curve.getPointAt(j/220).addScaledVector(frames.normals[j],Math.cos(phase)*.048).addScaledVector(frames.binormals[j],Math.sin(phase)*.048));}
    group.add(cord(p,.004,fibers,false,440));
  }
  const rubber=new MeshStandardMaterial({color:'#141b16',roughness:.57});
  const bind=rounded(.16,.14,.33,.045,rubber,'Lead splice');bind.position.set(-.14,.10,.29);bind.rotation.y=.24;group.add(bind);
  const metal=new MeshStandardMaterial({color:'#a5aaa5',metalness:1,roughness:.23});
  const clip=new Group();clip.position.set(1.0,.08,.98);clip.rotation.y=-.3;
  const loop=roundShape(.21,.40,.095);const hole=new Path();hole.absellipse(0,0,.063,.15,0,TAU,true,0);loop.holes.push(hole);
  clip.add(metalPlate(loop,.028,metal,'Swivel snap hook'));
  const neck=rounded(.12,.11,.18,.035,metal,'Swivel barrel');neck.position.set(0,.025,-.28);clip.add(neck);
  const gate=rounded(.024,.035,.21,.011,metal,'Hook spring gate');gate.position.set(.074,.048,.005);clip.add(gate);group.add(clip);
  return group;
}
function ball() {
  const group=new Group();group.name='Play ball';
  const grain=texture('rubber');grain.repeat.set(5,5);
  const mat=new MeshPhysicalMaterial({color:'#b5b097',roughness:.88,bumpMap:grain,bumpScale:.008,sheen:.22,sheenColor:'#c2bda3',sheenRoughness:1});
  const sphere=mesh(new SphereGeometry(.32,48,32),mat,'Soft rubber ball');sphere.position.y=.322;group.add(sphere);
  const seamMat=new MeshStandardMaterial({color:'#777c67',roughness:1});
  const points:Vector3[]=[];
  for(let i=0;i<160;i++){const a=i/160*TAU,latitude=.54*Math.sin(2*a);points.push(new Vector3(.321*Math.cos(latitude)*Math.cos(a),.322+.321*Math.sin(latitude),.321*Math.cos(latitude)*Math.sin(a)));}
  group.add(cord(points,.0055,seamMat,true,180));return group;
}

interface Prop {
  group:Group; home:Vector3; angle:number; radius:number;
  offset:Vector2; velocity:Vector2; turn:number; spin:number;
}

/** Source-inspired mouse impulse + spring return, in a shared 3D coordinate space. */
export class EntrywayScene {
  group=new Group(); props:Prop[]=[];
  private mouse=new Vector2(10,10); private lastMouse=new Vector2(10,10); private projected=new Vector3();
  private initialized=false;
  constructor() {
    this.group.name='Whoof tabletop';
    const oak=texture('oak');oak.repeat.set(1.5,1.2);
    const timber=new MeshStandardMaterial({color:'#8c897f',map:oak,bumpMap:oak,bumpScale:.012,roughness:.68});
    const desk=rounded(24,.20,20,.07,timber,'Ash console tabletop');desk.position.y=-.10;desk.receiveShadow=true;desk.castShadow=false;this.group.add(desk);
    const cloth=texture('fabric');cloth.repeat.set(70,50);
    const felt=new MeshPhysicalMaterial({color:'#6b776b',map:cloth,bumpMap:cloth,bumpScale:.0028,roughness:.93,sheen:.2,sheenColor:'#929b88',sheenRoughness:1});
    const mat=rounded(6.65,.043,8.5,.018,felt,'Wool landing mat');mat.position.set(.65,.019,-1.5);mat.rotation.y=-.095;mat.castShadow=true;this.group.add(mat);
    this.addProp(leash(),new Vector3(2.82,.05,-.30),-.24,1.45);
    this.addProp(keys(),new Vector3(-2.78,0,-.78),.15,.58);
    this.addProp(ball(),new Vector3(3.78,0,1.43),0,.46);
  }
  private addProp(group:Group, home:Vector3, angle:number, radius:number) {
    group.position.copy(home);group.rotation.y=angle;this.group.add(group);
    this.props.push({group,home,angle,radius,offset:new Vector2(),velocity:new Vector2(),turn:0,spin:0});
  }
  update(camera:PerspectiveCamera, px:number,py:number,dt:number,enabled:boolean) {
    let moving=false;this.mouse.set(px,-py);
    if(!this.initialized){this.lastMouse.copy(this.mouse);this.initialized=true;}
    const vx=clamp((this.mouse.x-this.lastMouse.x)/Math.max(dt,.008),-4,4),vy=clamp((this.mouse.y-this.lastMouse.y)/Math.max(dt,.008),-4,4);
    camera.updateMatrixWorld();
    for(const prop of this.props) {
      if(enabled) {
        this.projected.copy(prop.home).project(camera);
        const distance=Math.hypot((this.mouse.x-this.projected.x)*camera.aspect,this.mouse.y-this.projected.y);
        const radius=prop.radius/4.8;
        if(distance<radius){const strength=(1-distance/radius)*2;prop.velocity.x+=vx*strength*.65;prop.velocity.y-=vy*strength*.65;prop.spin+=(vx*(this.mouse.y-this.projected.y)-vy*(this.mouse.x-this.projected.x))*strength*1.8;}
        // Critically damped translation and slightly softer rotational return.
        prop.velocity.addScaledVector(prop.offset,-45*dt).multiplyScalar(Math.exp(-10*dt));
        prop.offset.addScaledVector(prop.velocity,dt).clampLength(0,.16);
        prop.spin=(-prop.turn*38*dt+prop.spin)*Math.exp(-8*dt);prop.turn=clamp(prop.turn+prop.spin*dt,-.12,.12);
      } else {prop.offset.set(0,0);prop.velocity.set(0,0);prop.turn=prop.spin=0;}
      prop.group.position.copy(prop.home).add(new Vector3(prop.offset.x,0,prop.offset.y));prop.group.rotation.y=prop.angle+prop.turn;
      if(prop.offset.lengthSq()+prop.velocity.lengthSq()+prop.turn**2+prop.spin**2>.00000005)moving=true;
    }
    this.lastMouse.copy(this.mouse);return moving;
  }
  setMobile(mobile:boolean) {
    // Keep the collar's neighbours in physical scale; crop them at the viewport edge.
    this.props[0].home.x=mobile?1.62:2.82;this.props[0].home.z=mobile?-1.1:-.30;
    this.props[1].home.x=mobile?-1.72:-2.78;this.props[1].home.z=mobile?-1.02:-.78;
    this.props[2].home.x=mobile?2.15:3.78;
  }
}

/** Broad window, pale wall bounce and dark floor. Same key direction as hero shadows. */
export function entrywayEnvironment(renderer:WebGLRenderer) {
  const room=new Scene();room.background=new Color('#85877e');
  function panel(x:number,y:number,z:number,w:number,h:number,color:Color) {
    const m=new Mesh(new PlaneGeometry(w,h),new MeshBasicMaterial({color,toneMapped:false}));m.position.set(x,y,z);m.lookAt(0,0,0);room.add(m);
  }
  panel(-5,7,-3,7,7,new Color(5,5.1,4.9));
  panel(0,6,-4,8,3,new Color(1.2,1.25,1.15));
  panel(4,3,0,8,6,new Color(.42,.46,.40));
  panel(0,-3,0,20,20,new Color(.12,.13,.10));
  const generator=new PMREMGenerator(renderer),target=generator.fromScene(room,.04);generator.dispose();
  room.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();(o.material as MeshBasicMaterial).dispose();}});return target.texture;
}
