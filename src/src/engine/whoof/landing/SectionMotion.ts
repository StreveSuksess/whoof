import { SplitText } from 'gsap/SplitText';
import {ease} from '../../core/ease';
const options={type:'lines',mask:'lines',autoSplit:false} as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Source-style line masks, measured on layout changes rather than every frame. */
export class SectionMotion {
  private items:{element:HTMLElement;split:SplitText;top:number;last:number}[];
  constructor(root:HTMLElement){
    this.items=[...root.querySelectorAll<HTMLElement>('[data-reveal]')].map(element=>({element,split:SplitText.create(element,options),top:0,last:-1}));
    this.resize();
  }
  resize(){
    this.items.forEach(item=>{item.split.split(options);item.last=-1;});this.measure();
  }
  measure(){this.items.forEach(item=>{item.top=item.element.getBoundingClientRect().top+scrollY;});}
  render(scroll:number,height:number,reduced:boolean){
    this.items.forEach(item=>{
      const progress=reduced?1:clamp((scroll+height*.9-item.top)/(height*.37));
      if(Math.abs(item.last-progress)<.0001)return;item.last=progress;
      item.split.lines.forEach((line,index)=>{
        const delay=Math.min(.28,index*.07);
        const amount=ease.cubicOut(clamp((progress-delay)/(1-delay)));
        (line as HTMLElement).style.transform='translate3d(0,'+((1-amount)*112)+'%,0)';
      });
    });
  }
  dispose(){this.items.forEach(item=>item.split.revert());}
}
