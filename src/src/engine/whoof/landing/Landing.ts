import {ease} from '../../core/ease';
import {OpeningScene} from '../OpeningScene';
import {HeroPlate} from '../HeroPlate';
import {HeroCard} from '../HeroCard';
import {DetailsText,DETAIL_STOPS} from '../DetailsText';
import {LifeGallery} from '../life/LifeGallery';
import {GalleryVideo} from '../life/GalleryVideo';
import {SectionMotion} from './SectionMotion';
import {AppExample} from './AppExample';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const range=(n:number,a:number,b:number)=>clamp((n-a)/(b-a));
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;

export function bootLanding(){
  document.documentElement.classList.remove('no-js');
  document.body.classList.add('is-ready');
  const root=$('.landing-v27'),hero=$('.hero-ui'),worldRoot=$('.opening-world'),details=$('.details-ui'),header=$('.opening-header'),logo=$('.opening-logo');
  const plate=new HeroPlate(),card=new HeroCard(),detailText=new DetailsText(),gallery=new LifeGallery($('#life')),type=new SectionMotion(root);
  const app=new AppExample($('#app'),()=>{type.resize();measure();gallery.resize();});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
  const steps=[...document.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const sections=[...document.querySelectorAll<HTMLElement>('#landing-content > section')];
  const clips=[...root.querySelectorAll<HTMLVideoElement>('[data-inline-video]')].map(element=>({media:new GalleryVideo(element),onscreen:false}));
  const themeRanges:{top:number;bottom:number;tone:string}[]=[];
  let world:OpeningScene|undefined,worldRequested=false,worldFailed=false,worldReady=false,lastRender=-100,raf=0;
  let height=innerHeight,width=innerWidth,wearStart=0,wearEnd=0,scroll=scrollY/innerHeight;
  let targetX=0,targetY=0,mouseX=0,mouseY=0,moved=false,visible=!document.hidden,previous=performance.now(),started=performance.now(),leftHero=false;
  const listenerAbort=new AbortController(),signal=listenerAbort.signal;
  function measure(){
    height=innerHeight;width=innerWidth;
    wearStart=($('#details').getBoundingClientRect().top+scrollY)/height;
    wearEnd=wearStart+$('#details').offsetHeight/height;
    themeRanges.length=0;
    sections.forEach(section=>{const rect=section.getBoundingClientRect();themeRanges.push({top:rect.top+scrollY,bottom:rect.bottom+scrollY,tone:section.dataset.tone||'light'});});
  }
  async function loadWorld(){
    if(worldRequested)return;worldRequested=true;
    try{
      world=new OpeningScene($('#opening-canvas'));world.resize(width,height);
      await world.load(()=>{});worldReady=true;lastRender=-100;
      world.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();worldFailed=true;document.body.classList.add('no-webgl');},{signal});
    }catch(error){worldFailed=true;document.body.classList.add('no-webgl');console.warn('Whoof 3D unavailable; content and rendered scene remain available.',error);}
  }
  function resize(){height=innerHeight;width=innerWidth;card.resize();detailText.resize();type.resize();measure();gallery.resize();world?.resize(width,height);void plate.resize().catch(()=>{});lastRender=-100;}
  const updateClip=(clip:typeof clips[number])=>clip.media.setPlaying(clip.onscreen&&visible&&!reduced.matches);
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{const clip=clips.find(c=>c.media.element===entry.target);if(clip){clip.onscreen=entry.isIntersecting&&entry.intersectionRatio>.15;updateClip(clip);}});
  },{threshold:[0,.15,.5]});
  clips.forEach(clip=>observer.observe(clip.media.element));
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor=>anchor.addEventListener('click',event=>{
    const target=document.querySelector<HTMLElement>(anchor.hash);if(!target)return;
    event.preventDefault();
    let top=target.getBoundingClientRect().top+scrollY;
    if(anchor.hash==='#wearing')top=(wearStart+DETAIL_STOPS[0]-.64)*height;
    else if(anchor.hash==='#life')top+=.35*height;
    else if(anchor.hash!=='#intro')top-=70;
    const url=new URL(location.href);url.hash=anchor.hash;history.replaceState(null,'',url);
    const direct=reduced.matches||Math.abs(top-scrollY)>height*2.5;
    if(direct)scroll=top/height;
    window.scrollTo({top,behavior:direct?'instant':'smooth'});
  },{signal}));
  steps.forEach((button,i)=>button.addEventListener('click',()=>window.scrollTo({top:(wearStart+DETAIL_STOPS[i]-.64)*height,behavior:reduced.matches?'instant':'smooth'}),{signal}));
  addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;moved=true;targetX=event.clientX/width*2-1;targetY=event.clientY/height*2-1;},{passive:true,signal});
  addEventListener('resize',resize,{passive:true,signal});
  reduced.addEventListener('change',()=>{clips.forEach(updateClip);lastRender=-100;},{signal});
  function update(now:number){
    if(!visible)return;
    const dt=Math.min(.05,(now-previous)/1000);previous=now;
    const actual=scrollY/height;
    scroll+=(actual-scroll)*(reduced.matches?1:1-Math.exp(-9*dt));if(Math.abs(actual-scroll)<.0003)scroll=actual;
    mouseX+=(targetX-mouseX)*(1-Math.exp(-3*dt));mouseY+=(targetY-mouseY)*(1-Math.exp(-3*dt));
    const inHero=scroll<1.05,heroOpacity=1-range(scroll,.05,.6);
    hero.style.opacity=String(heroOpacity);hero.style.visibility=heroOpacity>.001?'visible':'hidden';hero.inert=heroOpacity<.1;
    card.render(scroll,(now-started)/1000,true,reduced.matches);
    if(inHero){plate.render(worldReady?scroll:Math.min(scroll,.08),targetX,targetY,dt,reduced.matches,coarse.matches,moved);leftHero=false;}
    else if(!leftHero){plate.render(2,0,0,dt,reduced.matches,coarse.matches,false);leftHero=true;}
    const virtual=scroll-wearStart+.64,inWear=scroll>wearStart-.28&&scroll<wearEnd+.12;
    const detailOpacity=range(scroll,wearStart-.18,wearStart+.08)*(1-range(scroll,wearEnd-.5,wearEnd));
    details.style.visibility=detailOpacity>.001?'visible':'hidden';details.style.opacity=String(detailOpacity);details.inert=detailOpacity<.9;
    detailText.render(virtual,reduced.matches);
    gallery.render(scroll,reduced.matches);
    const heroWorld=(1-range(scroll,.65,1.05)),wearWorld=inWear?detailOpacity:0;
    const worldOpacity=Math.max(heroWorld,wearWorld)*(1-gallery.cover);
    worldRoot.style.opacity=String(worldOpacity);worldRoot.style.visibility=worldOpacity>.001?'visible':'hidden';
    $('.hero-vignette').style.opacity=String(1-range(scroll,0,.8));
    const sceneScroll=inWear?virtual:Math.min(scroll,1);
    const canvasOpacity=worldReady?(inWear?1:range(scroll,.08,.32)):0;
    if(world)world.renderer.domElement.style.opacity=String(canvasOpacity);
    const renderWorld=worldOpacity>.001&&(inWear||(scroll>.08&&inHero));
    if((scroll>.02&&inHero)||Math.abs(wearStart-scroll)<2.5)void loadWorld();
    if(!renderWorld)lastRender=-100;
    if(world&&worldReady&&!worldFailed&&renderWorld&&(Math.abs(sceneScroll-lastRender)>.00005||Math.abs(targetX-mouseX)>.0001||Math.abs(targetY-mouseY)>.0001)){
      world.render(sceneScroll,reduced.matches?0:mouseX,reduced.matches?0:mouseY,reduced.matches);lastRender=sceneScroll;
    }
    steps.forEach((button,i)=>button.toggleAttribute('aria-current',i===(virtual<1.78?0:virtual<2.88?1:2)));
    logo.style.transform='scale('+(1-.48*ease.cubicInOut(range(scroll,.02,.8)))+')';
    const backdrop=themeRanges.find(item=>scrollY+60>=item.top&&scrollY+60<item.bottom);
    const tone=gallery.cover>.5?'dark':inWear?'light':backdrop?.tone||'dark';
    document.documentElement.dataset.headerTone=tone;
    header.classList.toggle('is-scrolled',actual>.8);
    type.render(scroll*height,height,reduced.matches);
    $('.opening-progress span').style.transform='scaleY('+clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-height))+')';
    raf=requestAnimationFrame(update);
  }
  function suspend(){visible=false;cancelAnimationFrame(raf);gallery.suspend();clips.forEach(clip=>clip.media.setPlaying(false));}
  function resume(){if(visible)return;visible=true;gallery.resume();clips.forEach(updateClip);previous=performance.now();lastRender=-100;raf=requestAnimationFrame(update);}
  document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume(),{signal});
  addEventListener('pagehide',suspend,{signal});addEventListener('pageshow',event=>{if(event.persisted)resume();},{signal});
  resize();void document.fonts.ready.then(resize);
  const prepareTimer=window.setTimeout(()=>{if(!document.hidden)void loadWorld();},200);
  raf=requestAnimationFrame(update);
  return ()=>{clearTimeout(prepareTimer);suspend();listenerAbort.abort();observer.disconnect();gallery.dispose();type.dispose();app.dispose();clips.forEach(c=>c.media.dispose());};
}
