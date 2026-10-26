import { ScrollPane } from '../core/ScrollPane';
import { input } from '../core/input';
import { properties } from '../core/properties';
import { letterFlippers } from '../LetterFlippers';
import { Studio, type StudioState } from './Studio';

const clamp=(value:number)=>Math.max(0,Math.min(1,value));
const $=<T extends Element=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;

export async function bootWhoof() {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const touch=matchMedia('(pointer: coarse)');
  const root=document.documentElement;
  root.classList.remove('no-js');
  root.classList.toggle('js-motion',!motion.matches);
  const scroll=new ScrollPane();
  input.init();scroll.init({contentDom:$('#site-content'),isActive:!motion.matches&&!touch.matches});
  let studio:Studio|null=null;
  let frame=0,previous=performance.now(),rotation=0,explode=false,closed=false;
  const canvas=$<HTMLCanvasElement>('#whoof-canvas');
  const header=$('.whoof-header');
  const chapters=[...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const dialog=$<HTMLDialogElement>('#whoof-film');
  const film=$<HTMLVideoElement>('#whoof-film video');
  const dayVideo=$<HTMLVideoElement>('.day-image video');
  const menu=$<HTMLElement>('#mobile-menu');
  const menuToggle=$<HTMLButtonElement>('.menu-toggle');
  const resize=()=>{
    properties.viewportWidth=properties.width=innerWidth;
    properties.viewportHeight=properties.height=innerHeight;
    properties.isMobile=touch.matches;properties.useMobileLayout=innerWidth<768;
    scroll.resize(innerWidth,innerHeight);studio?.resize();
  };
  resize();addEventListener('resize',resize,{passive:true});
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in-view','is-visible');reveal.unobserve(entry.target);}
  }),{threshold:.12});
  document.querySelectorAll('.reveal,.rhythm,.baseline').forEach(el=>reveal.observe(el));
  const videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting&&!motion.matches&&!document.hidden){
      if(!dayVideo.getAttribute('src'))dayVideo.src=dayVideo.dataset.src!;
      dayVideo.play().catch(()=>{});
    }else dayVideo.pause();
  }),{threshold:.08});
  videoObserver.observe($('#day'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)dayVideo.pause();else if($('#day').getBoundingClientRect().bottom>0&&$('#day').getBoundingClientRect().top<innerHeight&&!motion.matches)dayVideo.play().catch(()=>{});});
  const closeMenu=()=>{menu.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Открыть меню');};
  menuToggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuToggle.setAttribute('aria-expanded',String(!menu.hidden));menuToggle.setAttribute('aria-label',menu.hidden?'Открыть меню':'Закрыть меню');});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href')!);if(!target)return;
    event.preventDefault();closeMenu();
    scroll.scrollTo(target,-.085,motion.matches||touch.matches);
    history.replaceState(null,'',link.getAttribute('href'));
  }));
  const closeFilm=()=>dialog.close();
  $('.film-trigger').addEventListener('click',()=>{
    if(!film.getAttribute('src'))film.src='/whoof/product-film.mp4';
    dialog.showModal();scroll.isActive=false;document.body.style.overflow='hidden';film.play().catch(()=>{});
  });
  $('#whoof-film-close').addEventListener('click',closeFilm);
  dialog.addEventListener('click',e=>{if(e.target===dialog)closeFilm();});
  dialog.addEventListener('close',()=>{film.pause();document.body.style.overflow='';scroll.isActive=!motion.matches&&!touch.matches;});
  $('#rotate-collar').addEventListener('click',()=>rotation+=Math.PI*.5);
  $('#explode-collar').addEventListener('click',()=>{
    explode=!explode;$('#explode-collar').setAttribute('aria-pressed',String(explode));
    $('#explode-collar span').textContent=explode?'Собрать':'Крепление';
  });
  document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>requestAnimationFrame(resize)));
  const periods={
    morning:{time:'08:00 — 12:00',title:'Время исследовать.',copy:'Прогулка, игра и паузы между ними.',axis:['08:00','10:00','12:00'],phase:0,gain:1},
    afternoon:{time:'12:00 — 18:00',title:'Можно никуда не спешить.',copy:'Тихие часы, отдых и короткие всплески активности.',axis:['12:00','15:00','18:00'],phase:2.3,gain:.42},
    evening:{time:'18:00 — 22:00',title:'Ещё немного вместе.',copy:'Вечерняя прогулка и спокойное завершение дня.',axis:['18:00','20:00','22:00'],phase:4.1,gain:.75}
  };
  const tabs=[...document.querySelectorAll<HTMLButtonElement>('[data-period]')];
  const selectPeriod=(tab:HTMLButtonElement)=>{
    const data=periods[tab.dataset.period as keyof typeof periods];
    tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});
    $('#period-time').textContent=data.time;$('#period-title').textContent=data.title;$('#period-copy').textContent=data.copy;
    document.querySelectorAll('.chart-axis span').forEach((el,i)=>el.textContent=data.axis[i]);
    document.querySelectorAll<SVGRectElement>('.activity-bar').forEach((bar,i)=>{
      const h=Math.max(6,12+Math.pow(Math.max(0,Math.sin(i*.24-1.2+data.phase)),2)*52*data.gain+Math.sin(i*1.83)*7)*1.35;
      bar.setAttribute('height',String(h));bar.setAttribute('y',String(140-h));
    });
    $('.chart-line').setAttribute('d',Array.from({length:73},(_,i)=>`${i?'L':'M'}${i*10} ${120-(Math.sin(i*.11+data.phase)+1)*35*data.gain}`).join(' '));
  };
  tabs.forEach((tab,i)=>{
    tab.tabIndex=i? -1:0;tab.addEventListener('click',()=>selectPeriod(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[next].focus();selectPeriod(tabs[next]);
    });
  });
  if(!motion.matches)document.querySelectorAll<HTMLElement>('.flipper').forEach(el=>letterFlippers.add(el));
  const chapterNumbers:Record<string,string>={hero:'01',bridge:'01',day:'02',rhythm:'03',baseline:'04',details:'05',order:'06',faq:'07'};
  const bridgePhoto=$<HTMLElement>('.bridge-photo'),bridgeWords=$<HTMLElement>('.bridge-words');
  const state:StudioState={chapter:'hero',progress:0,pointerX:0,pointerY:0,reducedMotion:motion.matches,time:0,explode:false,rotation:0};
  const tick=(now:number)=>{
    if(closed)return;
    const dt=Math.min(.05,Math.max(.001,(now-previous)/1000));previous=now;
    properties.time+=dt;properties.deltaTime=dt;properties.tick++;
    input.update(dt);
    if(scroll.isActive)scroll.update(dt);
    else {scroll.scrollPixel=window.scrollY;scroll.targetScrollPixel=window.scrollY;}
    // Pick the scene reaching the upper third of the viewport. The shared model
    // keeps its transform between chapters, so changes are continuous.
    let current=chapters[0];
    for(const chapter of chapters){if(scroll.getDomRange(chapter).top<=scroll.scrollPixel+innerHeight*.24)current=chapter;else break;}
    const range=scroll.getDomRange(current);
    state.chapter=current.dataset.chapter!;
    state.progress=clamp((scroll.scrollPixel-range.top)/Math.max(1,range.height-innerHeight));
    state.pointerX=input.mouseXY.x;state.pointerY=input.mouseXY.y;state.reducedMotion=motion.matches;state.time=properties.time;state.explode=explode;state.rotation=rotation;
    studio?.update(state,dt);
    $('#collar-fallback').toggleAttribute('hidden',!root.classList.contains('no-webgl')||!['hero','bridge','details','order'].includes(state.chapter));
    header.classList.toggle('scrolled',scroll.scrollPixel>70);header.classList.toggle('on-dark',state.chapter==='day'&&menu.hidden);
    $('#chapter-number').textContent=chapterNumbers[state.chapter];
    $<HTMLElement>('.chapter-indicator b').style.height=`${clamp(scroll.scrollPixel/Math.max(1,scroll.contentSizePixel-innerHeight))*100}%`;
    const bridge=scroll.getDomRange($('#bridge'));
    const b=clamp((scroll.scrollPixel-bridge.top)/Math.max(1,bridge.height-innerHeight));
    const expansion=clamp((b-.32)/.6);
    bridgePhoto.style.opacity=String(clamp((b-.25)/.28));
    bridgePhoto.style.clipPath=`inset(${18*(1-expansion)}% ${38*(1-expansion)}% round ${220*(1-expansion)}px)`;
    bridgeWords.style.opacity=String(1-clamp((b-.22)/.4));
    const day=scroll.getDomRange($('#day')),dayProgress=clamp((scroll.scrollPixel-day.top)/Math.max(1,day.height-innerHeight));
    $<HTMLElement>('.day-timeline i').style.width=`${dayProgress*100}%`;
    document.querySelectorAll('.day-timeline span').forEach((el,i)=>el.classList.toggle('active',i===Math.min(2,Math.floor(dayProgress*3))));
    if(!motion.matches)letterFlippers.update(dt);
    input.postUpdate();frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  // Content stays usable even when a slow GPU or an unavailable model prevents 3D.
  const loaded=()=>$('#whoof-loader').classList.add('loaded');
  const loaderTimeout=setTimeout(loaded,3500);
  try{studio=new Studio(canvas);await studio.init();}
  catch(error){console.warn('Whoof: displaying product photograph because 3D is unavailable.',error);studio?.dispose();studio=null;root.classList.add('no-webgl');canvas.hidden=true;$('#collar-fallback').removeAttribute('hidden');}
  finally{clearTimeout(loaderTimeout);loaded();}
  properties.hasInitialized=properties.hasStarted=true;
  document.fonts.ready.then(resize);
  if(location.hash){const target=document.getElementById(location.hash.slice(1));if(target)scroll.scrollTo(target,-.085,true);}
  addEventListener('pagehide',()=>{closed=true;cancelAnimationFrame(frame);reveal.disconnect();videoObserver.disconnect();studio?.dispose();},{once:true});
}
