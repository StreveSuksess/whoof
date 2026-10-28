import {Color,DepthTexture,DirectionalLight,DynamicDrawUsage,FogExp2,HalfFloatType,HemisphereLight,InstancedMesh,Mesh,MeshStandardMaterial,Object3D,OrthographicCamera,PCFShadowMap,PerspectiveCamera,PlaneGeometry,PointLight,Scene,ShaderMaterial,UnsignedByteType,Vector2,WebGLRenderTarget,type WebGLRenderer} from 'three';
import {createAppEnvironment} from '../app/AppEnvironment';
import {createKibbleGeometry,createKibbleMaps} from './KibbleGeometry';
import {KibbleMotion,projectKibblePointer} from './KibbleMotion';

const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const blur=`varying vec2 vUv;uniform sampler2D colorMap;uniform sampler2D depthMap;uniform vec2 resolution;uniform float focus;float distanceAt(vec2 uv){float d=texture2D(depthMap,uv).r;return .2*24./(24.-d*(24.-.2));}void main(){float z=distanceAt(vUv);float radius=clamp(abs(z-focus)*4.5,0.,10.);vec4 color=texture2D(colorMap,vUv);float weight=1.;for(int i=0;i<20;i++){float f=float(i)+.5;float angle=f*2.39996323;vec2 offset=vec2(cos(angle),sin(angle))*sqrt(f/20.)*radius/resolution;vec2 uv=clamp(vUv+offset,vec2(0.),vec2(1.));float dz=distanceAt(uv);float w=dz<z-.6?.45:1.;color+=texture2D(colorMap,uv)*w;weight+=w;}gl_FragColor=color/weight;}`;
const display=`varying vec2 vUv;uniform sampler2D map;void main(){vec4 color=texture2D(map,vUv);gl_FragColor=vec4(color.rgb/max(color.a,.00001),color.a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
gl_FragColor.rgb*=gl_FragColor.a;}`;

/** Source footer composition in the existing renderer, with dry-food models. */
export class KibbleScene{
  private scene=new Scene();private camera=new PerspectiveCamera(40,1,.2,24);
  private field=new KibbleMotion();private geometry=createKibbleGeometry();private maps=createKibbleMaps();
  private material=new MeshStandardMaterial({map:this.maps.map,normalMap:this.maps.normalMap,normalScale:new Vector2(.6,.6),roughness:.94,metalness:0});
  private meshes:InstancedMesh[];private dummy=new Object3D();private tint=new Color();
  private key=new DirectionalLight('#fff1dc',2.2);private cursorLight=new PointLight('#f0dfc4',.85,5,2);
  private environment:WebGLRenderTarget;private colorTarget:WebGLRenderTarget;private blurTarget:WebGLRenderTarget;
  private postScene=new Scene();private postCamera=new OrthographicCamera(-1,1,1,-1,0,1);private quad:Mesh;
  private blurMaterial:ShaderMaterial;private displayMaterial:ShaderMaterial;private savedColor=new Color();
  private width=1;private height=1;private worldHeight=2*Math.tan(40*Math.PI/360)*8;private worldWidth=6;private rendered=false;
  constructor(private renderer:WebGLRenderer){
    this.environment=createAppEnvironment(renderer);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.08;this.scene.fog=new FogExp2('#0b0d0f',.055);
    this.camera.position.set(0,0,8);
    this.key.position.set(-3,4,6);this.key.castShadow=true;this.key.shadow.mapSize.set(1024,1024);this.key.shadow.normalBias=.012;this.key.shadow.bias=-.0001;this.key.shadow.radius=2.5;this.key.shadow.camera.near=.2;this.key.shadow.camera.far=22;
    const rim=new DirectionalLight('#dbe4ed',1.5);rim.position.set(3,1,-4);
    this.scene.add(this.key,rim,new HemisphereLight('#d5cec1','#121515',.08),this.cursorLight);
    this.meshes=this.geometry.map(geometry=>{const mesh=new InstancedMesh(geometry,this.material,140);mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;this.scene.add(mesh);return mesh;});
    const type=renderer.extensions.has('EXT_color_buffer_float')?HalfFloatType:UnsignedByteType;
    this.colorTarget=new WebGLRenderTarget(1,1,{type,depthBuffer:true});this.colorTarget.depthTexture=new DepthTexture(1,1);
    this.blurTarget=new WebGLRenderTarget(1,1,{type,depthBuffer:false});
    this.blurMaterial=new ShaderMaterial({vertexShader:vertex,fragmentShader:blur,uniforms:{colorMap:{value:this.colorTarget.texture},depthMap:{value:this.colorTarget.depthTexture},resolution:{value:new Vector2(1,1)},focus:{value:8}},depthTest:false,depthWrite:false,toneMapped:false});
    this.displayMaterial=new ShaderMaterial({vertexShader:vertex,fragmentShader:display,uniforms:{map:{value:this.blurTarget.texture}},transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false});
    this.quad=new Mesh(new PlaneGeometry(2,2),this.blurMaterial);this.quad.frustumCulled=false;this.postScene.add(this.quad);
    for(let i=0;i<12;i++)this.field.step(1/90,0,0,false);
    this.writeInstances();
  }
  resize(width:number,height:number){
    this.width=width;this.height=height;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
    this.worldWidth=this.worldHeight*width/height;this.field.resize(this.worldWidth);
    const scale=Math.min(1,(width<=600?920:1280)/Math.max(width,height));
    const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
    this.colorTarget.setSize(w,h);this.blurTarget.setSize(w,h);this.blurMaterial.uniforms.resolution.value.set(w,h);
    const range=Math.max(4,this.worldWidth*.85);this.key.shadow.camera.left=-range;this.key.shadow.camera.right=range;this.key.shadow.camera.bottom=-4;this.key.shadow.camera.top=3;this.key.shadow.camera.updateProjectionMatrix();
    this.rendered=false;
  }
  get needsFrame(){return !this.rendered;}
  private writeInstances(){
    for(let group=0;group<3;group++)this.meshes[group].count=Math.max(0,Math.floor((this.field.count+2-group)/3));
    for(let i=0;i<this.field.count;i++){
      const k=i*3,group=i%3,index=Math.floor(i/3),scale=this.field.scale[i];
      this.dummy.position.fromArray(this.field.position,k);this.dummy.rotation.set(this.field.rotation[k],this.field.rotation[k+1],this.field.rotation[k+2]);this.dummy.scale.setScalar(scale);this.dummy.updateMatrix();
      this.meshes[group].setMatrixAt(index,this.dummy.matrix);
      const value=.88+.20*(this.field.phase[i]/(Math.PI*2));this.tint.setRGB(value,value*(.96+.035*Math.sin(i)),value*.91);this.meshes[group].setColorAt(index,this.tint);
    }
    this.meshes.forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;});
  }
  render(dt:number,px:number,py:number,progress:number,reduced:boolean,coarse:boolean,pointer:boolean){
    this.field.count=reduced?96:this.width<=600||coarse?168:420;
    const {x,y}=projectKibblePointer(px,py,this.worldWidth,this.worldHeight,progress);
    if(!reduced)this.field.step(dt,x,y,pointer&&!coarse);
    const lightX=pointer&&!coarse&&!reduced?x:-1,lightY=pointer&&!coarse&&!reduced?y:0,lightBlend=this.rendered?1-Math.exp(-9*dt):1;
    this.cursorLight.position.x+=(lightX-this.cursorLight.position.x)*lightBlend;this.cursorLight.position.y+=(lightY-this.cursorLight.position.y)*lightBlend;this.cursorLight.position.z=1.8;
    this.camera.setViewOffset(this.width,this.height,0,-(1-progress)*this.height*.24,this.width,this.height);
    this.writeInstances();
    const renderer=this.renderer,target=renderer.getRenderTarget(),auto=renderer.autoClear,alpha=renderer.getClearAlpha(),shadow=renderer.shadowMap.enabled,shadowType=renderer.shadowMap.type,shadowAuto=renderer.shadowMap.autoUpdate;
    renderer.getClearColor(this.savedColor);
    try{
      renderer.autoClear=true;renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFShadowMap;renderer.shadowMap.autoUpdate=true;
      renderer.setRenderTarget(this.colorTarget);renderer.clear();renderer.render(this.scene,this.camera);
      renderer.shadowMap.enabled=false;this.quad.material=this.blurMaterial;renderer.setRenderTarget(this.blurTarget);renderer.clear();renderer.render(this.postScene,this.postCamera);
      this.quad.material=this.displayMaterial;renderer.setRenderTarget(null);renderer.clear();renderer.render(this.postScene,this.postCamera);this.rendered=true;
    }finally{
      renderer.setRenderTarget(target);renderer.autoClear=auto;renderer.setClearColor(this.savedColor,alpha);renderer.shadowMap.enabled=shadow;renderer.shadowMap.type=shadowType;renderer.shadowMap.autoUpdate=shadowAuto;
    }
  }
  dispose(){
    this.geometry.forEach(geometry=>geometry.dispose());this.material.dispose();this.maps.map.dispose();this.maps.normalMap.dispose();this.environment.dispose();this.colorTarget.depthTexture?.dispose();this.colorTarget.dispose();this.blurTarget.dispose();this.blurMaterial.dispose();this.displayMaterial.dispose();this.quad.geometry.dispose();this.key.shadow.map?.dispose();
  }
}
