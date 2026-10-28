import {Color,DataTexture,FloatType,LinearFilter,Mesh,MeshBasicMaterial,PlaneGeometry,PMREMGenerator,RGBAFormat,Scene,type WebGLRenderer} from 'three';

/** A product-photo light tent: broad feathered sources, dark negative fill. */
export function createAppEnvironment(renderer:WebGLRenderer){
  const studio=new Scene();studio.background=new Color(.012,.012,.012);
  const pixels=new Float32Array(64*128*4);
  const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
  for(let y=0;y<128;y++)for(let x=0;x<64;x++){const v=smooth(Math.min(x,63-x)/6)*smooth(Math.min(y,127-y)/10),i=(y*64+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=v;pixels[i+3]=1;}
  const feather=new DataTexture(pixels,64,128,RGBAFormat,FloatType);feather.minFilter=feather.magFilter=LinearFilter;feather.needsUpdate=true;
  const panel=(x:number,y:number,z:number,w:number,h:number,radiance:number)=>{
    const material=new MeshBasicMaterial({color:new Color(radiance,radiance,radiance),map:feather,toneMapped:false});
    const mesh=new Mesh(new PlaneGeometry(w,h),material);mesh.position.set(x,y,z);mesh.lookAt(0,0,0);studio.add(mesh);
  };
  panel(-4,2,5,3,8,24);panel(4,.5,4,1.6,6,8);panel(0,5,-3,4,2.5,16);
  const pmrem=new PMREMGenerator(renderer),target=pmrem.fromScene(studio,.035,.1,30);
  studio.traverse(object=>{if(object instanceof Mesh){object.geometry.dispose();(object.material as MeshBasicMaterial).dispose();}});feather.dispose();pmrem.dispose();return target;
}
