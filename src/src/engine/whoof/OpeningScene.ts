import { AgXToneMapping, Euler, Group, Object3D, PerspectiveCamera, Quaternion, Scene, SRGBColorSpace, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { FrameAnimation } from '../FrameAnimation';
import { loadBuf } from '../BufLoader';
import { ease } from '../core/ease';
import { createProductCollar } from './ProductCollar';
import { matchOpeningMaterials, openingColorLook, openingEnvironment } from './OpeningLighting';
import {collarLift} from './OpeningTransition';
import {getStoryState,getStorySpin,getStoryFraming} from './landing/StoryMotion';
import type {StoryLighting} from './landing/StoryLighting';
import type {OfferSketches} from './landing/OfferSketches';
import {getOfferState} from './landing/OfferMotion';
import type {AppPhoneScene} from './landing/app/AppPhoneScene';
import type {AppSceneState} from './landing/app/AppMotion';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/** Live continuation of the offline first frame. Camera starts at the baked pose. */
export class OpeningScene {
  renderer:WebGLRenderer;
  scene=new Scene();camera=new PerspectiveCamera(27,1,.1,60);
  product=new Group();model=new Group();
  sourceCamera=new Object3D();sourceProduct=new Object3D();
  cameraTrack=new FrameAnimation();productTrack=new FrameAnimation();
  originCamera=new Quaternion();originProduct=new Quaternion();motion=new Quaternion();
  heroRotation=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),-.28);
  finalRotation=new Quaternion().setFromEuler(new Euler(-.25,-.3,.17));
  storyRotation=new Quaternion().setFromEuler(new Euler(.12,-.28,-.09));
  tableRotation=new Quaternion();
  storySpinRotation=new Quaternion();storySpinAxis=new Vector3(1,1,1).normalize();
  studioEnvironment?:WebGLRenderTarget;
  storyLights?:StoryLighting;
  offerSketches?:OfferSketches;private offerPreparation?:Promise<void>;
  private appScene?:AppPhoneScene;private appRendered=false;private appPreparation?:Promise<void>;
  width=1;height=1;mobile=false;portrait=false;
  constructor(container:HTMLElement){
    this.renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=SRGBColorSpace;this.renderer.toneMapping=AgXToneMapping;this.renderer.toneMappingExposure=1;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-hidden','true');
    this.product.add(this.model);this.scene.add(this.product);

  }
  async load(onProgress:(n:number)=>void){
    onProgress(18);
    await Promise.all([
      // The captured table already blocks lower-hemisphere light. Do not apply
      // the review studio's stronger inner-band occlusion on top of that.
      Promise.all([createProductCollar(true,.78),openingColorLook()]).then(([c,look])=>{matchOpeningMaterials(c.group,look);this.model.add(c.group);onProgress(74);}),
      openingEnvironment(this.renderer).then(target=>{this.studioEnvironment=target;this.scene.environment=target.texture;}),
      import('./landing/StoryLighting').then(({StoryLighting})=>{this.storyLights=new StoryLighting(this.scene);}),
      loadBuf('/models/hero_camera.buf').then(g=>{this.cameraTrack.setTarget(this.sourceCamera);this.cameraTrack.setGeometry(g);this.cameraTrack.applyTransform(0);this.originCamera.copy(this.sourceCamera.quaternion);}),
      loadBuf('/models/coaster_hero_animation.buf').then(g=>{this.productTrack.setTarget(this.sourceProduct);this.productTrack.setGeometry(g);this.productTrack.applyTransform(0);this.originProduct.copy(this.sourceProduct.quaternion).invert();})
    ]);onProgress(100);
  }
  resize(width:number,height:number){
    this.width=width;this.height=height;this.mobile=width<=600;this.portrait=width/height<=1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,this.mobile?1.5:1.8));this.renderer.setSize(width,height);
    this.offerSketches?.resize(width,height);
  }
  prepareApp(){
    if(!this.appPreparation)this.appPreparation=import('./landing/app/AppPhoneScene').then(({AppPhoneScene})=>{this.appScene=new AppPhoneScene(this.renderer,this.studioEnvironment?.texture);}).catch(error=>console.warn('Whoof app scene unavailable; native examples remain available.',error));
    return this.appPreparation;
  }
  get appReady(){return !!this.appScene;}
  get appNeedsFrame(){return !!this.appScene&&!this.appRendered;}
  renderApp(state:AppSceneState,px:number,py:number){
    this.appScene?.render(state,this.width,this.height,px,py);this.appRendered=!!this.appScene;
    if(state.handoff<.001)return;
    this.storyLights?.setStrength(1);
    this.product.quaternion.setFromEuler(new Euler(-.40,state.handoff*.32,-.14));this.product.position.set(0,.855,0);
    const diameter=Math.min(this.width*(this.mobile?.46:.34),this.height*.48)*(.85+.15*state.handoff);
    this.product.scale.setScalar(diameter*2*Math.tan(32*Math.PI/360)*Math.hypot(9.4,5.6)/(this.height*2.12));
    this.camera.position.set(0,10.255,5.6);this.camera.lookAt(0,.855,0);this.camera.fov=32;
    this.camera.setViewOffset(this.width,this.height,this.width*(.5-(1.3+((this.mobile?.76:.72)-1.3)*state.handoff)),this.height*(.5-(.76-.08*state.handoff)),this.width,this.height);
    this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.scene,this.camera);this.renderer.autoClear=true;
  }
  disposeApp(){this.appScene?.dispose();}
  prepareOffer(){
    if(!this.offerPreparation)this.offerPreparation=import('./landing/OfferSketches').then(async({OfferSketches})=>{this.offerSketches=new OfferSketches(this.renderer);await this.offerSketches.load();this.offerSketches.resize(this.width,this.height);}).catch(error=>console.warn('Whoof sketchbook unavailable; offer and product remain available.',error));
    return this.offerPreparation;
  }
  get offerReady(){return this.offerSketches?.isReady||false;}
  get offerNeedsFrame(){return this.offerSketches?.needsFrame||false;}
  renderOffer(progress:number,px:number,py:number,dt:number,reduced:boolean,coarse:boolean,rawX=px,rawY=py){
    const state=getOfferState(progress*this.height,this.height,this.mobile,reduced);
    this.storyLights?.setStrength(1);
    this.product.quaternion.setFromEuler(new Euler(-.40+(reduced?0:py)*.045,state.yaw+(reduced?0:px)*.045,-.14));
    this.product.position.set(0,.855,0);
    const diameter=Math.min(this.width*(this.mobile?.84:.46),this.height*(this.mobile?.45:.78));
    this.product.scale.setScalar(diameter*2*Math.tan(32*Math.PI/360)*Math.hypot(9.4,5.6)/(this.height*2.12));
    this.camera.position.set(0,10.255,5.6);this.camera.lookAt(0,.855,0);this.camera.fov=32;
    this.camera.setViewOffset(this.width,this.height,0,this.height*.5-state.modelY,this.width,this.height);
    this.renderer.autoClear=true;this.offerSketches?.update(dt,px,py,reduced?1:progress,reduced,coarse,rawX,rawY);
    this.renderer.setRenderTarget(null);this.renderer.clear();this.renderer.autoClear=false;
    if(this.offerSketches?.isReady)this.offerSketches.render();
    this.renderer.clearDepth();this.renderer.render(this.scene,this.camera);this.renderer.autoClear=true;
  }
  /** Same camera crop and light as the table; settles into the Testimonies framing. */
  renderOpening(scroll:number,px:number,py:number,reduced:boolean,sectionEnd=2){
    const {lift,table,studio}=getStoryState(scroll,sectionEnd);
    this.storyLights?.setStrength(studio);
    this.product.quaternion.copy(this.heroRotation).slerp(this.storyRotation,lift);
    this.tableRotation.setFromEuler(new Euler(-.30,.10,-.28));
    this.product.quaternion.slerp(this.tableRotation,table);
    this.storySpinRotation.setFromAxisAngle(this.storySpinAxis,getStorySpin(scroll,sectionEnd,reduced));
    this.product.quaternion.premultiply(this.storySpinRotation);
    this.product.position.set(0,.305+.55*lift,0);
    this.camera.position.set((reduced?0:px)*.06*lift,9+1.255*lift+(reduced?0:py)*.04*lift,6.1-.5*lift);
    this.camera.lookAt(0,.855*lift,0);
    const fov=(this.portrait?31.5:27)*(1-lift)+32*lift;
    const {diameter,centerX}=getStoryFraming(this.width,this.height,this.mobile?0:table);
    // A rotating ring exposes its full silhouette; leave clearance to both copy columns.
    const finalScale=diameter*2*Math.tan(32*Math.PI/360)*Math.hypot(9.4,5.6)/(this.height*(1.96+.16*table));
    this.product.scale.setScalar(1.2+(finalScale-1.2)*lift);
    const baseW=this.portrait?1600:2560,baseH=this.portrait?2286:1600;
    const cover=Math.max(this.width/baseW,this.height/baseH),fullW=baseW*cover,fullH=baseH*cover;
    const shift=this.portrait?-.14:-.025;
    this.camera.fov=fov;
    this.camera.setViewOffset(fullW+(this.width-fullW)*lift,fullH+(this.height-fullH)*lift,
      (fullW-this.width)/2*(1-lift)+(this.width*.5-centerX)*lift,
      ((fullH-this.height)/2-shift*fullH)*(1-lift)-this.height*.01*lift,this.width,this.height);
    this.renderer.render(this.scene,this.camera);
  }
  render(scroll:number,px:number,py:number,reduced:boolean){
    this.storyLights?.setStrength(0);
    const leave=collarLift(scroll),p=clamp((scroll-.45)/3);
    this.cameraTrack.applyTransform(reduced?0:p*68);this.productTrack.applyTransform(reduced?0:p*68);
    this.motion.copy(this.originCamera).multiply(this.sourceCamera.quaternion.clone().invert()).multiply(this.sourceProduct.quaternion).multiply(this.originProduct);
    this.product.quaternion.copy(this.heroRotation).multiply(this.motion);
    if(!reduced)this.product.quaternion.slerp(this.finalRotation,ease.cubicInOut(clamp((p-.80)/.20)));
    const stacked=this.width/this.height<=1.2;
    const scale=1.2+((this.mobile?1.48:stacked?1.68:1.88)-1.2)*leave;
    this.product.scale.setScalar(scale*(1+.03*Math.sin(p*Math.PI)));
    this.product.position.set(0,.305*(1-leave)+(.45+(this.sourceProduct.position.y-.748364)*1.8)*leave,0);
    if(this.mobile)this.product.position.y+=.54*leave;
    this.camera.position.set(px*.10*leave,9+.4*leave+py*.06*leave,6.1-.5*leave);this.camera.lookAt(0,0,0);
    // Exactly the offline plate's sensor crop, gradually returning to full viewport.
    const baseW=this.portrait?1600:2560,baseH=this.portrait?2286:1600;
    const cover=Math.max(this.width/baseW,this.height/baseH),fullW=baseW*cover,fullH=baseH*cover;
    const shift=this.portrait?-.14:-.025;
    this.camera.fov=(this.portrait?31.5:27)*(1-leave)+(this.mobile?39:32)*leave;
    // Reference FeaturesSection shifts the product away from its text column.
    // Keep the source rotation and lights; only the composition changes here.
    const side=1-2*ease.cubicInOut(clamp((scroll-1.50)/.50))+2*ease.cubicInOut(clamp((scroll-2.60)/.50));
    const detailX=stacked?0:-this.width*.12*side;
    const detailY=stacked?this.height*(this.mobile?.025:.09):0;
    this.camera.setViewOffset(fullW+(this.width-fullW)*leave,fullH+(this.height-fullH)*leave,(fullW-this.width)/2*(1-leave)+detailX*leave,((fullH-this.height)/2-shift*fullH)*(1-leave)+detailY*leave,this.width,this.height);
    this.renderer.render(this.scene,this.camera);
  }
}
