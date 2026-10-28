import {HalfFloatType,Mesh,NoBlending,OrthographicCamera,PlaneGeometry,Scene,ShaderMaterial,UnsignedByteType,Vector2,WebGLRenderTarget,type Camera,type WebGLRenderer} from 'three';
import {getOfferBloomLayout,getOfferBloomWeights,OFFER_SOURCE_FX as FX} from './OfferMotion';
import {offerBloomHighPass,offerBloomBlur,offerBloomComposite} from './OfferShaders';
const vertex=`varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const material=(fragmentShader:string,uniforms:Record<string,{value:unknown}>,defines={})=>new ShaderMaterial({vertexShader:vertex,fragmentShader,uniforms,defines,blending:NoBlending,depthTest:false,depthWrite:false,toneMapped:false});

/** Oryzo's active five-level, non-convolution Bloom. One existing renderer. */
export class OfferBloom {
  width=1;height=1;
  private layer=new WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false});
  private high:WebGLRenderTarget;
  private horizontal:WebGLRenderTarget[]=[];private vertical:WebGLRenderTarget[]=[];
  private highMaterial=material(offerBloomHighPass,{u_texture:{value:null},u_luminosityThreshold:{value:FX.threshold},u_smoothWidth:{value:FX.smoothWidth},u_lumaStrength:{value:FX.lumaStrength},u_selectiveStrength:{value:FX.selectiveStrength}});
  private blurs:ShaderMaterial[]=[];private composite:ShaderMaterial;
  private geometry=new PlaneGeometry(2,2);private quad=new Mesh(this.geometry);private scene=new Scene();private camera=new OrthographicCamera();
  private x=new Vector2(1,0);private y=new Vector2(0,1);
  constructor(private renderer:WebGLRenderer){
    const type=renderer.extensions.has('EXT_color_buffer_float')?HalfFloatType:UnsignedByteType;
    const target=()=>new WebGLRenderTarget(1,1,{type,depthBuffer:false,stencilBuffer:false});
    this.high=target();this.scene.add(this.quad);
    const uniforms:Record<string,{value:unknown}>={u_texture:{value:this.layer.texture},u_bloomWeights:{value:getOfferBloomWeights()},u_saturation:{value:FX.saturation},u_opacity:{value:1}};
    for(let i=0;i<FX.iterations;i++){
      this.horizontal.push(target());this.vertical.push(target());
      this.blurs.push(material(offerBloomBlur,{u_texture:{value:null},u_resolution:{value:new Vector2(1,1)},u_direction:{value:this.x}},{KERNEL_RADIUS:3+i*2,SIGMA:3+i*2}));
      uniforms['u_blurTexture'+i]={value:this.vertical[i].texture};
    }
    this.composite=material(offerBloomComposite,uniforms,{ITERATION:FX.iterations});
  }
  resize(width:number,height:number){
    const layout=getOfferBloomLayout(width,height);this.width=layout.width;this.height=layout.height;
    this.layer.setSize(this.width,this.height);this.high.setSize(layout.levels[0].width,layout.levels[0].height);
    layout.levels.forEach((level,i)=>{this.horizontal[i].setSize(level.width,level.height);this.vertical[i].setSize(level.width,level.height);this.blurs[i].uniforms.u_resolution.value.set(level.width,level.height);});
  }
  render(scene:Scene,camera:Camera,opacity=1){
    const renderer=this.renderer;
    this.composite.uniforms.u_opacity.value=opacity;
    renderer.setRenderTarget(this.layer);renderer.clear();renderer.render(scene,camera);
    this.highMaterial.uniforms.u_texture.value=this.layer.texture;this.quad.material=this.highMaterial;
    renderer.setRenderTarget(this.high);renderer.render(this.scene,this.camera);
    let input=this.high;
    for(let i=0;i<FX.iterations;i++){
      const blur=this.blurs[i];blur.uniforms.u_texture.value=input.texture;blur.uniforms.u_direction.value=this.x;this.quad.material=blur;
      renderer.setRenderTarget(this.horizontal[i]);renderer.render(this.scene,this.camera);
      blur.uniforms.u_texture.value=this.horizontal[i].texture;blur.uniforms.u_direction.value=this.y;
      renderer.setRenderTarget(this.vertical[i]);renderer.render(this.scene,this.camera);input=this.vertical[i];
    }
    this.quad.material=this.composite;renderer.setRenderTarget(null);renderer.render(this.scene,this.camera);
  }
}
