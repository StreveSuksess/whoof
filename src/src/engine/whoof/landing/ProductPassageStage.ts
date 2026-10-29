import {getSceneViewport} from './SceneViewport';
import {getProductPassageClip,getProductPassageState} from './ProductPassageMotion';
/** The same fixed canvas survives the semantic Trust/Offer boundary. */
export class ProductPassageStage{
  private host:HTMLElement;private canvasHost:HTMLElement;private trust:HTMLElement;private trustStage:HTMLElement;private offer:HTMLElement;
  private ui:HTMLElement[];private top=0;private end=0;private orderTop=0;private height=1;private attached?:HTMLCanvasElement;private original?:HTMLElement;private previous='';
  active=false;local=0;actualLocal=0;blend=0;exitOffset=0;
  constructor(private root:HTMLElement){this.host=root.querySelector('[data-product-passage]')!;this.canvasHost=this.host.querySelector('[data-passage-canvas]')!;this.trust=root.querySelector('#trust')!;this.trustStage=this.trust.querySelector('.trust-stage')!;this.offer=root.querySelector('[data-offer-product]')!;this.ui=[...this.offer.querySelectorAll<HTMLElement>('.offer-picker,.offer-panel')];}
  measure(){this.height=getSceneViewport().height;const trust=this.trust.getBoundingClientRect(),offer=this.offer.getBoundingClientRect();this.top=trust.top+scrollY;this.orderTop=offer.top+scrollY;this.end=offer.bottom+scrollY;this.previous='';}
  render(scroll:number,disabled:boolean){
    this.root.classList.toggle('has-product-passage',!disabled);this.local=scroll-this.orderTop;this.actualLocal=scrollY-this.orderTop;this.exitOffset=Math.max(0,scroll-this.end+this.height);
    this.active=!disabled&&scrollY>this.top-this.height&&scrollY<this.end;
    const state=getProductPassageState(this.local,this.height,this.actualLocal);this.blend=state.blend;
    if(!disabled&&state.trustCopy<.05)this.trustStage.inert=true;
    const boundary=getProductPassageClip(this.top,this.end,scrollY,innerHeight),key=[this.active,boundary.top,boundary.bottom,state.blend.toFixed(5),state.ui.toFixed(5),state.trustCopy.toFixed(5)].join('/');
    if(key===this.previous)return;this.previous=key;
    this.host.style.visibility=this.active?'visible':'hidden';this.host.style.clipPath=`inset(${boundary.top}px 0 ${boundary.bottom}px 0)`;
    this.host.style.setProperty('--passage-dark',String(state.blend));this.root.style.setProperty('--offer-ui',disabled?'1':String(state.ui));
    this.ui.forEach(element=>element.inert=!disabled&&state.ui<.95);
    this.trustStage.style.opacity=disabled?'':String(state.trustCopy);
  }
  setCanvas(canvas:HTMLCanvasElement|undefined){
    if(this.active&&canvas){if(this.attached!==canvas){this.original=canvas.parentElement!;this.canvasHost.append(canvas);this.attached=canvas;this.root.classList.add('has-product-world');}}
    else if(this.attached){this.original?.append(this.attached);this.attached=undefined;this.root.classList.remove('has-product-world');}
  }
  dispose(){this.active=false;this.setCanvas(undefined);this.ui.forEach(element=>element.inert=false);this.trustStage.style.opacity='';this.trustStage.inert=false;this.host.style.cssText='';this.root.style.removeProperty('--offer-ui');this.root.classList.remove('has-product-passage','has-product-world');}
}
