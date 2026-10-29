import {getSceneViewport} from './SceneViewport';
import {SplitText} from 'gsap/SplitText';
import {ease} from '../../core/ease';
import {getOfferState,nextOfferTab} from './OfferMotion';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Panel={element:HTMLElement;title:SplitText;copy:SplitText;ratio:number};

/** ProductSection's picker/side-copy composition; both choices share one device. */
export class OfferStage {
  private product:HTMLElement;private host:HTMLElement;private top=0;private size=1;private height=1;private mobile=false;
  private tabs:HTMLButtonElement[];private panels:Panel[];private index=0;private previous='';
  private attached?:HTMLCanvasElement;private original?:HTMLElement;private abort=new AbortController();
  active=false;progress=0;distance=Infinity;
  constructor(private root:HTMLElement){
    this.product=root.querySelector('[data-offer-product]')!;this.host=root.querySelector('[data-offer-model]')!;
    this.tabs=[...root.querySelectorAll<HTMLButtonElement>('[data-offer-tab]')];
    this.panels=[...root.querySelectorAll<HTMLElement>('[data-offer-panel]')].map(element=>({element,title:SplitText.create(element.querySelector('h3')!,{type:'words,chars'}),copy:SplitText.create(element.querySelector('[data-offer-description]')!,{type:'words,chars'}),ratio:1}));
    this.tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>this.select(index),{signal:this.abort.signal});
      tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=nextOfferTab(index,event.key);this.select(next);this.tabs[next].focus();},{signal:this.abort.signal});
    });
    this.root.classList.add('has-offer-stage');this.select(0,true);
  }
  private select(index:number,initial=false){
    this.index=index;
    this.tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    this.panels.forEach((panel,i)=>{panel.element.hidden=i!==index;panel.ratio=initial?1:0;});
  }
  resize(){
    this.height=getSceneViewport().height;this.mobile=getSceneViewport().width<=600;this.top=this.product.getBoundingClientRect().top+scrollY;this.size=this.product.offsetHeight;this.previous='';
    this.panels.forEach(panel=>{panel.title.split({type:'words,chars'});panel.copy.split({type:'words,chars'});panel.ratio=1;});
  }
  render(scroll:number,dt:number,reduced:boolean){
    const local=scroll-this.top,state=getOfferState(local,this.height,this.mobile,reduced);
    this.distance=local;this.active=local>-this.height&&local<this.size;this.progress=state.progress;
    const key=[state.pickerY.toFixed(2),state.modelY.toFixed(2),state.show.toFixed(3)].join('/');
    if(key!==this.previous){this.previous=key;this.root.style.setProperty('--offer-picker-y',state.pickerY+'px');this.root.style.setProperty('--offer-model-y',state.modelY+'px');}
    const panel=this.panels[this.index];if(panel.ratio>=1)return;
    panel.ratio=reduced?1:Math.min(1,panel.ratio+dt*2);const value=panel.ratio;
    for(const split of [panel.title,panel.copy]){split.chars.forEach((char,i)=>{(char as HTMLElement).style.opacity=String(clamp((value-i/Math.max(1,split.chars.length-1)*.4)/.6));});(split.elements[0] as HTMLElement).style.transform=`translate3d(${-(1-ease.cubicOut(value))}em,0,0)`;}
  }
  setCanvas(canvas:HTMLCanvasElement|undefined,artReady=false){
    if(this.active&&canvas){
      if(this.attached!==canvas){this.original=canvas.parentElement!;this.host.append(canvas);this.attached=canvas;this.root.classList.add('has-offer-world');}
      this.root.classList.toggle('has-offer-art',artReady);
    }else if(this.attached){this.original?.append(this.attached);this.attached=undefined;this.root.classList.remove('has-offer-world','has-offer-art');}
  }
  dispose(){this.active=false;this.setCanvas(undefined);this.abort.abort();this.panels.forEach(p=>{p.title.revert();p.copy.revert();});this.root.classList.remove('has-offer-stage');}
}
