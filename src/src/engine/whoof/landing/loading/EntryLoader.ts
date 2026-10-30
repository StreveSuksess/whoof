import {LoadingGate,type LoadingTask} from './LoadingGate';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const out=(n:number)=>1-Math.pow(1-clamp(n),3);
/** Vector-only mark; shares Landing's ticker and actual readiness milestones. */
export class EntryLoader{
  private element=document.querySelector<HTMLElement>('[data-entry-loader]')!;
  private curtain=this.element.querySelector<HTMLElement>('[data-entry-curtain]')!;
  private identity=this.element.querySelector<HTMLElement>('[data-entry-identity]')!;
  private liquid=this.element.querySelector<SVGPathElement>('[data-entry-liquid]')!;
  private back=this.element.querySelector<SVGPathElement>('[data-entry-liquid-back]')!;
  private surface=this.element.querySelector<SVGPathElement>('[data-entry-surface]')!;
  private button=this.element.querySelector<HTMLElement>('[data-entry-continue]')!;
  private gate=new LoadingGate(Number(this.element.dataset.started)/1000||performance.now()/1000);
  private progress=0;private completionProgress?:number;private started=false;private closed=false;private previous=performance.now();
  private abort=new AbortController();
  constructor(private content:HTMLElement,private onReveal:(time:number)=>void){
    this.element.dataset.controlled='true';
    this.closed=this.element.dataset.state==='bypassed'||!document.documentElement.classList.contains('has-entry-loader');
    content.inert=!this.closed;if(!this.closed)content.setAttribute('aria-busy','true');
    addEventListener('whoof-entry-bypass',()=>this.finish(true),{signal:this.abort.signal});
    if(this.closed)this.onReveal(performance.now());
  }
  get active(){return !this.closed;}
  set(task:LoadingTask,progress:number){this.gate.set(task,progress);}
  update(now:number,reduced:boolean){
    if(this.closed)return;
    const dt=Math.min(.05,(now-this.previous)/1000);this.previous=now;
    const state=this.gate.tick(now/1000,reduced);
    if(state.phase==='loading'){
      this.progress+=(state.progress-this.progress)*(1-Math.exp(-dt*6));
    }else{
      if(this.completionProgress===undefined){
        this.completionProgress=this.progress;this.element.dataset.state='completing';this.element.dataset.reason=state.reason;
      }
      // Finish the actual completed fill before revealing the prepared scene.
      if(state.reason==='ready')this.progress=this.completionProgress+(1-this.completionProgress)*out(state.reveal/.28);
    }
    const reveal=reduced?state.reveal:clamp((state.reveal-.28)/.72),fade=out(reveal);
    if(reveal>0&&!this.started){
      this.started=true;this.element.dataset.state='revealing';document.documentElement.classList.add('entry-revealing');document.body.classList.add('is-ready');this.onReveal(now);
    }
    this.identity.style.opacity=String(1-fade);this.identity.style.transform=`translate(-50%,calc(-50% - ${fade*10}px)) scale(${1-fade*.035})`;
    this.button.style.opacity=String(1-fade);this.curtain.style.opacity=String(1-fade);
    this.draw(reduced?0:now/1000,reduced);
    if(state.phase==='done')this.finish();
  }
  private draw(time:number,reduced:boolean){
    const level=330-this.progress*342;
    const amplitude=reduced?0:Math.sin(Math.PI*this.progress)*7;
    const top=(phase:number,offset=0)=>{
      const y=level+offset,wave=(angle:number)=>y+Math.sin(phase+angle)*amplitude;
      return `M-12 ${wave(0)} C42 ${wave(1.7)} 98 ${wave(2.4)} 147 ${wave(3.1)} S251 ${wave(4.8)} 307 ${wave(5.6)}`;
    };
    const front=top(time*1.7);
    this.back.setAttribute('d',top(time*1.3+1.8,-2)+' V340 H-12Z');
    this.liquid.setAttribute('d',front+' V340 H-12Z');this.surface.setAttribute('d',front);
  }
  private finish(bypassed=false){
    if(this.closed)return;this.closed=true;
    if(!this.started)this.onReveal(performance.now());
    const focus=this.element.contains(document.activeElement);
    this.element.dataset.state=bypassed?'bypassed':'done';this.element.hidden=true;
    this.content.inert=false;this.content.removeAttribute('aria-busy');document.documentElement.classList.remove('has-entry-loader','entry-revealing');document.body.classList.add('is-ready');
    dispatchEvent(new Event('whoof-entry-complete'));
    if(focus){const main=this.content.querySelector<HTMLElement>('main');if(main){main.tabIndex=-1;main.focus({preventScroll:true});}}
  }
  dispose(){this.finish(true);this.abort.abort();}
}
