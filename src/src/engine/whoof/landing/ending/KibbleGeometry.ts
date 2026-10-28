import {BufferGeometry,DataTexture,LinearMipmapLinearFilter,RepeatWrapping,RGBAFormat,SRGBColorSpace,SphereGeometry,Vector3} from 'three';

/** Rounded extruded food, deliberately without the coffee bean's central seam. */
export function createKibbleGeometry(){
  const geometries:BufferGeometry[]=[0,1,2].map(()=>new SphereGeometry(1,28,16));
  geometries.forEach((geometry,index)=>{
    const position=geometry.getAttribute('position');
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i),angle=Math.atan2(z,x),sine=Math.hypot(x,z);
      const outline=index===1?.215*(1+.13*Math.cos(angle*3)):index===2?.185/Math.pow(Math.cos(angle)**4+Math.sin(angle)**4,.25):.215;
      const radial=Math.pow(sine,.58)*outline,warp=1+.018*Math.sin(angle*5+index)*Math.sin(y*4);
      position.setXYZ(i,Math.cos(angle)*radial*warp,Math.sign(y)*Math.pow(Math.abs(y),.58)*.108,Math.sin(angle)*radial*warp);
    }
    geometry.computeVertexNormals();
    // Weld only normals at UV seams/poles; UV coordinates stay independent.
    const normals=geometry.getAttribute('normal'),sums=new Map<string,Vector3>(),keys:string[]=[];
    for(let i=0;i<position.count;i++){const key=[position.getX(i),position.getY(i),position.getZ(i)].map(v=>Math.round(v*100000)).join('/');keys.push(key);const sum=sums.get(key)||new Vector3();sum.x+=normals.getX(i);sum.y+=normals.getY(i);sum.z+=normals.getZ(i);sums.set(key,sum);}
    for(let i=0;i<position.count;i++){const sum=sums.get(keys[i])!;if(sum.lengthSq()<.00001)sum.set(0,Math.sign(position.getY(i))||1,0);sum.normalize();normals.setXYZ(i,sum.x,sum.y,sum.z);}
    geometry.computeBoundingSphere();
  });
  return geometries;
}

const smooth=(x:number)=>x*x*(3-2*x);
const hash=(x:number,y:number,n:number)=>{const value=Math.sin((x%n)*127.1+(y%n)*311.7+52.17)*43758.5453;return value-Math.floor(value);};
function noise(u:number,v:number,n:number){
  const x=u*n,y=v*n,ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  const a=hash(ix,iy,n),b=hash(ix+1,iy,n),c=hash(ix,iy+1,n),d=hash(ix+1,iy+1,n);
  return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}

/** Tileable porous baked surface; maps contain no painted directional light. */
export function createKibbleMaps(size=256){
  const heights=new Float32Array(size*size),albedo=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,n=noise(u,v,8)*.45+noise(u,v,23)*.35+noise(u,v,59)*.2;
    const pores=Math.max(0,(noise(u,v,47)-.56)*3.8),h=n*.18-pores*.23,i=y*size+x,k=i*4;
    heights[i]=h;const tone=(n-.5)*46-pores*32;
    albedo[k]=Math.max(0,126+tone);albedo[k+1]=Math.max(0,79+tone*.8);albedo[k+2]=Math.max(0,38+tone*.55);albedo[k+3]=255;
  }
  const at=(x:number,y:number)=>heights[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=(at(x+1,y)-at(x-1,y))*7,dy=(at(x,y+1)-at(x,y-1))*7,len=Math.hypot(dx,dy,1),i=(y*size+x)*4;
    normal[i]=Math.round((-.5*dx/len+.5)*255);normal[i+1]=Math.round((-.5*dy/len+.5)*255);normal[i+2]=Math.round((.5/len+.5)*255);normal[i+3]=255;
  }
  const make=(data:Uint8Array)=>{const texture=new DataTexture(data,size,size,RGBAFormat);texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.set(2,2);texture.generateMipmaps=true;texture.minFilter=LinearMipmapLinearFilter;texture.needsUpdate=true;return texture;};
  const map=make(albedo);map.colorSpace=SRGBColorSpace;
  return {map,normalMap:make(normal)};
}
