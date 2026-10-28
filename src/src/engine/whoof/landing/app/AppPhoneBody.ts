import {BufferGeometry,Float32BufferAttribute,Group,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,Shape,ShapeGeometry,DoubleSide,type Data3DTexture} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {applyOpeningColorLook} from '../../OpeningLighting';

export function phoneOutline(w:number,h:number,r:number){
  const s=new Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-Math.PI/2,0,false);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,Math.PI/2,false);s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,Math.PI/2,Math.PI,false);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,Math.PI,Math.PI*1.5,false);return s;
}
export function phoneFace(w:number,h:number,r:number){return new ShapeGeometry(phoneOutline(w,h,r),32);}

/** Machined sidewall: one continuous rounded profile, no stacked extruded rims. */
export function phoneSidewall(){
  const w=2.11,h=4.44,r=.30,profile=[[-.136,.020],[-.132,.010],[-.123,.003],[-.110,0],[.070,0],[.084,.003],[.096,.010],[.103,.022]];
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[],points:number[][]=[];
  for(let corner=0;corner<4;corner++)for(let step=0;step<25;step++){
    const angle=(corner+step/24)*Math.PI/2;
    points.push([(corner===0||corner===3?1:-1)*(w/2-r),(corner<2?1:-1)*(h/2-r),Math.cos(angle),Math.sin(angle)]);
  }
  const n=points.length;
  for(let ring=0;ring<profile.length;ring++)for(let j=0;j<=n;j++){
    const [z,inset]=profile[ring],[x,y,dx,dy]=points[j%n];vertices.push(x+dx*(r-inset),y+dy*(r-inset),z);uv.push(j/n,ring/(profile.length-1));
    if(ring<profile.length-1&&j<n){const a=ring*(n+1)+j,b=a+1,c=a+n+1;indices.push(a,b,c,b,c+1,c);}
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function createAppPhoneBody(look?:Data3DTexture){
  const shell=new Group();
  const metal=new MeshPhysicalMaterial({color:'#535559',metalness:1,roughness:.29,anisotropy:.25,clearcoat:0,envMapIntensity:1});
  const ceramic=new MeshPhysicalMaterial({color:'#08090a',metalness:0,roughness:.085,ior:1.5,specularIntensity:.08,clearcoat:0});
  const seam=new MeshPhysicalMaterial({color:'#121315',metalness:.15,roughness:.48,clearcoat:0});
  if(look)for(const material of [metal,ceramic,seam])applyOpeningColorLook(material,look);
  shell.add(new Mesh(phoneSidewall(),metal));
  const rear=new Mesh(phoneFace(2.07,4.40,.28),ceramic);rear.position.z=-.137;rear.rotation.y=Math.PI;shell.add(rear);
  const front=new Mesh(phoneFace(2.066,4.396,.278),ceramic);front.position.z=.112;shell.add(front);
  const seal=new Mesh(phoneFace(2.043,4.373,.264),seam);seal.position.z=.119;shell.add(seal);
  const bezel=new Mesh(phoneFace(2.025,4.355,.255),ceramic);bezel.position.z=.130;shell.add(bezel);
  const button=(x:number,y:number,height:number)=>{const mesh=new Mesh(new RoundedBoxGeometry(.029,height,.102,4,.012),metal);mesh.position.set(x,y,-.012);shell.add(mesh);};
  button(-1.064,.91,.28);button(-1.064,.45,.28);button(1.064,.57,.53);
  // Short insulating breaks, embedded in the flank rather than painted stripes.
  for(const side of [-1,1])for(const y of [-1.58,1.58]){const band=new Mesh(new RoundedBoxGeometry(.008,.021,.157,2,.003),seam);band.position.set(side*1.056,y,-.011);shell.add(band);}
  const port=new Mesh(new RoundedBoxGeometry(.26,.012,.062,4,.005),new MeshBasicMaterial({color:'#030405',side:DoubleSide}));port.position.set(0,-2.218,-.015);shell.add(port);
  for(const side of [-1,1])for(let i=0;i<5;i++){const hole=new Mesh(new RoundedBoxGeometry(.021,.009,.023,3,.004),new MeshBasicMaterial({color:'#020304'}));hole.position.set(side*(.39+i*.062),-2.219,-.013);shell.add(hole);}
  return shell;
}
