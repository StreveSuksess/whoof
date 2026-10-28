import {CircleGeometry,ExtrudeGeometry,Group,HemisphereLight,Mesh,MeshBasicMaterial,MeshPhysicalMaterial,PerspectiveCamera,RectAreaLight,Scene,Shape,ShapeGeometry,type Texture,type WebGLRenderer} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {AppScreen} from './AppScreen';
import {CSS3DObject,CSS3DRenderer} from 'three/addons/renderers/CSS3DRenderer.js';
import {DAY_PLOT,SCREEN_WIDTH,SCREEN_HEIGHT} from './AppArtwork';
import type {AppSceneState} from './AppMotion';
function outline(w:number,h:number,r:number){
  const x=-w/2,y=-h/2,s=new Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
function face(w:number,h:number,r:number){
  const geometry=new ShapeGeometry(outline(w,h,r),24),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');for(let i=0;i<position.count;i++)uv.setXY(i,(position.getX(i)+w/2)/w,(position.getY(i)+h/2)/h);return geometry;
}
/** Physical phone and native vector display share one scene/camera transform. */
export class AppPhoneScene {
  private scene=new Scene();private camera=new PerspectiveCamera(28,1,.1,60);private phone=new Group();private shell=new Group();private screen=new AppScreen();
  private css=new CSS3DRenderer();private viewport='';
  private displayMaterial=new MeshBasicMaterial({color:'#111315',transparent:true,toneMapped:false});
  private reflectionMaterial=new MeshPhysicalMaterial({color:'#e3e8ed',transparent:true,opacity:.025,metalness:.5,roughness:.11,clearcoat:1,depthWrite:false});
  constructor(private renderer:WebGLRenderer,environment?:Texture){
    this.scene.environment=environment||null;this.scene.add(this.phone);this.phone.add(this.shell);
    const metal=new MeshPhysicalMaterial({color:'#656a72',metalness:.96,roughness:.27,clearcoat:.25,clearcoatRoughness:.18,envMapIntensity:1.3});
    const edge=new MeshPhysicalMaterial({color:'#34383e',metalness:.84,roughness:.19,clearcoat:1,envMapIntensity:1.4});
    const glass=new MeshPhysicalMaterial({color:'#151719',metalness:.15,roughness:.08,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1});
    this.css.domElement.className='app-vector-layer';Object.assign(this.css.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'1'});
    const vector=new CSS3DObject(this.screen.element);vector.position.z=.146;vector.scale.set(1.96/this.screen.width,4.23/this.screen.height,1);vector.element.style.pointerEvents='none';this.phone.add(vector);
    const body=new Mesh(new ExtrudeGeometry(outline(2.08,4.38,.29),{depth:.10,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:5,curveSegments:24}).translate(0,0,-.065),metal);this.shell.add(body);
    const rim=new Mesh(new ExtrudeGeometry(outline(2.064,4.364,.275),{depth:.065,bevelEnabled:true,bevelThickness:.012,bevelSize:.010,bevelSegments:4,curveSegments:24}).translate(0,0,-.018),edge);rim.position.z=.055;this.shell.add(rim);
    const bezel=new Mesh(face(2.045,4.345,.245),glass);bezel.position.z=.133;this.shell.add(bezel);
    const display=new Mesh(face(1.96,4.23,.22),this.displayMaterial);display.position.z=.141;this.phone.add(display);
    const reflection=new Mesh(face(1.965,4.235,.22),this.reflectionMaterial);reflection.position.z=.144;this.phone.add(reflection);
    const island=new Mesh(face(.54,.125,.062),new MeshBasicMaterial({color:'#101114',toneMapped:false}));island.position.set(0,1.956,.149);this.shell.add(island);
    const lens=new Mesh(new CircleGeometry(.027,24),new MeshPhysicalMaterial({color:'#111823',metalness:.7,roughness:.08}));lens.position.set(.175,1.956,.152);this.shell.add(lens);
    const button=(x:number,y:number,h:number)=>{const mesh=new Mesh(new RoundedBoxGeometry(.032,h,.075,3,.012),metal);mesh.position.set(x,y,-.006);this.shell.add(mesh);};
    button(-1.07,.84,.32);button(-1.07,.31,.32);button(1.07,.58,.57);
    const port=new Mesh(new RoundedBoxGeometry(.32,.014,.067,3,.006),new MeshBasicMaterial({color:'#101114'}));port.position.set(0,-2.215,-.01);this.shell.add(port);
    for(const x of [-.82,-.77,-.72,.72,.77,.82]){const mesh=new Mesh(new CircleGeometry(.012,10),new MeshBasicMaterial({color:'#1c1e22'}));mesh.rotation.x=Math.PI/2;mesh.position.set(x,-2.216,0);this.shell.add(mesh);}
    this.scene.add(new HemisphereLight('#f5f6fa','#292c35',.45));
    for(const [x,y,z,power,w,h] of [[-3,3,5,5,1.6,6],[4,0,3,2.5,.75,5],[0,-4,4,.7,4,2]]){const light=new RectAreaLight('#f6f6f7',power,w,h);light.position.set(x,y,z);light.lookAt(0,0,0);this.scene.add(light);}
  }
  render(state:AppSceneState,width:number,height:number,px:number,py:number){
    this.screen.update(state);this.displayMaterial.opacity=state.zoom;this.reflectionMaterial.opacity=.025*state.zoom;
    const viewport=width+'/'+height;if(viewport!==this.viewport){this.viewport=viewport;this.css.setSize(width,height);}
    const host=this.renderer.domElement.parentElement;if(host&&this.css.domElement.parentElement!==host)host.append(this.css.domElement);
    const tangent=Math.tan(28*Math.PI/360),macro=1.96*(DAY_PLOT.span/SCREEN_WIDTH)*height/(2*tangent*state.macroDiameter),framed=4.42*height/(2*tangent*state.phoneHeight);
    const distance=macro+(framed-macro)*state.zoom,lookY=(2.115-1050/SCREEN_HEIGHT*4.23)*(1-state.zoom);
    this.phone.rotation.set(state.rotateX+py*.012*state.zoom,state.rotateY+px*.018*state.zoom,state.rotateZ);
    this.shell.visible=state.zoom>.07;
    this.camera.aspect=width/height;this.camera.position.set(0,lookY,distance);this.camera.lookAt(0,lookY,0);this.camera.setViewOffset(width,height,width*.5-state.phoneX,height*.5-state.phoneY,width,height);
    this.renderer.setRenderTarget(null);this.renderer.autoClear=true;this.renderer.render(this.scene,this.camera);this.css.render(this.scene,this.camera);
  }
  dispose(){this.css.domElement.remove();this.screen.dispose();this.scene.traverse(object=>{if(object instanceof Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});}
}
