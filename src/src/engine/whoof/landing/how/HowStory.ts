import {SplitText} from 'gsap/SplitText';
import {ease} from '../../../core/ease';
import {fit} from '../../../core/math';
import {getHowState,HOW_SCROLL_UNITS,howStops} from './HowMotion';
const lineOptions={type:'lines',mask:'lines',autoSplit:false} as const;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Native sticky aperture: no fixed overlays survive the section boundary. */
export class HowStory {
  private stage:HTMLElement;private frame:HTMLElement;private rail:HTMLElement;
  private cards:HTMLElement[];private captions:HTMLElement[];private splits:SplitText[][];
  private thumbs:HTMLElement[];private word:HTMLElement;private glows:HTMLElement[];private kicker:HTMLElement;private anchor:HTMLElement;
  private prepared=false;private top=0;private height=1;private width=1;private thumbStep=1;private static=false;private active=0;private last='';
  private fromX=0;private fromY=0;private toX=0;private toY=0;private scale=1;private abort=new AbortController();
  constructor(private root:HTMLElement){
    const $=<T extends HTMLElement=HTMLElement>(s:string)=>root.querySelector<T>(s)!;
    this.stage=$('.how-stage');this.frame=$('.how-frame');this.rail=$('.how-rail');
    this.cards=[...root.querySelectorAll<HTMLElement>('.how-card')];this.captions=[...root.querySelectorAll<HTMLElement>('.how-caption')];
    this.splits=this.captions.map(c=>[...c.querySelectorAll<HTMLElement>('[data-how-copy]')].map(p=>SplitText.create(p,lineOptions)));
    this.thumbs=[...root.querySelectorAll<HTMLElement>('.how-thumbs-rail')];
    this.word=$('.how-word');this.glows=[...root.querySelectorAll<HTMLElement>('.how-word-glow')];this.kicker=$('.how-kicker');this.anchor=$('.how-word-anchor');
    this.root.classList.add('has-how-story');
    this.frame.addEventListener('keydown',e=>{
      if(this.static||e.target!==this.frame||!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();const index=Math.max(0,Math.min(this.cards.length-1,this.active+(e.key==='ArrowRight'?1:-1)));
      window.scrollTo({top:this.top+howStops[index]*this.height,behavior:'smooth'});
    },{signal:this.abort.signal});
  }
  resize(){
    this.static=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.root.classList.toggle('how-static',this.static);this.root.style.height=this.static?'':HOW_SCROLL_UNITS*innerHeight+'px';
    this.top=this.root.getBoundingClientRect().top+scrollY;this.height=innerHeight;
    this.width=this.frame.getBoundingClientRect().width;
    const thumb=this.root.querySelector<HTMLElement>('.how-thumb')!;
    this.thumbStep=thumb.getBoundingClientRect().width+parseFloat(getComputedStyle(this.thumbs[0]).gap||'0');
    this.fromX=(innerWidth-this.word.offsetWidth)/2;this.fromY=this.height*.47-this.word.offsetHeight/2;
    this.toX=this.anchor.offsetLeft;this.toY=this.anchor.offsetTop;
    this.scale=parseFloat(getComputedStyle(this.anchor).fontSize)/parseFloat(getComputedStyle(this.word).fontSize);
    this.splits.flat().forEach(s=>s.split(lineOptions));this.last='';
    if(this.static){this.reset();this.frame.removeAttribute('tabindex');}else this.frame.tabIndex=0;
  }
  private reset(){
    [this.word,this.kicker,this.frame,this.rail,...this.glows,...this.thumbs,...this.captions].forEach(el=>el.style.cssText='');
    this.frame.inert=false;this.cards.forEach(card=>{card.style.cssText='';card.removeAttribute('aria-hidden');});
    this.splits.flat().forEach(s=>s.lines.forEach(line=>(line as HTMLElement).style.transform='none'));
  }
  render(scroll:number,reduced:boolean){
    if(this.static||reduced)return;
    // Actual native sticky bounds gate the eased transport, including fast reverse scroll.
    const actual=(scrollY-this.top)/this.height;
    if(actual< -1.1||actual>HOW_SCROLL_UNITS+.1){this.last='';return;}
    if(!this.prepared){this.prepared=true;this.root.querySelectorAll<HTMLImageElement>('.how-photo').forEach(image=>{image.loading='eager';});}
    const t=(scroll-this.top)/this.height;
    const key=t.toFixed(5);if(key===this.last)return;this.last=key;
    const s=getHowState(t);this.active=s.active;
    this.rail.style.transform=`translate3d(${-s.index*this.width}px,0,0)`;
    this.frame.style.clipPath=`inset(${(1-s.reveal)*50}% 0)`;
    this.frame.style.visibility=s.reveal>.001?'visible':'hidden';
    this.frame.inert=s.reveal<.95;
    const x=mix(this.fromX,this.toX,s.titleShrink)+(1-s.titleSlide)*innerWidth,y=mix(this.fromY,this.toY,s.titleShrink);
    this.word.style.transform=`translate3d(${x}px,${y}px,0) scale(${mix(1,this.scale,s.titleShrink)})`;
    this.kicker.style.transform=`translate3d(${mix(this.fromX,this.toX,s.titleShrink)}px,${y-mix(32,23,s.titleShrink)}px,0)`;
    this.glows.forEach((glow,i)=>{const r=s.pulse*190;glow.style.maskImage=`radial-gradient(ellipse at center,#000 ${Math.max(0,r-48)}%,transparent ${Math.max(.01,r)}%)`;glow.style.opacity=String(s.glow*(i===0?.9:.65));});
    this.thumbs.forEach(rail=>{rail.style.transform=`translate3d(${-s.index*this.thumbStep}px,-50%,0)`;rail.parentElement!.style.opacity=String(s.reveal*.38);});
    this.cards.forEach((card,i)=>{
      const distance=Math.abs(s.index-i),weight=Math.max(0,1-distance*2.2)*s.reveal;
      card.style.visibility=distance<1.001?'visible':'hidden';card.setAttribute('aria-hidden',String(i!==s.active));
      this.captions[i].style.visibility=weight>.001?'visible':'hidden';
      let lineIndex=0;this.splits[i].forEach(split=>split.lines.forEach(line=>{const delay=Math.min(.22,lineIndex++*.025);const amount=fit(weight,delay,.7+delay,0,1,ease.cubicOut);(line as HTMLElement).style.transform=`translate3d(0,${(1-amount)*115}%,0)`;}));
    });
  }
  dispose(){this.abort.abort();this.splits.flat().forEach(s=>s.revert());this.reset();this.frame.inert=false;this.root.classList.remove('has-how-story','how-static');this.root.style.height='';}
}
