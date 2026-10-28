const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function getEndingClip(top:number,size:number,scroll:number,height:number){return {top:clamp(top-scroll,0,height),bottom:clamp(scroll+height-top-size,0,height)};}
export class KibbleStage{
  private host:HTMLElement;private top=0;private size=1;private height=1;private attached?:HTMLCanvasElement;private original?:HTMLElement;
  active=false;distance=Infinity;progress=0;
  constructor(private root:HTMLElement){this.host=root.querySelector('[data-ending-world]')!;}
  resize(){this.height=innerHeight;this.measure();}
  measure(){const bounds=this.root.getBoundingClientRect();this.top=bounds.top+scrollY;this.size=bounds.height;}
  render(scroll:number){
    this.distance=scroll-this.top;this.active=this.distance>-this.height&&this.distance<this.size;
    this.progress=clamp((this.distance+this.height)/this.height,0,1);
    const clip=getEndingClip(this.top,this.size,scroll,this.height);
    this.host.style.clipPath=`inset(${clip.top}px 0 ${clip.bottom}px 0)`;this.host.style.visibility=this.active?'visible':'hidden';
    this.host.style.opacity=String(clamp(this.progress/.5,0,1));
  }
  setCanvas(canvas:HTMLCanvasElement|undefined,ready=false){
    if(this.active&&canvas&&ready){if(this.attached!==canvas){this.original=canvas.parentElement!;this.host.append(canvas);this.attached=canvas;}}
    else if(this.attached){this.original?.append(this.attached);this.attached=undefined;}
  }
  dispose(){this.setCanvas(undefined);this.host.style.cssText='';}
}
