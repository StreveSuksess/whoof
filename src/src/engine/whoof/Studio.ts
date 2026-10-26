import { ACESFilmicToneMapping, AmbientLight, Color, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShadowMaterial, SpotLight, Vector3, WebGLRenderer, PCFSoftShadowMap, SRGBColorSpace, MathUtils } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCollar } from './Collar';
import { ease } from '../core/ease';

export type StudioState = { chapter: string; progress: number; pointerX: number; pointerY: number; reducedMotion: boolean; time: number; explode: boolean; rotation: number };
export class Studio {
  renderer: WebGLRenderer;
  scene=new Scene();
  camera=new PerspectiveCamera(32,1,.1,40);
  collar: Awaited<ReturnType<typeof createCollar>> | null=null;
  stage=new Group();
  mobile=false;
  private lastChapter='';
  private focus=new Vector3();
  private targetFocus=new Vector3();
  constructor(private canvas:HTMLCanvasElement) {
    this.renderer=new WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0,0);
    this.renderer.outputColorSpace=SRGBColorSpace;this.renderer.toneMapping=ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=PCFSoftShadowMap;
    const environment=new RoomEnvironment();const pmrem=new PMREMGenerator(this.renderer);
    this.scene.environment=pmrem.fromScene(environment,.08).texture;environment.dispose();pmrem.dispose();
    this.scene.add(new HemisphereLight('#ffffff','#8b8a84',2.2));
    const key=new DirectionalLight('#fffaf1',4.3);key.position.set(-3,6,5);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.025;key.shadow.bias=-.0003;
    this.scene.add(key);const rim=new DirectionalLight('#e7ecf1',3.1);rim.position.set(4,2,-3);this.scene.add(rim);
    const fill=new DirectionalLight('#ffffff',1.8);fill.position.set(0,-1,6);this.scene.add(fill);
    const floor=new Mesh(new PlaneGeometry(200,200),new ShadowMaterial({opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.85;floor.receiveShadow=true;this.scene.add(floor);
    this.scene.add(this.stage);this.camera.position.set(0,1,9);this.resize();
  }
  async init() {this.collar=await createCollar();this.stage.add(this.collar.group);await this.renderer.compileAsync(this.scene,this.camera);}
  resize() {this.mobile=innerWidth<768;this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  update(state:StudioState,dt:number) {
    if(!this.collar)return;
    const {chapter,progress:p}=state;
    const active=['hero','bridge','details','order'].includes(chapter);
    this.canvas.style.opacity=active?'1':'0';
    if(!active||document.hidden)return;
    const q=ease.cubicInOut(Math.max(0,Math.min(1,p)));
    let x=this.mobile?0:1.7, y=this.mobile?-.25:0, z=0, rx=.75, ry=-.45, rz=-.3, scale=this.mobile?.70:1, distance=this.mobile?10:9.5;
    if(chapter==='bridge') {x=MathUtils.lerp(this.mobile?0:1.7,0,q);y=-q*.05;rx=.75-q*.4;ry=-.45+q*.9;rz=-.3+q*.3;scale=(this.mobile?.7:1)*(1+q*.45);distance=9.5;this.canvas.style.opacity=String(1-Math.max(0,(p-.56)/.32));}
    if(chapter==='details') {x=this.mobile?0:-1.55;y=this.mobile?.85:.1;rx=.35;ry=.18+state.rotation;rz=-.15;scale=this.mobile?.62:1.1;distance=this.mobile?10.5:9.5;}
    if(chapter==='order') {x=this.mobile?0:1.8;y=this.mobile?-.6:-.1;rx=.72;ry=.50;rz=.3;scale=this.mobile?.62:.9;}
    const smoothing=state.reducedMotion?1:1-Math.exp(-dt*5);
    this.stage.position.lerp(new Vector3(x,y,z),smoothing);
    this.stage.rotation.x=MathUtils.lerp(this.stage.rotation.x,rx+(state.reducedMotion?0:state.pointerY*.055),smoothing);
    this.stage.rotation.y=MathUtils.lerp(this.stage.rotation.y,ry+(state.reducedMotion?0:state.pointerX*.11),smoothing);
    this.stage.rotation.z=MathUtils.lerp(this.stage.rotation.z,rz+(state.reducedMotion?0:Math.sin(state.time*.35)*.025),smoothing);
    this.stage.scale.lerp(new Vector3(scale,scale,scale),smoothing);
    this.camera.position.z=MathUtils.lerp(this.camera.position.z,distance,smoothing);
    this.camera.lookAt(0,0,0);
    const explosion=(chapter==='details' && state.explode) ? .68 : 0;
    this.collar.housing.position.z=MathUtils.lerp(this.collar.housing.position.z,1.235-explosion,smoothing);
    this.collar.shell.position.z=MathUtils.lerp(this.collar.shell.position.z,1.235+explosion*.8,smoothing);
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.renderer.dispose();}
}
