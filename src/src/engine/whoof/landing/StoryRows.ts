import {SplitText} from 'gsap/SplitText';
import {getStoryRowState,STORY_VISIBILITY} from './StoryMotion';
const splitOptions={type:'words,chars',autoSplit:false} as const;
type Row={element:HTMLElement;content:HTMLElement;split:SplitText;meta:HTMLElement;visual:HTMLElement;top:number;height:number;show:number;fade:number};

/** TestimoniesTableItem's measured scroll reveal, applied to actual owner situations. */
export class StoryRows {
  private rows:Row[]=[...document.querySelectorAll<HTMLElement>('[data-story-row]')].map(element=>({
    element,content:element.querySelector<HTMLElement>('.story-row-content')!,split:SplitText.create(element.querySelector<HTMLElement>('[data-story-title]')!,splitOptions),
    meta:element.querySelector<HTMLElement>('[data-story-meta]')!,
    visual:element.querySelector<HTMLElement>('[data-story-visual]')!,top:0,height:0,show:-100,fade:-100,
  }));
  private mobile=false;
  resize(){
    this.mobile=innerWidth<=600;
    for(const row of this.rows){row.split.split(splitOptions);row.element.style.opacity='1';const rect=row.element.getBoundingClientRect();row.top=rect.top+scrollY;row.height=rect.height;row.show=row.fade=-100;}
  }
  render(scroll:number,height:number,reduced:boolean){
    for(const row of this.rows){
      const center=1-(row.top+row.height*.5-scroll)/height,state=getStoryRowState(center,reduced);
      if(Math.abs(row.fade-state.fade)>.0001){row.content.style.opacity=String(state.fade);row.fade=state.fade;}
      if(Math.abs(row.show-state.show)<.0001)continue;
      row.show=state.show;
      row.split.chars.forEach((char,index)=>{
        const ratio=index/Math.max(1,row.split.chars.length-1);
        (char as HTMLElement).style.opacity=String(reduced?1:STORY_VISIBILITY.character+(1-STORY_VISIBILITY.character)*Math.max(0,Math.min(1,(state.show-ratio*.5)/.5)));
      });
      row.meta.style.opacity=String(state.meta);
      row.visual.style.opacity=String(state.media);
      row.visual.style.transform=this.mobile?'none':`scale(${state.scale})`;
    }
  }
  dispose(){this.rows.forEach(row=>row.split.revert());}
}
