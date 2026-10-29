import {LoadingGate,type LoadingTask} from './LoadingGate';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const out=(n:number)=>1-Math.pow(1-clamp(n),3);
/** Shares Landing's ticker; no renderer or animation loop of its own. */
export class EntryLoader{
  private element=document.querySelector<HTMLElement>('[data-entry-loader]')!;
  private curtain=this.element.querySelector<HTMLElement>('[data-entry-curtain]')!;
  private canvas=this.element.querySelector<HTMLCanvasElement>('[data-entry-canvas]')!;
  private ctx=this.canvas.getContext('2d');
  private percent=this.element.querySelector<HTMLElement>('[data-entry-percent]')!;
  private chrome=[...this.element.querySelectorAll<HTMLElement>('.entry-brand,.entry-footer,.entry-continue')];
  private gate=new LoadingGate(Number(this.element.dataset.started)/1000||performance.now()/1000);
  private progress=0;private started=false;private closed=false;private width=0;private height=0;private previous=performance.now();
  private abort=new AbortController();
  constructor(private content:HTMLElement,private onReveal:(time:number)=>void){
    this.element.dataset.controlled='true';
    this.closed=this.element.dataset.state==='bypassed'||!document.documentElement.classList.contains('has-entry-loader');
    content.inert=!this.closed;if(!this.closed)content.setAttribute('aria-busy','true');
    addEventListener('whoof-entry-bypass',()=>this.finish(true),{signal:this.abort.signal});
    if(this.closed){this.onReveal(performance.now());this.canvas.width=this.canvas.height=1;}
  }
  get active(){return !this.closed;}
  set(task:LoadingTask,progress:number){this.gate.set(task,progress);}
  update(now:number,reduced:boolean){
    if(this.closed)return;
    const dt=Math.min(.05,(now-this.previous)/1000);this.previous=now;
    const state=this.gate.tick(now/1000,reduced);
    this.progress=Math.min(state.progress,this.progress+dt*.9);
    if(state.phase!=='loading'&&!this.started){
      this.started=true;if(state.reason==='ready')this.progress=1;this.element.dataset.state='revealing';this.element.dataset.reason=state.reason;document.documentElement.classList.add('entry-revealing');document.body.classList.add('is-ready');this.onReveal(now);
    }
    this.percent.firstChild!.textContent=String(Math.round(this.progress*100)).padStart(2,'0');
    const hide=1-out(state.reveal/.45);this.chrome.forEach(el=>el.style.opacity=String(hide));
    if(state.reveal>0){
      const radius=Math.hypot(innerWidth,innerHeight)*.55*out(state.reveal);
      const mask=`radial-gradient(circle at 50% 49%,transparent ${radius}px,#000 ${radius+1}px)`;
      this.curtain.style.maskImage=mask;this.curtain.style.setProperty('-webkit-mask-image',mask);
    }
    if(!reduced&&this.ctx)this.draw(now/1000,state.reveal);
    if(state.phase==='done')this.finish();
  }
  private draw(time:number,reveal:number){
    const c=this.ctx!,w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
    if(w!==this.width||h!==this.height){this.width=w;this.height=h;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);this.element.classList.add('entry-has-canvas');
    const r=Math.min(h*(w<=600?.205:.23),w*.30),rx=r*1.35,ry=r,band=r*.11;
    c.save();c.translate(w*.5,h*.49);c.rotate(-.29);c.scale(1+out(reveal)*.12,1+out(reveal)*.12);c.globalAlpha=1-out(reveal);
    // Soft technical guides, retaining the original source's measured aperture.
    c.save();const glow=c.createRadialGradient(0,0,r*.2,0,0,r*2);glow.addColorStop(0,'#f1eee638');glow.addColorStop(1,'#f1eee600');c.strokeStyle=glow;c.lineWidth=1;c.setLineDash([2,5]);
    c.beginPath();for(const x of [-rx,-rx+band,0,rx-band,rx]){c.moveTo(x,-r*2.5);c.lineTo(x,r*2.5);}for(const y of [-ry,-ry+band,ry-band,ry]){c.moveTo(-rx*2,y);c.lineTo(rx*2,y);}c.stroke();c.restore();
    c.strokeStyle='#e5e4d029';c.lineWidth=1;c.setLineDash([]);
    for(const [x,y] of [[rx,ry],[rx-band,ry-band]]){c.beginPath();c.ellipse(0,0,x,y,0,0,Math.PI*2);c.stroke();}
    c.beginPath();c.ellipse(0,band*.8,rx,ry,0,0,Math.PI);c.moveTo(-rx,0);c.lineTo(-rx,band*.8);c.moveTo(rx,0);c.lineTo(rx,band*.8);c.stroke();
    c.strokeStyle='#f1eee65c';c.setLineDash([1.5,5]);c.lineDashOffset=-time*4;c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.stroke();
    c.setLineDash([]);c.strokeStyle='#f1eee6';c.lineWidth=1.35;
    c.beginPath();c.ellipse(0,0,rx,ry,0,-Math.PI/2,-Math.PI/2+Math.PI*2*this.progress);c.stroke();
    // The capsule and side loops identify a collar rather than a thick coaster.
    c.save();c.translate(0,ry-band*.08);c.fillStyle='#121615';c.strokeStyle='#f1eee680';c.lineWidth=1;
    c.beginPath();if(c.roundRect)c.roundRect(-r*.25,-band*.58,r*.5,band*1.42,band*.68);else c.rect(-r*.25,-band*.58,r*.5,band*1.42);c.fill();c.stroke();c.strokeStyle='#f1eee633';c.beginPath();if(c.roundRect)c.roundRect(-r*.16,-band*.25,r*.32,band*.75,band*.38);else c.rect(-r*.16,-band*.25,r*.32,band*.75);c.stroke();c.restore();
    c.fillStyle='#f1eee685';for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const x=Math.cos(a)*rx,y=Math.sin(a)*ry;c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}
    c.restore();
  }
  private finish(bypassed=false){
    if(this.closed)return;this.closed=true;
    if(!this.started)this.onReveal(performance.now());
    const focus=this.element.contains(document.activeElement);
    this.element.dataset.state=bypassed?'bypassed':'done';this.element.hidden=true;this.canvas.width=this.canvas.height=1;
    this.content.inert=false;this.content.removeAttribute('aria-busy');document.documentElement.classList.remove('has-entry-loader','entry-revealing');document.body.classList.add('is-ready');
    dispatchEvent(new Event('whoof-entry-complete'));
    if(focus){const main=this.content.querySelector<HTMLElement>('main');if(main){main.tabIndex=-1;main.focus({preventScroll:true});}}
  }
  dispose(){this.finish(true);this.abort.abort();}
}
