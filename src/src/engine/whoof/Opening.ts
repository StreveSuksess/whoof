import { ease } from '../core/ease';
import { OpeningScene } from './OpeningScene';
import { HeroPlate } from './HeroPlate';
import { HeroCard } from './HeroCard';
import { DetailsText, DETAIL_STOPS } from './DetailsText';
import { LifeGallery } from './life/LifeGallery';
import {liveCollarVisible} from './OpeningTransition';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const range=(v:number,a:number,b:number)=>clamp((v-a)/(b-a));
const $=<T extends Element=HTMLElement>(s:string)=>document.querySelector<T>(s)!;

export async function bootOpening() {
  document.documentElement.classList.remove('no-js');
  const hero=$('.hero-ui'),details=$('.details-ui'),vignette=$('.hero-vignette');
  const logo=$('.opening-logo'),header=$('.opening-header');
  const steps=[...document.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
  let world:OpeningScene|undefined;
  const plate=new HeroPlate();
  const card=new HeroCard();
  const detailText=new DetailsText();
  const gallery=new LifeGallery($('#life'));
  let revealStarted=0;
  let screenH=innerHeight,screenW=innerWidth,scroll=window.scrollY/innerHeight;
  let targetX=0,targetY=0,mouseX=0,mouseY=0,previous=performance.now(),raf=0,renderedScroll=-1;
  let loaded=false,visible=true,pointerHasMoved=false;
  const progress=(n:number)=>{$('#loader-percent').textContent=String(n).padStart(2,'0');$('.drawing-progress').style.strokeDashoffset=String(100-n);};
  const ready=()=>{if(loaded)return;loaded=true;revealStarted=performance.now();card.resize();detailText.resize();gallery.resize();progress(100);document.body.classList.add('is-ready');};
  const fallback=()=>{document.body.classList.add('no-webgl');ready();};
  function resize() {screenH=innerHeight;screenW=innerWidth;world?.resize(screenW,screenH);card.resize();detailText.resize();gallery.resize();void plate.resize().catch(error=>console.warn('Hero layers unavailable; keeping full render.',error));renderedScroll=-1;}
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointerHasMoved=true;targetX=e.clientX/innerWidth*2-1;targetY=e.clientY/innerHeight*2-1;},{passive:true});
  reduced.addEventListener('change',()=>{renderedScroll=-1;});
  const scrollTo=(y:number)=>window.scrollTo({top:y*screenH,behavior:reduced.matches?'instant':'smooth'});
  document.querySelectorAll<HTMLAnchorElement>('a[href="#intro"],a[href="#details"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();scrollTo(a.hash==='#intro'?0:DETAIL_STOPS[0]);}));
  steps.forEach((b,i)=>b.addEventListener('click',()=>scrollTo(DETAIL_STOPS[i])));
  $('.nav-life').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:$('#life').offsetTop+.35*screenH,behavior:reduced.matches?'instant':'smooth'});});
  function update(now:number) {
    if(!visible)return;
    const dt=Math.min(.05,(now-previous)/1000);previous=now;
    const actual=window.scrollY/screenH;
    scroll+= (actual-scroll)*(reduced.matches?1:1-Math.exp(-9*dt));
    if(Math.abs(actual-scroll)<.0003)scroll=actual;
    mouseX+=(targetX-mouseX)*(1-Math.exp(-3*dt));mouseY+=(targetY-mouseY)*(1-Math.exp(-3*dt));
    const leave=range(scroll,.02,.8),lift=ease.cubicInOut(leave),heroOpacity=1-range(scroll,.05,.43);
    
    hero.style.opacity=String(loaded?heroOpacity:0);hero.style.visibility=heroOpacity>.001?'visible':'hidden';hero.style.transform=`translate3d(0,${-ease.cubicIn(leave)*90}px,0)`;
    vignette.style.opacity=String(1-lift);
    plate.render(scroll,targetX,targetY,dt,reduced.matches,coarse.matches,pointerHasMoved);
    card.render(scroll,(now-revealStarted)/1000,loaded,reduced.matches);
    if(world)world.renderer.domElement.style.opacity=String(range(scroll,.08,.32));
    const detailOpacity=range(scroll,.6,.92)*(1-range(scroll,3.56,3.96));details.style.opacity=String(detailOpacity);details.style.visibility=detailOpacity>.001?'visible':'hidden';
    
    logo.style.transform=`scale(${1-.56*lift})`;
    const active=scroll<1.78?0:scroll<2.88?1:2;
    detailText.render(scroll,reduced.matches);
    gallery.render(scroll,reduced.matches);
    header.style.setProperty('--detail-tone',String(ease.cubicInOut(range(scroll,.48,.78))*(1-gallery.cover)));
    $('.opening-world').style.opacity=String(1-gallery.cover);
    steps.forEach((b,i)=>{if(i===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    const intro=$('.nav-intro'),detail=$('.nav-details'),life=$('.nav-life');
    [intro,detail,life].forEach(a=>a.removeAttribute('aria-current'));
    (gallery.cover>.5?life:scroll<.6?intro:detail).setAttribute('aria-current','true');
    $('.opening-progress span').style.transform=`scaleY(${clamp(window.scrollY/Math.max(1,document.documentElement.scrollHeight-screenH))})`;
    const worldVisible=liveCollarVisible(scroll,gallery.cover);
    if(!worldVisible)renderedScroll=-1;
    if(world&&loaded&&worldVisible&&(Math.abs(scroll-renderedScroll)>.00005||Math.abs(targetX-mouseX)>.0001||Math.abs(targetY-mouseY)>.0001)) {
      world.render(scroll,reduced.matches?0:mouseX,reduced.matches?0:mouseY,reduced.matches);renderedScroll=scroll;
    }
    raf=requestAnimationFrame(update);
  }
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible){gallery.resume();previous=performance.now();renderedScroll=-1;raf=requestAnimationFrame(update);}else{gallery.suspend();cancelAnimationFrame(raf);}});
  window.addEventListener('pagehide',()=>{gallery.suspend();cancelAnimationFrame(raf);});
  window.addEventListener('pageshow',event=>{if(event.persisted){gallery.resume();previous=performance.now();renderedScroll=-1;cancelAnimationFrame(raf);raf=requestAnimationFrame(update);}});
  const timeout=window.setTimeout(fallback,15000);
  try {
    world=new OpeningScene($('#opening-canvas'));resize();
    world.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});
    await Promise.all([document.fonts.ready,world.load(progress),plate.resize().catch(()=>{}),document.querySelector<HTMLImageElement>('.hero-beauty img')!.decode().catch(()=>{})]);
    document.body.classList.remove('no-webgl');
    world.render(scroll,0,0,reduced.matches);ready();
  }catch(error){console.error('Whoof presentation unavailable',error);fallback();}
  finally {clearTimeout(timeout);raf=requestAnimationFrame(update);}
}
