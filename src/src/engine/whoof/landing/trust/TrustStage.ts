import {getSceneViewport} from '../SceneViewport';
import {SplitText} from 'gsap/SplitText';
import {ease} from '../../../core/ease';
import {getTrustState,getTrustClip,TRUST_SCROLL_UNITS,type TrustSceneState} from './TrustMotion';
const options={type:'lines',mask:'lines',autoSplit:false} as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Episode={element:HTMLElement;splits:SplitText[];extras:HTMLElement[]};
/** The Trust canvas and text both stop at the native section boundary. */
export class TrustStage {
  private host:HTMLElement;private stage:HTMLElement;private title:HTMLElement;private titleSplit:SplitText;
  private episodes:Episode[];
  private top=0;private end=0;private height=1;private width=1;private previous='';private fallback=false;
  private attached?:HTMLCanvasElement;private original?:HTMLElement;
  static=false;active=false;distance=Infinity;wearVirtual=.64;
  state:TrustSceneState=getTrustState(-1000,1,1);
  constructor(private root:HTMLElement){
    this.host=root.querySelector('[data-trust-world]')!;this.stage=root.querySelector('.trust-stage')!;this.title=root.querySelector('#trust-title')!;this.titleSplit=SplitText.create(this.title,options);
    this.episodes=[...root.querySelectorAll<HTMLElement>('[data-trust-episode]')].map(element=>({element,splits:[...element.querySelectorAll<HTMLElement>('[data-trust-copy]')].map(p=>SplitText.create(p,options)),extras:[...element.querySelectorAll<HTMLElement>('.trust-measure-line,.trust-protocol,.trust-expertise,.trust-team')]}));
    root.classList.add('has-trust-sequence');
  }
  resize(){
    this.static=this.fallback||matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.root.classList.toggle('trust-static',this.static);
    this.root.style.height=this.static?'':TRUST_SCROLL_UNITS*getSceneViewport().height+'px';
    const bounds=this.root.getBoundingClientRect();this.top=bounds.top+scrollY;this.end=bounds.bottom+scrollY;this.height=getSceneViewport().height;this.width=getSceneViewport().width;this.previous='';
    this.titleSplit.split(options);this.episodes.forEach(e=>e.splits.forEach(s=>s.split(options)));
    if(this.static){this.setCanvas(undefined);this.reset();}
  }
  useFallback(){if(this.fallback)return false;this.fallback=true;return true;}
  render(scroll:number,reduced:boolean){
    this.distance=scroll-this.top;this.state=getTrustState(this.distance,this.height,this.width);this.wearVirtual=this.state.t-TRUST_SCROLL_UNITS+.64;
    const actual=scrollY-this.top;
    this.active=!this.static&&!reduced&&actual>-this.height&&actual<this.end-this.top;
    const boundary=getTrustClip(this.top,this.end-this.top,scrollY,this.height);
    const visibleBoundary=getTrustClip(this.top,this.end-this.top,scrollY,innerHeight),clip=`inset(${visibleBoundary.top}px 0 ${visibleBoundary.bottom}px 0)`;
    this.host.style.clipPath=clip;this.host.style.visibility=this.active?'visible':'hidden';
    if(this.static||reduced)return;
    const nav=this.height<=650&&this.width/this.height>1.2?62:this.width<=600?78:100;
    this.stage.style.clipPath=`inset(${Math.max(nav,boundary.top)}px 0 ${boundary.bottom}px 0)`;
    const textInRange=actual>-this.height&&actual<TRUST_SCROLL_UNITS*this.height;
    this.stage.style.visibility=textInRange?'visible':'hidden';this.stage.inert=!textInRange;
    if(!textInRange){this.previous='';return;}
    const key=[this.state.t.toFixed(5),scrollY].join('/');if(this.previous===key)return;this.previous=key;
    const t=this.state.t;
    const title=clamp((t+.15)/.45)*(1-clamp((t-.85)/.4));
    this.title.style.visibility=title>.0001?'visible':'hidden';this.titleSplit.lines.forEach((line,i)=>{const n=clamp((title-i*.08)/.84);(line as HTMLElement).style.transform=`translate3d(0,${(1-ease.cubicOut(n))*112}%,0)`;});
    // A safe poster remains during asynchronous WebGL preparation, never a false test.
    this.root.style.setProperty('--trust-poster-x',this.state.x+'px');this.root.style.setProperty('--trust-poster-y',this.state.y+'px');this.root.style.setProperty('--trust-poster-size',this.state.diameter+'px');
    this.root.style.setProperty('--trust-protocol',String(this.state.protocol));
    this.episodes.forEach((episode,i)=>{
      const w=this.state.episodes[i];episode.element.style.visibility=w>.0001?'visible':'hidden';episode.element.setAttribute('aria-hidden',String(w<.001));episode.element.inert=w<.95;
      let index=0;episode.splits.forEach(split=>split.lines.forEach(line=>{const delay=Math.min(.22,index++*.022),n=clamp((w-delay)/(.75-delay));(line as HTMLElement).style.transform=`translate3d(0,${(1-ease.cubicOut(n))*112}%,0)`;}));
      episode.extras.forEach(extra=>{extra.style.opacity=String(clamp((w-.25)/.65));extra.style.transform=`translate3d(0,${(1-ease.cubicOut(w))*20}px,0)`;});
    });
  }
  setCanvas(canvas:HTMLCanvasElement|undefined){
    if(this.active&&canvas){if(this.attached!==canvas){this.original=canvas.parentElement!;this.host.append(canvas);this.attached=canvas;this.root.classList.add('has-trust-world');}}
    else if(this.attached){this.original?.append(this.attached);this.attached=undefined;this.root.classList.remove('has-trust-world');}
  }
  private reset(){
    this.title.style.cssText='';this.titleSplit.lines.forEach(line=>(line as HTMLElement).style.transform='none');
    this.episodes.forEach(e=>{e.element.style.cssText='';e.element.removeAttribute('aria-hidden');e.element.inert=false;e.splits.forEach(s=>s.lines.forEach(line=>(line as HTMLElement).style.transform='none'));e.extras.forEach(extra=>extra.style.cssText='');});
    this.host.style.cssText='';this.stage.style.cssText='';this.stage.inert=false;
  }
  dispose(){this.active=false;this.setCanvas(undefined);this.titleSplit.revert();this.episodes.forEach(e=>e.splits.forEach(s=>s.revert()));this.reset();this.root.classList.remove('has-trust-sequence','trust-static','has-trust-world');this.root.style.height='';}
}
