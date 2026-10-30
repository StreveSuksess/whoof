import { AgXToneMapping, BufferGeometry, Material, Mesh, type MeshStandardMaterial, type Texture, type Data3DTexture, Euler, Group, Object3D, PerspectiveCamera, Quaternion, Scene, SRGBColorSpace, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { FrameAnimation } from '../FrameAnimation';
import { loadBuf } from '../BufLoader';
import { ease } from '../core/ease';
import { createProductCollar } from './ProductCollar';
import type {CollarDetail} from './CollarDetail';
import {getRenderBudget,type QualityLevel} from './landing/RenderQuality';
import { matchOpeningMaterials, openingColorLook, openingEnvironment } from './OpeningLighting';
import {collarLift} from './OpeningTransition';
import {getStoryState,getStorySpin,getStoryFraming} from './landing/StoryMotion';
import type {StoryLighting} from './landing/StoryLighting';
import type {OfferSketches} from './landing/OfferSketches';
import {getOfferState} from './landing/OfferMotion';
import {getProductPassageState} from './landing/ProductPassageMotion';
import type {AppPhoneScene} from './landing/app/AppPhoneScene';
import {getAppSceneState,type AppSceneState} from './landing/app/AppMotion';
import type {AppLighting} from './landing/app/AppLighting';
import {getTrustState,type TrustSceneState} from './landing/trust/TrustMotion';
import type {KibbleScene} from './landing/ending/KibbleScene';
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
  studioEnvironment?:WebGLRenderTarget;private colorLook?:Data3DTexture;
  storyLights?:StoryLighting;
  offerSketches?:OfferSketches;private offerPreparation?:Promise<void>;
  private appScene?:AppPhoneScene;private appLights?:AppLighting;private appEnvironment?:WebGLRenderTarget;private appRendered=false;private appUnavailable=false;private appPreparation?:Promise<void>;
  private trustLights?:AppLighting;private trustPreparation?:Promise<void>;private trustRendered=false;private trustUnavailable=false;
  private endingScene?:KibbleScene;private endingPreparation?:Promise<void>;
  private disposed=false;private loading?:Promise<void>;
  private sketchReveal=0;private collarDetail?:CollarDetail;private quality:QualityLevel=2;
  private trustProductPosition=new Vector3();private trustProductScale=new Vector3();private trustProductRotation=new Quaternion();
  private trustCameraPosition=new Vector3();private trustCameraRotation=new Quaternion();
  width=1;height=1;mobile=false;portrait=false;
  constructor(container:HTMLElement){
    this.renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=SRGBColorSpace;this.renderer.toneMapping=AgXToneMapping;this.renderer.toneMappingExposure=1;
    container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-hidden','true');
    this.product.add(this.model);this.scene.add(this.product);

  }
  load(onProgress:(n:number)=>void){return this.loading??=this.loadContent(onProgress);}
  private async loadContent(onProgress:(n:number)=>void){
    onProgress(18);
    await Promise.all([
      // The captured table already blocks lower-hemisphere light. Do not apply
      // the review studio's stronger inner-band occlusion on top of that.
      Promise.all([createProductCollar(true,.78,true),openingColorLook()]).then(([c,look])=>{this.collarDetail=c.detailController;this.colorLook=look;matchOpeningMaterials(c.group,look);this.model.add(c.group);onProgress(74);}),
      openingEnvironment(this.renderer).then(target=>{this.studioEnvironment=target;this.scene.environment=target.texture;}),
      import('./landing/StoryLighting').then(({StoryLighting})=>{this.storyLights=new StoryLighting(this.scene);}),
      loadBuf('/models/hero_camera.buf').then(g=>{this.cameraTrack.setTarget(this.sourceCamera);this.cameraTrack.setGeometry(g);this.cameraTrack.applyTransform(0);this.originCamera.copy(this.sourceCamera.quaternion);}),
      loadBuf('/models/coaster_hero_animation.buf').then(g=>{this.productTrack.setTarget(this.sourceProduct);this.productTrack.setGeometry(g);this.productTrack.applyTransform(0);this.originProduct.copy(this.sourceProduct.quaternion).invert();})
    ]);
    await this.renderer.compileAsync(this.scene,this.camera);onProgress(100);
  }
  resize(width:number,height:number){
    this.width=width;this.height=height;this.mobile=width<=600;this.portrait=width/height<=1;
    this.renderer.setPixelRatio(getRenderBudget(width,height,window.devicePixelRatio,this.quality).ratio);this.renderer.setSize(width,height);
    const budget=getRenderBudget(width,height,window.devicePixelRatio,this.quality);
    this.offerSketches?.setQuality(budget.bloomLimit);this.endingScene?.setQuality(budget.endingLimit);
    this.offerSketches?.resize(width,height);
    this.endingScene?.resize(width,height);
  }
  setQuality(level:QualityLevel){
    if(this.quality===level)return;this.quality=level;this.resize(this.width,this.height);
  }
  private drawProduct(){
    const pixels=2.12*this.product.scale.x*this.camera.projectionMatrix.elements[5]*this.height*this.renderer.getPixelRatio()/(2*this.camera.position.distanceTo(this.product.position));
    this.collarDetail?.update(pixels);
    this.renderer.render(this.scene,this.camera);
  }
  private environmentPreparation?:Promise<WebGLRenderTarget>;
  private prepareEnvironment(){
    return this.environmentPreparation??=import('./landing/app/AppEnvironment').then(({createAppEnvironment})=>this.appEnvironment=createAppEnvironment(this.renderer));
  }
  prepareEnding(){
    if(!this.endingPreparation)this.endingPreparation=Promise.all([import('./landing/ending/KibbleScene'),this.prepareEnvironment()]).then(async([{KibbleScene},environment])=>{
      const scene=new KibbleScene(this.renderer,environment.texture);scene.setQuality(getRenderBudget(this.width,this.height,window.devicePixelRatio,this.quality).endingLimit);scene.resize(this.width,this.height);await scene.prepare();this.endingScene=scene;
    }).catch(error=>console.warn('Whoof ending unavailable; final action remains available.',error));
    return this.endingPreparation;
  }
  get endingReady(){return !!this.endingScene;}
  get endingNeedsFrame(){return this.endingScene?.needsFrame||false;}
  renderEnding(dt:number,px:number,py:number,progress:number,reduced:boolean,coarse:boolean,pointer:boolean){this.endingScene?.render(dt,px,py,progress,reduced,coarse,pointer);}
  disposeEnding(){this.endingScene?.dispose();}
  prepareApp(){
    if(!this.appPreparation)this.appPreparation=Promise.all([import('./landing/app/AppPhoneScene'),import('./landing/app/AppLighting'),this.prepareEnvironment()]).then(async([{AppPhoneScene},{AppLighting},environment])=>{
      const phone=new AppPhoneScene(this.renderer,environment.texture,this.colorLook);this.appLights=new AppLighting(this.scene,true,environment.texture);
      await Promise.all([phone.prepare(this.width),this.warmProduct(this.appLights)]);this.appScene=phone;
    }).catch(error=>{this.appUnavailable=true;console.warn('Whoof app scene unavailable; native examples remain available.',error);});
    return this.appPreparation;
  }
  private async warmProduct(lighting:AppLighting){
    let pending:Promise<unknown>=Promise.resolve();
    lighting.render(this.renderer,this.width,()=>{pending=this.renderer.compileAsync(this.scene,this.camera);},'warmup');
    await pending;
  }
  get appFailed(){return this.appUnavailable;}
  get appReady(){return !!this.appScene;}
  get appNeedsFrame(){return !!this.appScene&&!this.appRendered;}
  /** compileAsync alone does not exercise the first real draw/state changes. */
  warmFirstFrames(){
    const h=this.height,w=this.width;
    try{
      this.renderOpening(.65,0,0,false,2);
      this.renderApp(getAppSceneState(h*5.1,h,w),0,0);
      this.renderTrust(getTrustState(h*2,h,w),1,0,0,false);
      this.renderProductPassage(getTrustState(h*4.1,h,w),.3,0,0,0,1/60,false,true);
    }finally{
      this.appScene?.detachVector();this.appRendered=false;this.trustRendered=false;
      this.offerSketches?.resetIntro();this.sketchReveal=0;
      this.renderOpening(0,0,0,false,2);
    }
  }
  renderApp(state:AppSceneState,px:number,py:number){
    this.appScene?.render(state,this.width,this.height,px,py);this.appRendered=!!this.appScene;
    if(state.collarVisible<.001)return;
    this.storyLights?.setStrength(0);
    this.product.quaternion.setFromEuler(new Euler(state.collarPitch,state.collarYaw,state.collarBank));
    this.storySpinRotation.setFromAxisAngle(this.storySpinAxis,state.collarSpin);this.product.quaternion.premultiply(this.storySpinRotation);this.product.position.set(0,.855,0);
    const diameter=state.collarDiameter;
    this.product.scale.setScalar(diameter*2*Math.tan(32*Math.PI/360)*Math.hypot(9.4,5.6)/(this.height*2.12));
    this.camera.position.set(0,10.255,5.6);this.camera.lookAt(0,.855,0);this.camera.fov=32;
    this.camera.setViewOffset(this.width,this.height,this.width*.5-state.collarX,this.height*.5-state.collarY,this.width,this.height);
    this.renderer.autoClear=false;this.renderer.clearDepth();this.appLights?.render(this.renderer,this.width,()=>this.drawProduct(),[this.height,state.t].join('/'));this.renderer.autoClear=true;
  }
  disposeApp(){this.appScene?.dispose();this.appLights?.dispose();}
  prepareOffer(){
    if(!this.offerPreparation)this.offerPreparation=import('./landing/OfferSketches').then(async({OfferSketches})=>{this.offerSketches=new OfferSketches(this.renderer);await this.offerSketches.load();this.offerSketches.setQuality(getRenderBudget(this.width,this.height,window.devicePixelRatio,this.quality).bloomLimit);this.offerSketches.resize(this.width,this.height);await this.offerSketches.prepare();}).catch(error=>console.warn('Whoof sketchbook unavailable; offer and product remain available.',error));
    return this.offerPreparation;
  }
  get offerReady(){return this.offerSketches?.isReady||false;}
  get offerNeedsFrame(){return this.offerSketches?.needsFrame||false;}
  renderOffer(progress:number,px:number,py:number,dt:number,reduced:boolean,coarse:boolean,rawX=px,rawY=py){
    const state=getOfferState(progress*this.height,this.height,this.mobile,reduced);
    this.storyLights?.setStrength(1);
    this.applyOfferPose(state,px,py,reduced);
    this.renderer.autoClear=true;this.offerSketches?.update(dt,px,py,reduced?1:progress,reduced,coarse,rawX,rawY);
    this.renderer.setRenderTarget(null);this.renderer.clear();this.renderer.autoClear=false;
    if(this.offerSketches?.isReady)this.offerSketches.render();
    this.renderer.clearDepth();this.drawProduct();this.renderer.autoClear=true;
  }
  private applyOfferPose(state:ReturnType<typeof getOfferState>,px:number,py:number,reduced:boolean,exitOffset=0){
    this.product.quaternion.setFromEuler(new Euler(-.40+(reduced?0:py)*.045,state.yaw+(reduced?0:px)*.045,-.14));
    this.product.position.set(0,.855,0);
    const diameter=Math.min(this.width*(this.mobile?.84:.46),this.height*(this.mobile?.45:.78));
    this.product.scale.setScalar(diameter*2*Math.tan(32*Math.PI/360)*Math.hypot(9.4,5.6)/(this.height*2.12));
    this.camera.position.set(0,10.255,5.6);this.camera.lookAt(0,.855,0);this.camera.fov=32;
    this.camera.setViewOffset(this.width,this.height,0,this.height*.5-state.modelY+exitOffset,this.width,this.height);
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
    this.drawProduct();
  }
  prepareTrust(){
    if(!this.trustPreparation)this.trustPreparation=import('./landing/app/AppLighting').then(async({AppLighting})=>{this.trustLights=new AppLighting(this.scene,true);this.trustLights.key.intensity=.85;await this.warmProduct(this.trustLights);}).catch(error=>{this.trustUnavailable=true;console.warn('Whoof trust scene unavailable; native content remains available.',error);});
    return this.trustPreparation;
  }
  get trustFailed(){return this.trustUnavailable;}
  get trustNeedsFrame(){return !!this.trustLights&&!this.trustRendered;}
  /** Both sections use the same captured radiance, display response and scoped self-shadow key. */
  renderTrust(state:TrustSceneState,virtual:number,px:number,py:number,reduced:boolean){
    this.storyLights?.setStrength(0);
    this.applyTrustPose(state,virtual,px,py,reduced);
    this.renderer.autoClear=true;
    if(this.trustLights){this.trustLights.key.intensity=.85;this.trustLights.render(this.renderer,this.width,()=>this.drawProduct(),[this.height,...this.product.position.toArray(),...this.product.quaternion.toArray(),...this.product.scale.toArray()].join('/'));this.trustRendered=true;}
    else this.drawProduct();
  }
  private applyTrustPose(state:TrustSceneState,virtual:number,px:number,py:number,reduced:boolean){
    this.applyWearPose(virtual,px,py,reduced);
    const blend=state.wearBlend;
    if(blend<1){
      this.trustProductPosition.copy(this.product.position);this.trustProductScale.copy(this.product.scale);this.trustProductRotation.copy(this.product.quaternion);
      this.trustCameraPosition.copy(this.camera.position);this.trustCameraRotation.copy(this.camera.quaternion);
      const v=this.camera.view!,fullWidth=v.fullWidth,fullHeight=v.fullHeight,offsetX=v.offsetX,offsetY=v.offsetY,fov=this.camera.fov;
      this.product.quaternion.setFromEuler(new Euler(state.pitch+(reduced?0:py)*.025,state.yaw+(reduced?0:px)*.025,state.bank));
      this.storySpinRotation.setFromAxisAngle(this.storySpinAxis,state.spin);this.product.quaternion.premultiply(this.storySpinRotation);
      this.product.position.set(0,.855,0);this.product.scale.setScalar(state.diameter*2*Math.tan(32*Math.PI/360)*Math.hypot(9.4,5.6)/(this.height*2.12));
      this.product.position.lerp(this.trustProductPosition,blend);this.product.scale.lerp(this.trustProductScale,blend);this.product.quaternion.slerp(this.trustProductRotation,blend);
      this.camera.position.set(0,10.255,5.6);this.camera.lookAt(0,.855,0);this.camera.position.lerp(this.trustCameraPosition,blend);this.camera.quaternion.slerp(this.trustCameraRotation,blend);
      this.camera.fov=32+(fov-32)*blend;
      const x=this.width*.5-state.x,y=this.height*.5-state.y;
      this.camera.setViewOffset(this.width+(fullWidth-this.width)*blend,this.height+(fullHeight-this.height)*blend,x+(offsetX-x)*blend,y+(offsetY-y)*blend,this.width,this.height);
    }
  }
  /** Evaluate both original poses in one projection; draw only the interpolated collar. */
  applyProductPassagePose(state:TrustSceneState,virtual:number,local:number,px:number,py:number,reduced=false,exitOffset=0){
    const {blend}=getProductPassageState(local,this.height);
    if(blend===0){this.applyTrustPose(state,virtual,px,py,reduced);return blend;}
    const offer=getOfferState(local,this.height,this.mobile,reduced);
    if(blend===1){this.applyOfferPose(offer,px,py,reduced,exitOffset);return blend;}
    this.applyTrustPose(state,virtual,px,py,reduced);
    this.trustProductPosition.copy(this.product.position);this.trustProductScale.copy(this.product.scale);this.trustProductRotation.copy(this.product.quaternion);
    this.trustCameraPosition.copy(this.camera.position);this.trustCameraRotation.copy(this.camera.quaternion);
    const v=this.camera.view!,fw=v.fullWidth,fh=v.fullHeight,ox=v.offsetX,oy=v.offsetY,fov=this.camera.fov;
    this.applyOfferPose(offer,px,py,reduced,exitOffset);
    this.product.position.lerp(this.trustProductPosition,1-blend);this.product.scale.lerp(this.trustProductScale,1-blend);this.product.quaternion.slerp(this.trustProductRotation,1-blend);
    this.camera.position.lerp(this.trustCameraPosition,1-blend);this.camera.quaternion.slerp(this.trustCameraRotation,1-blend);
    this.camera.fov=32+(fov-32)*(1-blend);
    const targetY=this.height*.5-offer.modelY+exitOffset;
    this.camera.setViewOffset(this.width+(fw-this.width)*(1-blend),this.height+(fh-this.height)*(1-blend),ox*(1-blend),targetY+(oy-targetY)*(1-blend),this.width,this.height);
    return blend;
  }
  renderProductPassage(state:TrustSceneState,virtual:number,local:number,px:number,py:number,dt:number,reduced:boolean,coarse:boolean,rawX=px,rawY=py,exitOffset=0){
    const blend=this.applyProductPassagePose(state,virtual,local,px,py,reduced,exitOffset);
    this.storyLights?.setStrength(blend);
    this.renderer.setRenderTarget(null);this.renderer.autoClear=true;this.renderer.clear();this.renderer.autoClear=false;
    if(blend>0&&this.offerSketches?.isReady){
      this.sketchReveal=Math.min(1,this.sketchReveal+dt*2);
      this.offerSketches.update(dt,px,py,getOfferState(local,this.height,this.mobile,reduced).progress,reduced,coarse,rawX,rawY,blend*this.sketchReveal);this.offerSketches.render();
    }
    this.renderer.clearDepth();
    if(this.trustLights){
      this.trustLights.key.intensity=.85*(1-blend);
      this.trustLights.render(this.renderer,this.width,()=>this.drawProduct(),[this.height,...this.product.position.toArray(),...this.product.quaternion.toArray(),...this.product.scale.toArray()].join('/'),.85+(this.scene.environmentIntensity-.85)*blend);this.trustRendered=true;
    }else this.drawProduct();
    this.renderer.autoClear=true;
  }
  disposeTrust(){this.trustLights?.dispose();}
  render(scroll:number,px:number,py:number,reduced:boolean){
    this.storyLights?.setStrength(0);this.applyWearPose(scroll,px,py,reduced);this.drawProduct();
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    // Pending preparation can allocate after unmount; release only once it settles.
    void Promise.allSettled([this.loading,this.appPreparation,this.trustPreparation,this.offerPreparation,this.endingPreparation]).then(()=>this.release());
  }
  private release(){
    this.disposeApp();this.disposeTrust();this.disposeEnding();
    this.appEnvironment?.dispose();this.studioEnvironment?.dispose();this.colorLook?.dispose();this.collarDetail?.dispose();this.offerSketches?.dispose();
    const geometries=new Set<BufferGeometry>(),materials=new Set<Material>(),textures=new Set<Texture>();
    this.model.traverse(o=>{if(!(o instanceof Mesh))return;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);const surface=m as MeshStandardMaterial;for(const texture of [surface.map,surface.bumpMap])if(texture)textures.add(texture);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.renderer.dispose();
  }
  private applyWearPose(scroll:number,px:number,py:number,reduced:boolean){
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
  }
}
