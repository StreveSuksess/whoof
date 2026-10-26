import { SplitText } from 'gsap/SplitText';
import { ease } from '../../core/ease';
import { fit } from '../../core/math';
import { getGalleryState, cardStops } from './GalleryMotion';
import { GalleryVideo } from './GalleryVideo';
import { LifeTitle } from './LifeTitle';

const splitOptions={type:'lines',mask:'lines',autoSplit:false} as const;

/** Portrait WearableGallery choreography, isolated from Oryzo's old scene globals. */
export class LifeGallery {
  private stage:HTMLElement;
  private frame:HTMLElement;
  private rail:HTMLElement;
  private cards:HTMLElement[];
  private media:HTMLElement[];
  private clips:GalleryVideo[];
  private thumbs:HTMLElement[];
  private captions:HTMLElement[];
  private splits:SplitText[][];
  private title:LifeTitle;
  private startButton:HTMLButtonElement;
  private start=0; private width=1; private height=1; private thumbStep=1;
  private active=0;private lastReduced=false;private playbackAllowed=true;private suspended=false;
  private listeners=new AbortController();
  cover=0;

  constructor(private root:HTMLElement) {
    const $=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
    this.stage=$('.life-stage');this.frame=$('.life-frame');this.rail=$('.life-rail');
    this.cards=[...root.querySelectorAll<HTMLElement>('.life-card')];
    this.media=[...root.querySelectorAll<HTMLElement>('.life-card-media')];
    this.clips=[...root.querySelectorAll<HTMLVideoElement>('video')].map(video=>new GalleryVideo(video));
    this.thumbs=[...root.querySelectorAll<HTMLElement>('.life-thumbs-rail')];
    this.captions=[...root.querySelectorAll<HTMLElement>('.life-story')];
    this.splits=this.captions.map(caption=>[...caption.querySelectorAll<HTMLElement>('[data-life-copy]')].map(p=>SplitText.create(p,splitOptions)));
    this.title=new LifeTitle(root);
    this.startButton=$('.life-start');
    this.lastReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.playbackAllowed=!this.lastReduced;
    const options={signal:this.listeners.signal};
    this.startButton.addEventListener('click',()=>this.startPlayback(),options);
    this.frame.addEventListener('keydown',e=>{
      if(e.target!==this.frame)return;
      if(e.key==='ArrowRight'||e.key==='ArrowLeft') {e.preventDefault();this.go(this.active+(e.key==='ArrowRight'?1:-1));}
      if(e.key==='Enter'&&(!this.playbackAllowed||this.clips[this.active].blocked)){e.preventDefault();this.startPlayback();}
    },options);
    this.resize();
  }
  private startPlayback() {
    this.playbackAllowed=true;this.clips[this.active].retry();
    this.clips[this.active].setPlaying(!this.suspended);
  }
  private go(index:number) {
    const i=Math.max(0,Math.min(this.cards.length-1,index));
    window.scrollTo({top:this.start+cardStops[i]*this.height,behavior:this.lastReduced?'instant':'smooth'});
  }
  resize() {
    this.start=this.root.getBoundingClientRect().top+window.scrollY;
    this.height=innerHeight;this.width=parseFloat(getComputedStyle(this.frame).width);
    const thumb=this.root.querySelector<HTMLElement>('.life-thumb')!;
    this.thumbStep=thumb.getBoundingClientRect().width+parseFloat(getComputedStyle(this.thumbs[0]).gap);
    this.title.resize();this.splits.flat().forEach(split=>split.split(splitOptions));
  }
  render(scroll:number,reduced:boolean) {
    if(reduced&&!this.lastReduced)this.playbackAllowed=false;
    if(!reduced&&this.lastReduced)this.playbackAllowed=true;
    this.lastReduced=reduced;
    const local=scroll-this.start/this.height;
    const state=getGalleryState(local,reduced,this.root.hasAttribute('data-gallery-exit'));this.cover=state.cover;
    this.stage.style.visibility=state.visible?'visible':'hidden';
    this.stage.setAttribute('aria-hidden',String(!state.visible));
    this.stage.inert=state.cover<.95;
    this.stage.style.opacity=String(state.cover);
    if(!state.visible) {this.clips.forEach(clip=>clip.setPlaying(false));return;}
    this.title.render(local,reduced);
    this.active=state.active;
    this.rail.style.transform=`translate3d(${-state.index*this.width}px,0,0)`;
    // Reveal the video by opening the portrait aperture; never zoom a held frame.
    this.frame.style.clipPath=`inset(${(1-state.galleryReveal)*50}% 0)`;
    this.frame.style.visibility=state.galleryReveal>.001?'visible':'hidden';
    this.frame.inert=state.galleryReveal<.98;
    this.thumbs.forEach(rail=>{
      rail.style.transform=`translate3d(${-state.index*this.thumbStep}px,-50%,0)`;
      rail.parentElement!.style.opacity=String(state.galleryReveal*.5);
    });
    this.cards.forEach((card,i)=>{
      const offset=state.index-i,visible=Math.abs(offset)<1;
      card.setAttribute('aria-hidden',String(i!==state.active));
      card.style.visibility=visible?'visible':'hidden';
      const transit=fit(state.index,i-1,i,0,1)-1+(i<this.cards.length-1?fit(state.index,i,i+1,0,1):0);
      this.media[i].style.transform=reduced?'none':`rotate(${-10*transit}deg) scale(${1+Math.abs(transit)*.2})`;
      const captionVisibility=Math.max(0,1-Math.abs(offset)*2.4)*state.galleryReveal;
      this.captions[i].style.visibility=captionVisibility>0?'visible':'hidden';
      let lineIndex=0;
      this.splits[i].forEach(split=>split.lines.forEach(line=>{
        const delay=lineIndex++*.035;
        const amount=reduced?1:fit(captionVisibility,delay,.76+delay,0,1,ease.cubicOut);
        (line as HTMLElement).style.transform=`translate3d(0,${(1-amount)*115}%,0)`;
      }));
      if(local>.55&&Math.abs(i-state.index)<1.2)this.clips[i].prepare();
      this.clips[i].setPlaying(state.cover>.95&&state.galleryReveal>.03&&i===state.active&&this.playbackAllowed&&!this.suspended);
    });
    this.startButton.hidden=this.playbackAllowed&&!this.clips[this.active].blocked;
  }
  suspend() {this.suspended=true;this.clips.forEach(clip=>clip.setPlaying(false));}
  resume() {this.suspended=false;}
  dispose() {this.suspend();this.listeners.abort();this.title.dispose();this.splits.flat().forEach(s=>s.revert());this.clips.forEach(c=>c.dispose());}
}
