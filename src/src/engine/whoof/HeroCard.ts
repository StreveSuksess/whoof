import { SplitText } from 'gsap/SplitText';
import { ease } from '../core/ease';
import { fit } from '../core/math';

/** Source HeroSection card equations, with the glass outside the fading UI backdrop root. */
export class HeroCard {
  private card=document.querySelector<HTMLElement>('.hero-glass')!;
  private divider=this.card.querySelector<HTMLElement>('.dashed-rule')!;
  private title=SplitText.create(this.card.querySelector('h2')!,{type:'lines',mask:'lines',autoSplit:false});
  private description=SplitText.create(this.card.querySelector('p')!,{type:'lines',mask:'lines',autoSplit:false});
  resize(){this.title.split({type:'lines',mask:'lines',autoSplit:false});this.description.split({type:'lines',mask:'lines',autoSplit:false});}
  render(scroll:number,elapsed:number,ready:boolean,reduced:boolean){
    const active=fit(scroll,.03,.61,1,0),time=reduced?3:elapsed;
    this.card.style.visibility=ready&&active>0?'visible':'hidden';
    if(!ready||active<=0)return;
    const shift=reduced?0:fit(time,.5,1,-Math.min(innerWidth*.03125,40),0,ease.cubicOut);
    this.card.style.transform=`translate3d(${shift}px,0,0)`;
    // Original blurBox has two ends that enter at different times; radius is 8% of viewport.
    const a=fit(active*1.5,0,1,0,1)*fit(time,.5,1.5,0,1);
    const b=fit(active*1.5,.5,1.5,0,1)*fit(time,1,2,0,1);
    this.card.style.setProperty('--glass-blur',`${Math.min(100,innerHeight*.08)*Math.max(a,b)}px`);
    this.card.style.setProperty('--glass-a',String(.15*a));
    this.card.style.setProperty('--glass-b',String(.15*b));
    this.card.style.setProperty('--glass-outline',String(.17*a));
    this.card.style.setProperty('--glass-grain',String(.095*a));
    for(const split of [this.title,this.description]){
      split.lines.forEach((element,i)=>{
        const line=element as HTMLElement,mask=line.parentElement!;
        const ratio=i/Math.max(1,split.lines.length-1);
        const enter=reduced?0:fit(time,.5+ratio*.2,1.5+ratio*.2,-1,0,ease.cubicOut);
        const exit=reduced?0:fit(active,ratio*.2,ratio*.2+.8,1,0,ease.cubicOut);
        line.style.transform=`translate3d(0,${exit}em,0)`;
        mask.style.transform=`translate3d(${enter}em,0,0)`;
        mask.style.opacity=String(fit(time,.5+ratio*.2,1.5+ratio*.2,0,1));
      });
    }
    this.divider.style.width=`${fit(active*fit(time,.5,1,0,1),0,1,0,100,ease.cubicOut)}%`;
  }
}
