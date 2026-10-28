const easing='cubic-bezier(.25,.8,.25,1)';

/** Keep native disclosure semantics; only borrow the layout during motion. */
class Disclosure{
  readonly panel:HTMLElement;
  private summary:HTMLElement;
  private expanded:boolean;
  private heightMotion?:Animation;
  private contentMotion?:Animation;
  private targetHeight=0;
  private abort=new AbortController();

  constructor(private element:HTMLDetailsElement,private reduced:()=>boolean,private changed:()=>void){
    this.summary=element.querySelector('summary')!;
    this.panel=element.querySelector('.accordion-panel')!;
    this.expanded=element.open;
    element.classList.add('has-accordion');this.sync();
    this.summary.addEventListener('click',event=>{event.preventDefault();this.move(!this.expanded);},{signal:this.abort.signal});
    element.addEventListener('toggle',()=>{
      if(this.heightMotion)return;
      this.expanded=element.open;this.sync();this.changed();
    },{signal:this.abort.signal});
  }
  get moving(){return !!this.heightMotion;}
  private sync(){
    this.element.dataset.expanded=String(this.expanded);
    this.summary.setAttribute('aria-expanded',String(this.expanded));
    if(!this.expanded&&this.panel.contains(document.activeElement))this.summary.focus({preventScroll:true});
    this.panel.inert=!this.expanded;
  }
  private dimensions(){
    const style=getComputedStyle(this.element);
    const closed=this.summary.getBoundingClientRect().height+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    return {closed,full:closed+this.panel.getBoundingClientRect().height};
  }
  private cancel(){
    if(this.heightMotion){this.heightMotion.onfinish=null;this.heightMotion.cancel();this.heightMotion=undefined;}
    this.contentMotion?.cancel();this.contentMotion=undefined;
  }
  finish(){
    this.cancel();this.element.open=this.expanded;this.element.style.height='';
    this.element.classList.remove('is-transitioning');this.sync();this.changed();
  }
  private move(expanded:boolean){
    const from=this.element.getBoundingClientRect().height,wasOpen=this.element.open;
    const style=getComputedStyle(this.panel),opacity=wasOpen?Number(style.opacity):0;
    const transform=wasOpen?style.transform:'translateY(-6px)';
    this.cancel();this.expanded=expanded;this.sync();
    this.element.style.height=from+'px';this.element.open=true;
    const {closed,full}=this.dimensions(),to=expanded?full:closed;
    this.targetHeight=to;
    if(this.reduced()||Math.abs(from-to)<.5){this.finish();return;}
    const distance=Math.min(1,Math.abs(to-from)/Math.max(1,full-closed));
    const duration=Math.max(100,(expanded?580:420)*distance);
    this.element.classList.add('is-transitioning');
    const motion=this.element.animate([{height:from+'px'},{height:to+'px'}],{duration,easing,fill:'both'});
    this.heightMotion=motion;
    this.contentMotion=this.panel.animate([
      {opacity,transform},
      {opacity:expanded?1:0,transform:expanded?'translateY(0)':'translateY(-4px)'}
    ],{duration:duration*(expanded?.85:.8),easing,fill:'both'});
    motion.onfinish=()=>{if(this.heightMotion===motion)this.finish();};
    this.changed();
  }
  resize(){
    if(this.reduced()&&this.moving)this.finish();
    else if(this.moving){
      const {closed,full}=this.dimensions(),target=this.expanded?full:closed;
      if(Math.abs(target-this.targetHeight)>.5)this.move(this.expanded);
    }
    this.changed();
  }
  dispose(){
    this.abort.abort();this.finish();this.element.classList.remove('has-accordion');
    delete this.element.dataset.expanded;this.summary.removeAttribute('aria-expanded');this.panel.inert=false;
  }
}

/** No ticker: Landing's existing RAF measures only while layout is changing. */
export class Accordions{
  private items:Disclosure[]=[];
  private observer?:ResizeObserver;
  private dirty=true;
  private invalidate=()=>{
    this.dirty=true;
    document.documentElement.classList.toggle('is-accordion-moving',this.items.some(item=>item.moving));
  };
  constructor(root:HTMLElement,reduced:()=>boolean){
    if(typeof root.animate!=='function')return;
    this.items=[...root.querySelectorAll<HTMLDetailsElement>('[data-accordion]')].map(element=>new Disclosure(element,reduced,this.invalidate));
    const panels=new Map(this.items.map(item=>[item.panel,item]));
    this.observer=new ResizeObserver(entries=>entries.forEach(entry=>panels.get(entry.target as HTMLElement)?.resize()));
    this.items.forEach(item=>this.observer!.observe(item.panel));
  }
  update(){const changed=this.dirty||this.items.some(item=>item.moving);this.dirty=false;return changed;}
  resize(){this.items.forEach(item=>item.resize());}
  finish(){this.items.forEach(item=>{if(item.moving)item.finish();});}
  dispose(){this.observer?.disconnect();this.items.forEach(item=>item.dispose());document.documentElement.classList.remove('is-accordion-moving');}
}
