import { SplitText } from 'gsap/SplitText';
import { fit } from '../../core/math';
import { ease } from '../../core/ease';
import { getGalleryState } from './GalleryMotion';

const splitOptions={type:'chars',mask:'chars',autoSplit:false} as const;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

/** WearableText's screen-space rects and radial bloom, with live Cyrillic outlines. */
export class LifeTitle {
  private lettering:HTMLElement;
  private glows:HTMLElement[];
  private kicker:HTMLElement;
  private anchor:HTMLElement;
  private split:SplitText;
  private fromX=0;private fromY=0;private toX=0;private toY=0;private scale=1;

  constructor(root:HTMLElement) {
    this.lettering=root.querySelector('.life-lettering')!;
    this.glows=[...root.querySelectorAll<HTMLElement>('.life-lettering-glow')];
    this.kicker=root.querySelector('.life-title-kicker')!;
    this.anchor=root.querySelector('.life-title-anchor')!;
    this.split=SplitText.create(this.kicker,splitOptions);
    this.resize();
  }
  resize() {
    this.split.split(splitOptions);
    this.fromX=(innerWidth-this.lettering.offsetWidth)/2;
    this.fromY=innerHeight*.49-this.lettering.offsetHeight/2;
    this.toX=this.anchor.offsetLeft;this.toY=this.anchor.offsetTop;
    this.scale=parseFloat(getComputedStyle(this.anchor).fontSize)/parseFloat(getComputedStyle(this.lettering).fontSize);
  }
  render(local:number,reduced:boolean) {
    const s=getGalleryState(local,reduced);
    const x=mix(this.fromX,this.toX,s.titleShrink)+(1-s.titleSlide)*innerWidth;
    const y=mix(this.fromY,this.toY,s.titleShrink);
    this.lettering.style.transform=`translate3d(${x}px,${y}px,0) scale(${mix(1,this.scale,s.titleShrink)})`;
    // Source glow mask expands from the middle of the word, separate from its crisp core.
    const radius=s.pulse*190;
    this.glows.forEach((glow,i)=>{
      glow.style.maskImage=`radial-gradient(ellipse at center,#000 ${Math.max(0,radius-48)}%,transparent ${Math.max(.01,radius)}%)`;
      glow.style.opacity=String(s.glow*(i===0?.9:.65));
    });
    this.kicker.style.transform=`translate3d(${mix(this.fromX,this.toX,s.titleShrink)}px,${y-mix(36,23,s.titleShrink)}px,0)`;
    this.split.chars.forEach((char,i)=>{
      const amount=reduced?1:fit(local,-.48+i/this.split.chars.length*.1,.02+i/this.split.chars.length*.1,0,1,ease.expoOut);
      (char as HTMLElement).style.transform=`translate3d(0,${(1-amount)*1.5}em,0)`;
    });
  }
  dispose() {this.split.revert();}
}
