import {AdditiveBlending,Color,Mesh,OrthographicCamera,PlaneGeometry,Scene,ShaderMaterial,TextureLoader,Vector2,Vector3,Vector4,WebGLRenderTarget,type WebGLRenderer} from 'three';
import {ease} from '../../core/ease';
import {getSketchProximity} from './OfferMotion';
import {offerPaintFragment,offerSketchFragment} from './OfferShaders';
const vertex=`varying vec2 v_uv;void main(){v_uv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fullVertex=`varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const copyFragment=`uniform sampler2D u_texture;uniform vec2 u_texel;varying vec2 v_uv;void main(){gl_FragColor=(texture2D(u_texture,v_uv)*4.+texture2D(u_texture,v_uv+vec2(u_texel.x,0.))+texture2D(u_texture,v_uv-vec2(u_texel.x,0.))+texture2D(u_texture,v_uv+vec2(0.,u_texel.y))+texture2D(u_texture,v_uv-vec2(0.,u_texel.y)))/8.;}`;
type Card={mesh:Mesh;material:ShaderMaterial;rotation:number;scale:number;aspect:number};

/** Original paint/blur/proximity effect, sharing the collar's renderer/context. */
export class OfferSketches {
  scene=new Scene();camera=new OrthographicCamera(-1,1,1,-1,1,3);
  private quadCamera=new OrthographicCamera(-1,1,1,-1,0,2);private quadScene=new Scene();
  private geometry=new PlaneGeometry(2,2);private quad=new Mesh(this.geometry);
  private current=new WebGLRenderTarget(1,1);private previous=new WebGLRenderTarget(1,1);private low=new WebGLRenderTarget(1,1);
  private cards:Card[]=[];private width=1;private height=1;private ready=false;private show=0;private time=0;private remaining=0;private initialized=false;
  private lastPointer=new Vector2();private pointer=new Vector2();private velocity=new Vector2();private from=new Vector4();private to=new Vector4();
  private paint=new ShaderMaterial({vertexShader:fullVertex,fragmentShader:offerPaintFragment,defines:{USE_NOISE:1},depthTest:false,depthWrite:false,uniforms:{u_lowPaintTexture:{value:null},u_prevPaintTexture:{value:null},u_paintTexelSize:{value:new Vector2()},u_drawFrom:{value:this.from},u_drawTo:{value:this.to},u_pushStrength:{value:25},u_dissipations:{value:new Vector3(.985,.985,.75)},u_vel:{value:this.velocity},u_curlScale:{value:.06},u_curlStrength:{value:1.75}}});
  private copy=new ShaderMaterial({vertexShader:fullVertex,fragmentShader:copyFragment,depthTest:false,depthWrite:false,uniforms:{u_texture:{value:null},u_texel:{value:new Vector2()}}});
  constructor(private renderer:WebGLRenderer){this.camera.position.z=2;this.quadScene.add(this.quad);}
  async load(){
    const textures=await Promise.all(['collar','walk','rest','day'].map(name=>new TextureLoader().loadAsync('/whoof/offer-v37/'+name+'.webp')));
    textures.forEach((texture,index)=>{
      const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:offerSketchFragment,defines:{BLUR_SAMPLE:3},transparent:true,blending:AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{u_texture:{value:texture},u_screenPaintTexture:{value:this.current.texture},u_resolution:{value:new Vector2()},u_mixer:{value:new Vector3(0,1,0)},u_opacity:{value:.08},u_activeRatio:{value:1},u_color:{value:new Color('#dcc7b1')},u_blur:{value:.5}}});
      const mesh=new Mesh(this.geometry,material);this.scene.add(mesh);this.cards.push({mesh,material,rotation:[-.12,.16,-.22,.24][index],scale:[.40,.36,.37,.40][index],aspect:texture.image.width/texture.image.height});
    });
    this.ready=true;this.resize(this.width,this.height);
  }
  get isReady(){return this.ready;}
  get needsFrame(){return this.ready&&(this.show<1||this.remaining>0);}
  resize(width:number,height:number){
    this.width=width;this.height=height;const scale=Math.min(.25,480/width,300/height),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
    this.current.setSize(w,h);this.previous.setSize(w,h);this.low.setSize(Math.max(1,w>>2),Math.max(1,h>>2));
    this.paint.uniforms.u_paintTexelSize.value.set(1/w,1/h);this.copy.uniforms.u_texel.value.set(1/w,1/h);
    this.camera.left=-width/height;this.camera.right=width/height;this.camera.updateProjectionMatrix();
    const old=this.renderer.getRenderTarget(),color=this.renderer.getClearColor(new Color()),alpha=this.renderer.getClearAlpha();
    this.renderer.setClearColor(new Color(.5,.5,0),0);for(const target of [this.current,this.previous,this.low]){this.renderer.setRenderTarget(target);this.renderer.clear();}
    this.renderer.setRenderTarget(old);this.renderer.setClearColor(color,alpha);this.initialized=false;this.remaining=0;
  }
  update(dt:number,x:number,y:number,progress:number,reduced:boolean,coarse:boolean){
    if(!this.ready)return;
    const mobile=this.width<=600,quiet=coarse||reduced||mobile;
    this.pointer.set((x+1)*this.width*.5,(1-y)*this.height*.5);
    const moved=this.initialized?this.pointer.distanceTo(this.lastPointer):0;
    if(moved>.3&&!quiet)this.remaining=3.6;
    if(quiet)this.remaining=0;
    this.remaining=Math.max(0,this.remaining-dt);this.show=reduced?1:Math.min(1,this.show+dt*.75);this.time+=dt;
    const w=this.current.width,h=this.current.height,radius=!quiet&&moved>.01?Math.min(100,moved)*h/this.height:0;
    if(!this.initialized){this.to.set(this.pointer.x/this.width*w,this.pointer.y/this.height*h,0,0);this.initialized=true;}
    this.from.copy(this.to);this.to.set(this.pointer.x/this.width*w,this.pointer.y/this.height*h,radius,1);
    this.velocity.multiplyScalar(Math.pow(.8,dt*60)).add(new Vector2(this.to.x-this.from.x,this.to.y-this.from.y).multiplyScalar(dt*.8));
    this.lastPointer.copy(this.pointer);
    const swap=this.previous;this.previous=this.current;this.current=swap;
    this.copy.uniforms.u_texture.value=this.previous.texture;this.quad.material=this.copy;this.renderer.setRenderTarget(this.low);this.renderer.render(this.quadScene,this.quadCamera);
    this.paint.uniforms.u_lowPaintTexture.value=this.low.texture;this.paint.uniforms.u_prevPaintTexture.value=this.previous.texture;this.paint.uniforms.u_dissipations.value.set(Math.pow(.985,dt*60),Math.pow(.985,dt*60),Math.pow(.75,dt*60));
    this.quad.material=this.paint;this.renderer.setRenderTarget(this.current);this.renderer.render(this.quadScene,this.quadCamera);this.renderer.setRenderTarget(null);
    const mouseX=x*this.width/this.height,mouseY=-y;
    this.cards.forEach((card,index)=>{
      const order=index/(this.cards.length-1),angle=Math.PI*.5-(order-.5)*3.1,radius=Math.min(mobile?.5:.9,this.width/this.height*.72);
      const px=Math.cos(angle)*radius,py=Math.pow(Math.max(0,Math.sin(angle)),.25)*radius*.75-progress*.10;
      const dx=mouseX-px,dy=mouseY-py,near=quiet?.15:getSketchProximity(Math.hypot(dx,dy));
      const strength=ease.cubicOut(this.show);
      card.mesh.position.set(px-dx*near*.1,py-dy*near*.1,0);
      card.mesh.rotation.z=card.rotation+(reduced?0:near*dx*.1);
      const scale=card.scale*(mobile?.5:this.width/this.height<1.1?.78:1)*(1+near*.05)*strength;card.mesh.scale.set(scale*card.aspect,scale,1);
      const uniforms=card.material.uniforms;uniforms.u_screenPaintTexture.value=this.current.texture;uniforms.u_resolution.value.set(this.renderer.domElement.width,this.renderer.domElement.height);
      uniforms.u_opacity.value=(.08+near*.42)*strength;uniforms.u_activeRatio.value=mobile?.6:1;uniforms.u_blur.value=(1-near)*.5;
    });
  }
}
