import {getSceneViewport} from './landing/SceneViewport';
import {PoseFrameCache} from './PoseFrameCache';
import {HeroPropMotion,type PropKind} from './HeroPropMotion';
import {collarContact} from './OpeningTransition';
import {leashImpulse,type LeashContact} from './LeashContact';

type Bounds={x:number;y:number;width:number;height:number};
type MotionAsset={rect:[number,number,number,number];frames:string[];axis:[number,number];pivot:[number,number];reach:number;segments:[number[],number[]][];radius:number;contacts?:LeashContact[]};
type Metadata={width:number;height:number;layers:Record<string,Bounds>;motion:Record<PropKind,MotionAsset>};
type Prop={name:PropKind;canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;motion:HeroPropMotion;loaded:boolean;drawn:number};
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const root='/whoof/hero-v24/';
const staticLayers=['background','shadow','collar'];

/** Angular prop views and contact shadows rendered in the same Cycles camera.
 * The canvas rectangle never follows the cursor: only the physical pose changes.
 */
export class HeroPlate {
  readonly element=document.querySelector<HTMLElement>('#hero-plate')!;
  private images=new Map<string,HTMLImageElement>();
  private props:Prop[]=[];
  private meta?:Metadata;
  private format=''; private generation=0;
  private last={x:0,y:0}; private pointerReady=false;
  private layout=''; private allowSequences=false;private cache?:PoseFrameCache;private cachePlan='';private cachePaused=false;
  private active=true;private preparing=false;
  moving=false; ready=false;
  constructor(){
    for(const name of ['background','keys','leash','ball','shadow','collar']){
      if(staticLayers.includes(name)){
        const image=new Image();image.alt='';image.className='hero-plate-image';image.dataset.layer=name;image.draggable=false;
        this.element.append(image);this.images.set(name,image);
      }else{
        const canvas=document.createElement('canvas');canvas.className='hero-prop-pose';canvas.dataset.prop=name;
        this.element.append(canvas);
        this.props.push({name:name as PropKind,canvas,context:canvas.getContext('2d')!,motion:new HeroPropMotion(name as PropKind),loaded:false,drawn:NaN});
      }
    }
  }
  private async bitmap(src:string){
    const response=await fetch(src);if(!response.ok)throw new Error(`Hero pose unavailable: ${response.status}`);
    return createImageBitmap(await response.blob());
  }
  async resize(){
    if(!this.active)return;
    this.layout='';this.pointerReady=false;
    const format=getSceneViewport().width/getSceneViewport().height<=1?'portrait':'landscape';
    if(format===this.format&&this.ready)return;
    this.format=format;this.ready=false;this.element.classList.remove('has-layers');const generation=++this.generation;
    this.cache?.dispose();this.cache=new PoseFrameCache(src=>this.bitmap(src));this.cachePlan='';this.cachePaused=false;
    for(const p of this.props){p.loaded=false;p.drawn=NaN;p.motion.step(0,false);}
    const meta=await fetch(`${root}${format}.json`).then(r=>{if(!r.ok)throw new Error('Hero camera metadata unavailable');return r.json() as Promise<Metadata>;});
    if(generation!==this.generation)return;
    const cache=this.cache,neutral=this.props.map(p=>root+meta.motion[p.name].frames[(meta.motion[p.name].frames.length-1)/2]);
    cache.request(neutral,neutral);
    await Promise.all([
      ...staticLayers.map(async name=>{const image=new Image();image.src=`${root}${format}-${name}.webp`;await image.decode();if(generation===this.generation)this.images.get(name)!.src=image.src;}),
      cache.settled()
    ]);
    if(generation!==this.generation)return;
    this.props.forEach((p,i)=>{const frame=cache.get(neutral[i]);if(!frame)throw new Error('Hero neutral pose unavailable');p.canvas.width=frame.width;p.canvas.height=frame.height;p.loaded=true;});
    if(generation!==this.generation)return;
    await Promise.all([...this.images.values()].map(image=>image.decode()));
    if(generation!==this.generation)return;
    this.meta=meta;this.ready=true;this.element.classList.add('has-layers');
    this.allowSequences=!this.preparing&&!matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches;
    this.requestPoses(this.allowSequences);
  }
  private requestPoses(active:boolean){
    if(!this.meta||!this.cache)return;
    const pinned:string[]=[],nearby:{key:string;priority:number}[]=[];
    for(const p of this.props){
      const files=this.meta.motion[p.name].frames,middle=(files.length-1)/2;
      const pose=active?(p.motion.q+1)*middle:middle,low=Math.floor(pose);
      pinned.push(root+files[middle],root+files[low]);if(active)pinned.push(root+files[Math.min(files.length-1,low+1)]);
      if(active){
        // Neighbor views are ready before contact; predict in the actual angular
        // direction without retaining three full decoded movies in memory.
        const ahead=Math.round(Math.max(-10,Math.min(10,p.motion.velocity*middle*.12)));
        for(let offset=-4;offset<=4;offset++){
          const index=Math.max(0,Math.min(files.length-1,low+offset));nearby.push({key:root+files[index],priority:Math.abs(offset)});
        }
        for(let step=1;step<=Math.abs(ahead);step++){
          const index=Math.max(0,Math.min(files.length-1,low+Math.sign(ahead)*step));nearby.push({key:root+files[index],priority:step*.7});
        }
      }
    }
    const keys=[...new Set([...pinned,...nearby.sort((a,b)=>a.priority-b.priority).map(item=>item.key)])],plan=keys.join('|')+'/'+active;
    if(plan!==this.cachePlan){this.cachePlan=plan;this.cache.request(keys,pinned);}
    if(this.cachePaused===active){this.cachePaused=!active;this.cache.setPaused(!active);}
  }
  get decodedBytes(){return this.cache?.bytes||0;}
  setPreparing(preparing:boolean){if(this.preparing===preparing)return;this.preparing=preparing;if(preparing)this.requestPoses(false);}
  setActive(active:boolean,release=false){
    if(active===this.active)return;this.active=active;
    if(active)void this.resize().catch(()=>{});
    else if(release){
      // Phone scenes do not need three full tabletop layers and neutral prop
      // buffers resident while rendering the App/price. The original beauty
      // remains available until these cached images decode on the way back.
      this.generation++;this.cache?.dispose();this.cache=undefined;this.meta=undefined;this.ready=false;this.format='';this.layout='';this.element.classList.remove('has-layers');
      this.images.forEach(image=>image.removeAttribute('src'));this.props.forEach(p=>{p.loaded=false;p.drawn=NaN;p.canvas.width=p.canvas.height=1;});
    }else this.suspend();
  }
  suspend(){this.requestPoses(false);}
  dispose(){this.generation++;this.cache?.dispose();this.props.forEach(p=>{p.canvas.width=p.canvas.height=1;});}
  private draw(p:Prop){
    const middle=(this.meta!.motion[p.name].frames.length-1)/2;
    const pose=p.loaded?(p.motion.q+1)*middle:middle;
    if(Math.abs(pose-p.drawn)<.002)return;
    const low=Math.floor(pose),high=Math.min(middle*2,low+1),fraction=pose-low;
    const files=this.meta!.motion[p.name].frames,a=this.cache?.get(root+files[low]),b=this.cache?.get(root+files[high]);if(!a||(!b&&fraction>0))return;
    const c=p.context;c.clearRect(0,0,p.canvas.width,p.canvas.height);
    // Add premultiplied weighted frames. Source-over would double their alpha
    // and expose the surface through the prop during the angle interpolation.
    c.globalCompositeOperation='lighter';c.globalAlpha=1-fraction;c.drawImage(a,0,0);
    if(fraction&&b){c.globalAlpha=fraction;c.drawImage(b,0,0);}
    c.globalAlpha=1;c.globalCompositeOperation='source-over';p.drawn=pose;
    p.canvas.dataset.pose=p.motion.q.toFixed(3);
  }
  render(scroll:number,px:number,py:number,dt:number,reduced:boolean,coarse:boolean,pointerActive:boolean){
    const sceneFade=1-clamp((scroll-.32)/.50),handoff=clamp((scroll-.08)/.24);
    this.element.style.opacity=String(sceneFade);this.element.style.visibility=sceneFade>.001?'visible':'hidden';
    this.images.get('collar')!.style.opacity=String(this.ready&&handoff<1?1:0);
    const contact=collarContact(scroll),shadow=this.images.get('shadow')!;
    shadow.style.opacity=String(this.ready?contact:0);
    shadow.style.filter=contact>0&&contact<1?`blur(${(1-contact)*8}px)`:'none';
    const fallback=this.element.querySelector<HTMLElement>('.hero-beauty')!;fallback.style.opacity=String(this.ready?0:1-handoff);
    this.moving=false;if(!this.ready||!this.meta)return;
    const allowSequences=!this.preparing&&!reduced&&!coarse;
    this.allowSequences=allowSequences;
    const w=getSceneViewport().width,h=getSceneViewport().height,scale=Math.max(w/this.meta.width,h/this.meta.height),ow=this.meta.width*scale,oh=this.meta.height*scale;
    const mouse={x:(px+1)*w/2,y:(py+1)*h/2};
    if(!this.pointerReady||!pointerActive){this.last=mouse;this.pointerReady=pointerActive;}
    // Entering the window or teleporting focus is not an impact on an object.
    const jump=Math.hypot(mouse.x-this.last.x,mouse.y-this.last.y)>Math.max(80,Math.min(w,h)*.25);
    const dx=jump?0:clamp(mouse.x-this.last.x,-100,100),dy=jump?0:clamp(mouse.y-this.last.y,-100,100);
    const layout=`${w}/${h}/${this.format}`;
    for(const p of this.props){
      const asset=this.meta.motion[p.name],bounds=this.meta.layers[p.name];
      if(layout!==this.layout){
        const [x,y,cw,ch]=asset.rect;
        Object.assign(p.canvas.style,{left:`${x*ow+(w-ow)/2}px`,top:`${y*oh+(h-oh)/2}px`,width:`${cw*ow}px`,height:`${ch*oh}px`});
      }
      const x=asset.pivot[0]*ow+(w-ow)/2,y=asset.pivot[1]*oh+(h-oh)/2;
      const rx=Math.max(18,bounds.width*ow*.48),ry=Math.max(18,bounds.height*oh*.48);
      const cx=bounds.x*ow+(w-ow)/2,cy=bounds.y*oh+(h-oh)/2;
      const segments=asset.segments??[];
      const distance=segments.reduce((nearest,segment)=>{
        const [a,b]=segment;const sx=a[0]*ow+(w-ow)/2,sy=a[1]*oh+(h-oh)/2;
        const ex=(b[0]-a[0])*ow,ey=(b[1]-a[1])*oh;
        const t=clamp(((mouse.x-sx)*ex+(mouse.y-sy)*ey)/(ex*ex+ey*ey||1));
        return Math.min(nearest,Math.hypot(mouse.x-sx-ex*t,mouse.y-sy-ey*t));
      },Infinity);
      const proximity=segments.length?distance/Math.max(12,asset.radius*ow):Math.hypot((mouse.x-cx)/rx,(mouse.y-cy)/ry);
      if(!reduced&&!coarse&&scroll<.05&&p.loaded&&p.name==='leash'&&asset.contacts){
        p.motion.impulse(leashImpulse(asset.contacts,p.motion.q,[mouse.x,mouse.y],[dx,dy],{width:ow,height:oh,left:(w-ow)/2,top:(h-oh)/2},Math.max(10,asset.radius*ow)));
      }else if(!reduced&&!coarse&&scroll<.05&&p.loaded&&proximity<1){
        const ax=asset.axis[0]*ow,ay=asset.axis[1]*oh,length=Math.hypot(ax,ay)||1;
        const tangentX=mouse.y-y,tangentY=-(mouse.x-x),lever=Math.hypot(tangentX,tangentY);
        const push=p.name==='keys'?(dx*tangentX+dy*tangentY)/Math.max(20,lever):(dx*ax+dy*ay)/length;
        const contact=1-proximity*proximity;
        const leverage=p.name==='keys'?clamp(lever/(asset.reach*oh),.15,1):1;
        const gain=p.name==='ball'?3.2:12;
        const contactSize=p.name==='leash'?Math.max(28,asset.radius*ow*2):Math.max(35,rx);
        p.motion.impulse(push/contactSize*gain*contact*leverage);
      }
      p.motion.step(dt,!reduced&&!coarse&&scroll<.84);
      this.draw(p);this.moving||=p.motion.moving;
    }
    this.requestPoses(allowSequences&&scroll<.84);
    this.layout=layout;this.last=mouse;
  }
}
