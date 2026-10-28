import {SplitText} from 'gsap/SplitText';
import {getStoryState} from './StoryMotion';
const options={type:'lines,words,chars',mask:'chars',autoSplit:false} as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/** Oryzo TestimoniesSection's staggered character opacity; title clears the hero first. */
export class StoryText {
  private title=SplitText.create('#situations-title',options);
  private description=SplitText.create('#situations-copy',options);
  private descriptionRoot=document.querySelector<HTMLElement>('.situations-description')!;
  private last=-100;
  private lastReduced=false;
  resize(){this.title.split(options);this.description.split(options);this.last=-100;}
  render(scroll:number,reduced:boolean){
    if(scroll===this.last&&reduced===this.lastReduced)return;this.last=scroll;this.lastReduced=reduced;
    const state=getStoryState(scroll);
    // The source mobile copy sits at80% height; clear it before the table/header meet.
    this.descriptionRoot.style.opacity=String(1-clamp((scroll-1.12)/.48));
    for(const [split,progress] of [[this.title,state.title],[this.description,state.description]] as const){
      split.chars.forEach((char,index)=>{
        const ratio=index/Math.max(1,split.chars.length-1);
        (char as HTMLElement).style.opacity=String(reduced?1:clamp((progress-ratio*.5)/.5));
      });
    }
  }
  dispose(){this.title.revert();this.description.revert();}
}
