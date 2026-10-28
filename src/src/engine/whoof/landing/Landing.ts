import {ease} from '../../core/ease';
import {OpeningScene} from '../OpeningScene';
import {HeroPlate} from '../HeroPlate';
import {HeroCard} from '../HeroCard';
import {GalleryVideo} from '../life/GalleryVideo';
import {SectionMotion} from './SectionMotion';
import {AppExample} from './AppExample';
import {HowStory} from './how/HowStory';
import {TrustStage} from './trust/TrustStage';
import {StoryText} from './StoryText';
import {getStoryState} from './StoryMotion';
import {StoryRows} from './StoryRows';
import {OwnerPosters} from './OwnerPosters';
import {getOwnerEntryState} from './OwnerPosterMotion';
import {OfferStage} from './OfferStage';
import {HeaderMotion,crossesHeader} from './HeaderMotion';
import {Accordions} from './Accordions';
import {KibbleStage} from './ending/KibbleStage';
import {ProductPassageStage} from './ProductPassageStage';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const range=(n:number,a:number,b:number)=>clamp((n-a)/(b-a));
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;

export function bootLanding(){
  document.documentElement.classList.remove('no-js');
  document.body.classList.add('is-ready');
  const root=$('.landing-v27'),worldRoot=$('.opening-world'),header=$('.opening-header'),logo=$('.opening-logo');
  const headerMotion=new HeaderMotion();
  const plate=new HeroPlate(),card=new HeroCard(),type=new SectionMotion(root);
  const storyText=new StoryText(),storyRows=new StoryRows(),atmosphere=$('.situations-atmosphere');
  const owners=new OwnerPosters($('#owners'));
  const offer=new OfferStage($('#order'));
  const app=new AppExample($('#app'));
  const how=new HowStory($('#how-steps'));
  const trust=new TrustStage($('#trust'));
  const ending=new KibbleStage($('#finish'));
  const passage=new ProductPassageStage(root);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
  const accordions=new Accordions(root,()=>reduced.matches);
  const sections=[...document.querySelectorAll<HTMLElement>('#landing-content > section'),$('#finish')];
  const headerObstacles=sections.map(section=>[...section.querySelectorAll<HTMLElement>('h2:not(.sr-only),h3,h4,p,figure,button,summary,a,.section-kicker,.story-table-header')]);
  const clips=[...root.querySelectorAll<HTMLVideoElement>('[data-inline-video]')].map(element=>({media:new GalleryVideo(element),onscreen:false}));
  const themeRanges:{top:number;bottom:number;tone:string}[]=[];
  let world:OpeningScene|undefined,worldRequested=false,worldFailed=false,worldReady=false,lastRender=-100,raf=0;
  let height=innerHeight,width=innerWidth,storyEnd=2,scroll=scrollY/innerHeight;
  let targetX=0,targetY=0,mouseX=0,mouseY=0,moved=false,visible=!document.hidden,previous=performance.now(),started=performance.now(),leftHero=false;
  let initialHashPending=true;
  let headerTop=28;
  let headerCheckScroll=-1,headerCheckActual=-1,headerBlocked=false;
  const listenerAbort=new AbortController(),signal=listenerAbort.signal;
  function measure(){
    height=innerHeight;width=innerWidth;
    headerTop=parseFloat(getComputedStyle(header).top)||0;
    headerCheckActual=-1;
    ending.measure();
    passage.measure();
    storyEnd=($('#owners').getBoundingClientRect().top+scrollY)/height;
    themeRanges.length=0;
    sections.forEach(section=>{const rect=section.getBoundingClientRect();themeRanges.push({top:rect.top+scrollY,bottom:rect.bottom+scrollY,tone:section.dataset.tone||'light'});});
  }
  function anchorTop(hash:string){
    let target:HTMLElement|null;try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return;}
    if(!target)return;
    let top=target.getBoundingClientRect().top+scrollY;
    if(hash==='#trust')top+=.34*height;
    else if(hash==='#order'&&!reduced.matches&&!trust.static)top+=.5*height;
    else if(hash!=='#intro'&&hash!=='#situations'&&hash!=='#owners'&&hash!=='#app'&&hash!=='#order')top-=70;
    return top;
  }
  async function loadWorld(){
    if(worldRequested)return;worldRequested=true;
    try{
      world=new OpeningScene($('#opening-canvas'));world.resize(width,height);
      await world.load(()=>{});worldReady=true;lastRender=-100;
      world.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();worldFailed=true;document.body.classList.add('no-webgl');},{signal});
    }catch(error){worldFailed=true;document.body.classList.add('no-webgl');console.warn('Whoof 3D unavailable; content and rendered scene remain available.',error);}
  }
  function resize(){height=innerHeight;width=innerWidth;owners.resize();app.resize();how.resize();trust.resize();ending.resize();card.resize();accordions.resize();type.resize();storyText.resize();storyRows.resize();offer.resize();measure();headerMotion.reset(scrollY);world?.resize(width,height);void plate.resize().catch(()=>{});lastRender=-100;}
  const updateClip=(clip:typeof clips[number])=>clip.media.setPlaying(clip.onscreen&&visible&&!reduced.matches);
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{const clip=clips.find(c=>c.media.element===entry.target);if(clip){clip.onscreen=entry.isIntersecting&&entry.intersectionRatio>.15;updateClip(clip);}});
  },{threshold:[0,.15,.5]});
  clips.forEach(clip=>observer.observe(clip.media.element));
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor=>anchor.addEventListener('click',event=>{
    const top=anchorTop(anchor.hash);if(top===undefined)return;
    event.preventDefault();initialHashPending=false;
    const url=new URL(location.href);url.hash=anchor.hash;history.replaceState(null,'',url);
    const direct=reduced.matches||Math.abs(top-scrollY)>height*2.5;
    if(direct)scroll=top/height;
    window.scrollTo({top,behavior:direct?'instant':'smooth'});
  },{signal}));
  addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;moved=true;targetX=event.clientX/width*2-1;targetY=event.clientY/height*2-1;},{passive:true,signal});
  addEventListener('resize',resize,{passive:true,signal});
  for(const name of ['wheel','pointerdown','keydown'])addEventListener(name,()=>{initialHashPending=false;},{once:true,passive:true,signal});
  reduced.addEventListener('change',()=>{clips.forEach(updateClip);resize();lastRender=-100;},{signal});
  function update(now:number){
    if(!visible)return;
    const dt=Math.min(.05,(now-previous)/1000);previous=now;
    if(accordions.update()){type.measure();measure();}
    const actual=scrollY/height;
    scroll+=(actual-scroll)*(reduced.matches?1:1-Math.exp(-9*dt));if(Math.abs(actual-scroll)<.0003)scroll=actual;
    mouseX+=(targetX-mouseX)*(1-Math.exp(-3*dt));mouseY+=(targetY-mouseY)*(1-Math.exp(-3*dt));
    const inHero=scroll<1.05;
    card.render(scroll,(now-started)/1000,true,reduced.matches);
    storyText.render(scroll,reduced.matches);
    storyRows.render(scroll*height,height,reduced.matches);
    owners.render(scroll*height,reduced.matches);
    if((worldFailed||world?.appFailed)&&app.useFallback())resize();
    if((worldFailed||world?.trustFailed)&&trust.useFallback())resize();
    app.render(scroll*height,reduced.matches);
    how.render(scroll*height,reduced.matches);
    trust.render(scroll*height,reduced.matches);
    offer.render(scroll*height,dt,reduced.matches);
    ending.render(scrollY);
    passage.render(scroll*height,reduced.matches||trust.static||worldFailed);
    atmosphere.style.opacity=String(scroll<storyEnd?getStoryState(scroll,storyEnd).atmosphere:0);
    if(inHero){plate.render(worldReady?scroll:Math.min(scroll,.08),targetX,targetY,dt,reduced.matches,coarse.matches,moved);leftHero=false;}
    else if(!leftHero){plate.render(2,0,0,dt,reduced.matches,coarse.matches,false);leftHero=true;}
    const inEnding=ending.active,inPassage=passage.active&&!inEnding,inTrust=trust.active&&!inEnding&&!inPassage,inOffer=offer.active&&!inTrust&&!inEnding&&!inPassage,inApp=app.active&&!inOffer&&!inTrust&&!inEnding&&!inPassage;
    const heroWorld=getOwnerEntryState((scroll-storyEnd)*height,height).worldVisible?1:0;
    const worldOpacity=inTrust||inEnding||inPassage?0:heroWorld;
    worldRoot.style.opacity=String(worldOpacity);worldRoot.style.visibility=worldOpacity>.001?'visible':'hidden';
    $('.hero-vignette').style.opacity=String(1-range(scroll,0,.8));
    const sceneScroll=inPassage?5000+passage.local/height:inEnding?4000+ending.progress:inTrust?3000+trust.state.t:inApp?2000+app.progress:inOffer?1000+offer.progress:scroll;
    const canvasOpacity=worldReady?(inApp||inOffer||inTrust||inEnding||inPassage?1:range(scroll,.08,.32)*(width<=600?1-range(scroll,1.25,1.8):1)):0;
    // Detach the prior host before attaching another one, including far anchors.
    if(!inOffer)offer.setCanvas(undefined);if(!inApp)app.setCanvas(undefined);if(!inTrust)trust.setCanvas(undefined);if(!inEnding)ending.setCanvas(undefined);if(!inPassage)passage.setCanvas(undefined);
    const canvas=world&&worldReady&&!worldFailed?world.renderer.domElement:undefined;
    if(inTrust)trust.setCanvas(canvas);if(inApp)app.setCanvas(canvas,world?.appReady);if(inOffer)offer.setCanvas(canvas,world?.offerReady);
    if(inEnding)ending.setCanvas(canvas,world?.endingReady);
    if(inPassage)passage.setCanvas(canvas);
    if(world)world.renderer.domElement.style.opacity=String(canvasOpacity);
    const renderWorld=inPassage||inEnding&&!!world?.endingReady||inTrust||inApp||inOffer||worldOpacity>.001&&canvasOpacity>.001&&(scroll>.08&&scroll<storyEnd);
    if((scroll>.02&&scroll<storyEnd)||Math.abs(offer.distance)<height*2.5||Math.abs(app.distance)<height*2.5||inApp||Math.abs(trust.distance)<height*2.5||inTrust||Math.abs(ending.distance)<height*2.5)void loadWorld();
    if(worldReady&&!reduced.matches&&(Math.abs(app.distance)<height*2.5||inApp))void world?.prepareApp();
    if(worldReady&&!reduced.matches&&(Math.abs(trust.distance)<height*2.5||inTrust||inPassage))void world?.prepareTrust();
    if(worldReady&&Math.abs(offer.distance)<height*2.5)void world?.prepareOffer();
    if(worldReady&&Math.abs(ending.distance)<height*2.5)void world?.prepareEnding();
    if(!renderWorld)lastRender=-100;
    const needsFrame=inEnding?(!reduced.matches||Math.abs(sceneScroll-lastRender)>.00005||world?.endingNeedsFrame):(Math.abs(sceneScroll-lastRender)>.00005||Math.abs(targetX-mouseX)>.0001||Math.abs(targetY-mouseY)>.0001||inOffer&&world?.offerNeedsFrame||inApp&&world?.appNeedsFrame||inTrust&&world?.trustNeedsFrame||inPassage&&(world?.trustNeedsFrame||passage.blend>0&&world?.offerNeedsFrame));
    if(world&&worldReady&&!worldFailed&&renderWorld&&needsFrame){
      if(inPassage)world.renderProductPassage(trust.state,trust.wearVirtual,passage.local,mouseX,mouseY,dt,reduced.matches,coarse.matches,targetX,targetY,passage.exitOffset);
      else if(inEnding)world.renderEnding(dt,targetX,targetY,ending.progress,reduced.matches,coarse.matches,moved);
      else if(inTrust)world.renderTrust(trust.state,trust.wearVirtual,reduced.matches?0:mouseX,reduced.matches?0:mouseY,reduced.matches);
      else if(inApp)world.renderApp(app.state,reduced.matches?0:mouseX,reduced.matches?0:mouseY);
      else if(inOffer)world.renderOffer(offer.progress,reduced.matches?0:mouseX,reduced.matches?0:mouseY,dt,reduced.matches,coarse.matches,targetX,targetY);
      else world.renderOpening(sceneScroll,reduced.matches?0:mouseX,reduced.matches?0:mouseY,reduced.matches,storyEnd);
      lastRender=sceneScroll;
    }
    logo.style.transform='scale('+(1-.48*ease.cubicInOut(range(scroll,.02,.8)))+')';
    const backdrop=themeRanges.find(item=>scrollY+60>=item.top&&scrollY+60<item.bottom);
    const tone=inPassage?(passage.blend>.45?'dark':'light'):inApp?app.headerTone:scroll>.68&&scroll<storyEnd?'dark':backdrop?.tone||'dark';
    document.documentElement.dataset.headerTone=tone;
    header.classList.toggle('is-scrolled',actual>.8);
    type.render(scroll*height,height,reduced.matches);
    const focused=header.querySelector(':focus-visible')!==null;
    const directionHidden=headerMotion.update(scrollY,height,focused);
    let obstructed=false;
    if(!directionHidden&&!focused&&actual>.8){
      if(headerCheckActual!==scrollY||Math.abs(headerCheckScroll-scroll)>.00001){
        const floor=headerTop+28+20;
        // Only the native section crossing the header can occlude it. Inactive
        // fixed stages in distant sections must never suppress navigation.
        headerBlocked=headerObstacles.some((elements,index)=>{
          const section=themeRanges[index];
          if(!section||section.top>scrollY+floor||section.bottom<scrollY)return false;
          return elements.some(element=>{
            if(!crossesHeader(element.getBoundingClientRect(),floor,width))return false;
            for(let node:HTMLElement|null=element;node&&node!==sections[index];node=node.parentElement){
              const style=getComputedStyle(node);
              if(style.visibility==='hidden'||Number(style.opacity)<.05)return false;
            }
            return true;
          });
        });
        headerCheckActual=scrollY;headerCheckScroll=scroll;
      }
      obstructed=headerBlocked;
    }
    header.classList.toggle('is-hidden',directionHidden||obstructed);
    $('.opening-progress span').style.transform='scaleY('+clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-height))+')';
    raf=requestAnimationFrame(update);
  }
  function suspend(){visible=false;cancelAnimationFrame(raf);accordions.finish();app.suspend();clips.forEach(clip=>clip.media.setPlaying(false));}
  function resume(){if(visible)return;visible=true;app.resume();clips.forEach(updateClip);previous=performance.now();lastRender=-100;raf=requestAnimationFrame(update);}
  document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume(),{signal});
  addEventListener('pagehide',suspend,{signal});addEventListener('pageshow',event=>{if(event.persisted)resume();},{signal});
  resize();void document.fonts.ready.then(resize);
  // Source-style rails set their height in JS. Reconcile bookmarked sections
  // after fonts/load and native scroll restoration; yield to any user navigation.
  const pageLoaded=document.readyState==='complete'?Promise.resolve():new Promise<void>(resolve=>addEventListener('load',()=>resolve(),{once:true,signal}));
  void Promise.all([document.fonts.ready,pageLoaded]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!initialHashPending||!location.hash)return;
    const top=anchorTop(location.hash);if(top===undefined)return;
    scroll=top/height;window.scrollTo({top,behavior:'instant'});initialHashPending=false;
  })));
  const prepareTimer=window.setTimeout(()=>{if(!document.hidden)void loadWorld();},200);
  raf=requestAnimationFrame(update);
  return ()=>{clearTimeout(prepareTimer);suspend();listenerAbort.abort();observer.disconnect();accordions.dispose();type.dispose();storyText.dispose();storyRows.dispose();owners.dispose();offer.dispose();app.dispose();how.dispose();trust.dispose();ending.dispose();passage.dispose();world?.disposeApp();world?.disposeTrust();world?.disposeEnding();clips.forEach(c=>c.media.dispose());};
}
