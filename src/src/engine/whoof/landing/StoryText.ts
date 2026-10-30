import {SplitText} from 'gsap/SplitText';
import {getStoryState} from './StoryMotion';
const options={type:'lines,words,chars',mask:'chars',autoSplit:false} as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/** Oryzo TestimoniesSection's staggered character opacity; title clears the hero first. */
export class StoryText {
  private title=SplitText.create('#situations-title',options);
  private description=SplitText.create('#situations-copy',options);
  private descriptionRoot=document.querySelector<HTMLElement>('.situations-description')!;
  private last='';
  resize(){this.title.split(options);this.description.split(options);this.last='';}
  render(scroll:number,reduced:boolean){
    const state=getStoryState(scroll);
    const opacity=1-clamp((scroll-1.12)/.48),key=[state.title,state.description,opacity,reduced].join('/');
    if(key===this.last)return;this.last=key;
    // The source mobile copy sits at80% height; clear it before the table/header meet.
    this.descriptionRoot.style.opacity=String(opacity);
    for(const [split,progress] of [[this.title,state.title],[this.description,state.description]] as const){
      split.chars.forEach((char,index)=>{
        const ratio=index/Math.max(1,split.chars.length-1);
        (char as HTMLElement).style.opacity=String(reduced?1:clamp((progress-ratio*.5)/.5));
      });
    }
  }
  dispose(){this.title.revert();this.description.revert();}
}
