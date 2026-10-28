import {SplitText} from 'gsap/SplitText';
import {GalleryVideo} from '../life/GalleryVideo';
import {APP_SCROLL_UNITS,getAppSceneState,getAppViewportClip,range,type AppSceneState} from './app/AppMotion';
import {ease} from '../../core/ease';
type Caption={element:HTMLElement;title:SplitText;copy:HTMLElement};
/** Owns native captions/media; phone rendering stays in the shared world. */
export class AppExample {
  private atmosphere:HTMLElement;private nextTitle:HTMLElement;private nextKey='';private host:HTMLElement;private stage:HTMLElement;private captions:Caption[];private film:HTMLElement;private media:GalleryVideo;private play:HTMLButtonElement;
  private top=0;private size=1;private height=1;private width=1;private fallback=false;private static=false;private visible=true;private filmWanted=false;private last='';private attached?:HTMLCanvasElement;private original?:HTMLElement;private abort=new AbortController();
  active=false;progress=0;distance=Infinity;state:AppSceneState=getAppSceneState(-1000,1,1);headerTone='dark';
  constructor(private root:HTMLElement){
    this.nextTitle=document.getElementById('how-title')!;this.atmosphere=root.querySelector('.app-atmosphere')!;this.host=root.querySelector('[data-app-world]')!;this.stage=root.querySelector('.app-stage')!;this.film=root.querySelector('.app-life-film')!;this.play=root.querySelector('.app-film-play')!;
    this.media=new GalleryVideo(root.querySelector('[data-app-film]')!);
    this.captions=[...root.querySelectorAll<HTMLElement>('[data-app-caption]')].map(element=>({element,title:SplitText.create(element.querySelector('h3')!,{type:'lines,words,chars',mask:'lines'}),copy:element.querySelector('p')!}));
    this.root.classList.add('has-app-stage');
    this.play.addEventListener('click',()=>{this.media.retry();this.media.setPlaying(true);this.play.hidden=!this.media.blocked;},{signal:this.abort.signal});
    this.stage.addEventListener('keydown',event=>{if(event.target!==this.stage||this.static||!['ArrowDown','ArrowUp'].includes(event.key))return;event.preventDefault();const stops=[0,1.9,3.3,4.3,5.9],local=(scrollY-this.top)/this.height;const index=stops.reduce((a,n,i)=>Math.abs(n-local)<Math.abs(stops[a]-local)?i:a,0);const next=Math.max(0,Math.min(4,index+(event.key==='ArrowDown'?1:-1)));window.scrollTo({top:this.top+stops[next]*this.height,behavior:'smooth'});},{signal:this.abort.signal});
  }
  resize(){
    this.height=innerHeight;this.width=innerWidth;this.static=this.fallback||matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.root.classList.toggle('app-static',this.static);this.root.dataset.tone='dark';this.root.style.height=this.static?'':APP_SCROLL_UNITS*this.height+'px';this.size=this.root.offsetHeight;this.top=this.root.getBoundingClientRect().top+scrollY;this.last='';
    this.captions.forEach(c=>{c.title.split({type:'lines,words,chars',mask:'lines'});});
    this.media.element.controls=this.static;if(this.static){this.media.setPlaying(false);this.filmWanted=false;}
  }
  useFallback(){if(this.fallback)return false;this.fallback=true;return true;}
  render(scroll:number,reduced:boolean){
    this.distance=scroll-this.top;this.progress=this.distance/this.height;this.state=getAppSceneState(this.distance,this.height,this.width,reduced);
    const s=this.state;
    const follow=!this.static&&s.t>6.35&&s.t<APP_SCROLL_UNITS+1,nextKey=follow?s.nextTitle.toFixed(4):'native';
    if(nextKey!==this.nextKey){this.nextKey=nextKey;this.nextTitle.classList.toggle('app-follow-title',follow);this.nextTitle.style.opacity=follow?String(s.nextTitle):'';this.nextTitle.style.transform=follow?`translate3d(0,${(1-ease.cubicOut(s.nextTitle))*30}px,0)`:'';}
    this.active=!this.static&&s.opacity>.001;this.headerTone=s.paper>.45?'light':'dark';
    const wanted=!this.static&&this.visible&&s.context>.05&&this.active;if(wanted!==this.filmWanted){this.filmWanted=wanted;this.media.setPlaying(wanted);}this.play.hidden=this.static||!this.media.blocked;
    if(this.static){if(this.last==='static')return;this.last='static';this.captions.forEach(c=>{c.element.removeAttribute('aria-hidden');c.element.style.cssText='';c.title.chars.forEach(char=>(char as HTMLElement).style.cssText='');c.copy.style.cssText='';});this.film.style.cssText='';return;}
    if(!this.active){if(this.last!=='inactive'){this.host.style.visibility='hidden';this.atmosphere.style.visibility='hidden';this.captions.forEach(c=>{c.element.style.visibility='hidden';c.element.setAttribute('aria-hidden','true');});this.film.style.visibility='hidden';this.last='inactive';}return;}
    const key=[s.t.toFixed(4),scrollY,this.visible].join('/');if(key===this.last)return;this.last=key;
    this.root.style.setProperty('--app-demo-opacity',String(.48*(1-range(s.t,5.8,6.1))));this.root.style.setProperty('--app-paper',String(s.paper));this.root.style.setProperty('--app-caption-y',(this.height*(this.width<=600?.13:.15+.08*s.zoom))+'px');
    this.root.style.setProperty('--app-ink',s.paper>.45?'#26282b':'#f4f1eb');this.host.style.opacity=String(s.opacity);this.host.style.visibility=this.active?'visible':'hidden';this.atmosphere.style.visibility=this.active?'visible':'hidden';this.atmosphere.style.opacity=String(s.opacity);
    const boundary=getAppViewportClip(this.top,this.size,scrollY,this.height);const clip=`inset(${boundary.top}px 0 ${boundary.bottom}px 0)`;this.host.style.clipPath=clip;this.atmosphere.style.clipPath=clip;
    this.captions.forEach((c,index)=>{const weight=s.captionWeights[index],show=ease.cubicOut(Math.min(1,weight*1.5));c.element.style.visibility=weight>.001?'visible':'hidden';c.element.setAttribute('aria-hidden',String(weight<.1));c.element.style.opacity=String(Math.min(1,weight*2));c.title.chars.forEach((char,i)=>{const p=range(show,i/Math.max(1,c.title.chars.length-1)*.3,1);(char as HTMLElement).style.transform=`translate3d(0,${(1-ease.cubicOut(p))*112}%,0)`;(char as HTMLElement).style.opacity=String(p);});c.copy.style.opacity=String(range(show,.28,.85));c.copy.style.transform=`translate3d(0,${(1-show)*18}px,0)`;});
    this.film.style.opacity=String(s.context);this.film.style.visibility=s.context>.001?'visible':'hidden';this.film.style.transform=`translate3d(${(1-ease.cubicOut(s.context))*-80}px,${(1-s.context)*30}px,0) rotate(${(1-s.context)*-6}deg)`;
  }
  setCanvas(canvas:HTMLCanvasElement|undefined,ready=false){
    if(this.active&&canvas&&ready){if(this.attached!==canvas){this.original=canvas.parentElement!;this.host.append(canvas);this.attached=canvas;}this.root.classList.add('has-app-world');}
    else if(this.attached){this.original?.append(this.attached);this.attached=undefined;this.root.classList.remove('has-app-world');}
  }
  suspend(){this.visible=false;this.filmWanted=false;this.media.setPlaying(false);}
  resume(){this.visible=true;this.last='';}
  dispose(){this.active=false;this.setCanvas(undefined);this.abort.abort();this.media.dispose();this.captions.forEach(c=>c.title.revert());this.nextTitle.classList.remove('app-follow-title');this.nextTitle.style.opacity='';this.nextTitle.style.transform='';this.root.classList.remove('has-app-stage','app-static','has-app-world');this.root.style.height='';}
}
