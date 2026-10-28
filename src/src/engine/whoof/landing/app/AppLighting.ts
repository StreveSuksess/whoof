import {DirectionalLight,Object3D,PCFSoftShadowMap,type Scene,type Texture,type WebGLRenderer} from 'three';

/** Shared light tent plus one shadowed key. Scoped to the floating pair. */
export class AppLighting {
  readonly key=new DirectionalLight('#fffaf4',2.4);
  private target=new Object3D();private shadowKey='';
  constructor(private scene:Scene,shadows:boolean,private environment?:Texture){
    this.target.position.set(0,shadows?.855:0,0);this.key.position.set(-4,2,5);this.key.target=this.target;this.key.visible=false;this.key.castShadow=shadows;
    this.key.shadow.camera.left=-3;this.key.shadow.camera.right=3;this.key.shadow.camera.top=3;this.key.shadow.camera.bottom=-3;this.key.shadow.camera.near=.5;this.key.shadow.camera.far=20;this.key.shadow.bias=-.00003;this.key.shadow.normalBias=.0004;
    if(!shadows)this.key.intensity=0;
    this.key.shadow.camera.updateProjectionMatrix();this.key.shadow.autoUpdate=false;scene.add(this.key,this.target);
  }
  render(renderer:WebGLRenderer,width:number,draw:()=>void,pose='',environmentIntensity=.85){
    const originalEnvironment=this.scene.environment,intensity=this.scene.environmentIntensity,enabled=renderer.shadowMap.enabled,type=renderer.shadowMap.type;
    const resolution=width<=600?1024:2048;
    if(this.key.shadow.mapSize.x!==resolution){this.key.shadow.map?.dispose();this.key.shadow.map=null;this.key.shadow.mapSize.set(resolution,resolution);this.shadowKey='';}
    const nextKey=width+'/'+pose;if(nextKey!==this.shadowKey){this.key.shadow.needsUpdate=true;this.shadowKey=nextKey;}
    this.scene.environment=this.environment||originalEnvironment;this.scene.environmentIntensity=environmentIntensity;this.key.visible=true;renderer.shadowMap.enabled=this.key.castShadow;renderer.shadowMap.type=PCFSoftShadowMap;
    try{draw();}finally{this.scene.environment=originalEnvironment;this.scene.environmentIntensity=intensity;this.key.visible=false;renderer.shadowMap.enabled=enabled;renderer.shadowMap.type=type;}
  }
  dispose(){this.key.shadow.map?.dispose();this.key.shadow.mapPass?.dispose();this.scene.remove(this.key,this.target);}
}
