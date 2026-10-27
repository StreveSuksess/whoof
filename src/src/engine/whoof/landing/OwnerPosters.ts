import {getOwnerPosterState,type PosterBounds} from './OwnerPosterMotion';
type Poster={element:HTMLElement;clipper:HTMLElement;image:HTMLImageElement;inner:HTMLElement};

/** Source SocialSection composition, measured before the later Three/gallery stages. */
export class OwnerPosters {
  private stage:HTMLElement;
  private rail:HTMLElement;
  private posters:Poster[];
  private bounds:PosterBounds[]=[];
  private top=0;private width=1;private height=1;private movable=0;private mobile=false;
  private previous='';private reduced=false;
  private signal=new AbortController();
  constructor(private root:HTMLElement){
    this.stage=root.querySelector<HTMLElement>('.owners-stage')!;this.rail=root.querySelector<HTMLElement>('.owners-rail')!;
    this.posters=[...root.querySelectorAll<HTMLElement>('[data-owner-poster]')].map(element=>({element,clipper:element.querySelector<HTMLElement>('.owner-poster-clipper')!,image:element.querySelector<HTMLImageElement>('.owner-poster-image')!,inner:element.querySelector<HTMLElement>('.owner-poster-inner')!}));
    root.classList.add('has-owner-posters');
    this.stage.addEventListener('keydown',event=>{
      if(this.reduced||!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();
      const local=scrollY-this.top;
      const stops=this.posters.map((_,index)=>this.mobile?index*this.width:this.bounds[index].left);
      const current=stops.reduce((nearest,stop,index)=>Math.abs(stop-local)<Math.abs(stops[nearest]-local)?index:nearest,0);
      const index=Math.max(0,Math.min(stops.length-1,current+(event.key==='ArrowRight'?1:-1)));
      window.scrollTo({top:this.top+Math.min(stops[index],this.movable),behavior:'smooth'});
    },{signal:this.signal.signal});
  }
  resize(){
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.root.classList.toggle('owners-static',this.reduced);
    this.height=innerHeight;this.mobile=innerWidth<=600;
    this.width=this.mobile?this.rail.clientWidth:innerWidth;
    this.rail.style.transform='none';
    this.posters.forEach(p=>{p.element.style.transform='none';p.element.style.visibility='visible';p.inner.style.opacity='1';p.clipper.style.width='100%';p.image.style.transform='none';});
    this.bounds=this.posters.map(p=>({left:p.element.offsetLeft,width:p.element.offsetWidth}));
    this.movable=this.mobile?this.width*this.posters.length:Math.max(0,this.rail.scrollWidth-this.width);
    this.root.style.height=this.reduced?'':`${this.movable+this.height}px`;
    this.top=this.root.getBoundingClientRect().top+scrollY;this.previous='';
  }
  render(scroll:number,reduced:boolean){
    if(reduced)return;
    const local=scroll-this.top;
    const state=getOwnerPosterState(local,this.height,this.width,this.movable,this.bounds,this.mobile);
    const key=[state.offset.toFixed(2),state.clip.toFixed(4),state.backdrop.toFixed(4),this.mobile].join('/');
    if(key===this.previous)return;this.previous=key;
    this.root.style.setProperty('--owner-cover',String(state.backdrop));
    this.rail.style.transform=this.mobile?'none':`translate3d(${-state.offset}px,0,0)`;
    this.posters.forEach((p,index)=>{
      const panel=state.panels[index];p.clipper.style.width=`${state.clip*100}%`;
      p.element.style.visibility=panel.visible?'visible':'hidden';p.inner.style.opacity=String(panel.opacity);
      p.element.style.transform=this.mobile?`translate3d(${panel.x}px,0,0)`:'none';
      p.image.style.transform=this.mobile?'none':`translate3d(${panel.imageX}px,0,0)`;
      if(Math.abs(index-state.active)<=2)p.image.loading='eager';
    });
  }
  dispose(){this.signal.abort();this.root.classList.remove('has-owner-posters','owners-static');this.root.style.height='';this.root.style.removeProperty('--owner-cover');}
}
