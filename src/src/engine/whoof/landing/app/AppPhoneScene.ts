import {CircleGeometry,Group,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,NoBlending,PerspectiveCamera,Scene,type Data3DTexture,type Texture,type WebGLRenderer} from 'three';
import {CSS3DObject,CSS3DRenderer} from 'three/addons/renderers/CSS3DRenderer.js';
import {applyOpeningColorLook} from '../../OpeningLighting';
import {AppScreen} from './AppScreen';
import {AppLighting} from './AppLighting';
import {createAppPhoneBody,phoneFace} from './AppPhoneBody';
import {DAY_PLOT,SCREEN_WIDTH,SCREEN_HEIGHT} from './AppArtwork';
import type {AppSceneState} from './AppMotion';

/** One projection: vector pixels behind a WebGL aperture, actual glass above. */
export class AppPhoneScene {
  private scene=new Scene();private camera=new PerspectiveCamera(28,1,.1,60);private phone=new Group();private shell:Group;private screen=new AppScreen();
  private lighting:AppLighting;private css=new CSS3DRenderer();private viewport='';private reflection:Mesh;private glassFade={value:0};
  constructor(private renderer:WebGLRenderer,environment?:Texture,look?:Data3DTexture){
    this.scene.environment=environment||null;this.lighting=new AppLighting(this.scene,false,environment);this.scene.add(this.phone);this.shell=createAppPhoneBody(look);this.phone.add(this.shell);
    this.css.domElement.className='app-vector-layer';Object.assign(this.css.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'0'});
    const vector=new CSS3DObject(this.screen.element);vector.position.z=.148;vector.scale.set(1.96/this.screen.width,4.23/this.screen.height,1);vector.element.style.pointerEvents='none';this.phone.add(vector);
    // Clear the opaque body's screen pixels, retaining the exact projected edge.
    // DOM then supplies sharp emissive pixels through the shared alpha canvas.
    const aperture=new Mesh(phoneFace(1.96,4.23,.22),new MeshBasicMaterial({color:0,transparent:true,opacity:0,blending:NoBlending,toneMapped:false,depthWrite:false}));
    aperture.position.z=.148;aperture.renderOrder=2;this.phone.add(aperture);
    const glass=new MeshPhysicalMaterial({color:0,metalness:0,roughness:.085,ior:1.5,specularIntensity:.08,transparent:true,premultipliedAlpha:true,opacity:1,depthWrite:false,clearcoat:0,envMapIntensity:1});
    if(look)applyOpeningColorLook(glass,look);
    const compile=glass.onBeforeCompile.bind(glass),key=glass.customProgramCacheKey();
    glass.onBeforeCompile=(shader,renderer)=>{
      compile(shader,renderer);shader.uniforms.whoofGlassFade=this.glassFade;
      shader.fragmentShader='uniform float whoofGlassFade;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',`#include <colorspace_fragment>
        float glassFresnel=.0032+.9968*pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),5.);
        gl_FragColor.a=glassFresnel*whoofGlassFade;
        gl_FragColor.rgb*=whoofGlassFade;
      `).replace('#include <premultiplied_alpha_fragment>','// Reflection energy already includes Fresnel: premultiplied output.');
    };
    glass.customProgramCacheKey=()=>key+'-dielectric-dom-aperture-v1';
    this.reflection=new Mesh(phoneFace(1.96,4.23,.22),glass);this.reflection.position.z=.150;this.reflection.renderOrder=3;this.phone.add(this.reflection);
    const island=new Mesh(phoneFace(.54,.125,.062),new MeshBasicMaterial({color:'#070809',toneMapped:false}));island.position.set(0,1.956,.153);island.renderOrder=4;this.shell.add(island);
    const lensMaterial=new MeshPhysicalMaterial({color:'#010205',metalness:0,roughness:.2,ior:1.5,specularIntensity:.08});if(look)applyOpeningColorLook(lensMaterial,look);
    const lens=new Mesh(new CircleGeometry(.027,32),lensMaterial);lens.position.set(.175,1.956,.155);lens.renderOrder=4;this.shell.add(lens);
  }
  async prepare(width:number){
    // compileAsync submits synchronously; restore shared lighting before waiting.
    let pending:Promise<unknown>=Promise.resolve();
    this.lighting.render(this.renderer,width,()=>{pending=this.renderer.compileAsync(this.scene,this.camera);});
    await pending;
  }
  render(state:AppSceneState,width:number,height:number,px:number,py:number){
    this.screen.update(state);this.glassFade.value=state.zoom;this.reflection.visible=state.zoom>.001;
    const viewport=width+'/'+height;if(viewport!==this.viewport){this.viewport=viewport;this.css.setSize(width,height);}
    const host=this.renderer.domElement.parentElement;if(host&&this.css.domElement.parentElement!==host)host.append(this.css.domElement);
    const tangent=Math.tan(28*Math.PI/360),macro=1.96*(DAY_PLOT.span/SCREEN_WIDTH)*height/(2*tangent*state.macroDiameter),framed=4.44*height/(2*tangent*state.phoneHeight);
    const distance=macro+(framed-macro)*state.zoom,lookY=(2.115-1050/SCREEN_HEIGHT*4.23)*(1-state.zoom);
    this.phone.rotation.set(state.rotateX+py*.012*state.zoom,state.rotateY+px*.018*state.zoom,state.rotateZ);this.shell.visible=state.zoom>.07;
    this.camera.aspect=width/height;this.camera.position.set(0,lookY,distance);this.camera.lookAt(0,lookY,0);this.camera.setViewOffset(width,height,width*.5-state.phoneX,height*.5-state.phoneY,width,height);
    this.renderer.setRenderTarget(null);this.renderer.autoClear=true;if(this.shell.visible)this.lighting.render(this.renderer,width,()=>this.renderer.render(this.scene,this.camera));else this.renderer.render(this.scene,this.camera);this.css.render(this.scene,this.camera);
  }
  detachVector(){this.css.domElement.remove();}
  dispose(){this.lighting.dispose();this.detachVector();this.screen.dispose();this.scene.traverse(object=>{if(object instanceof Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});}
}
