import {getAppArtworkState,renderAppScreenSvg} from './AppArtwork';
import type {AppSceneState} from './AppMotion';

/** Native vector display. Scroll only touches cached attributes, never pixels. */
export class AppScreen {
  readonly element=document.createElement('div');
  readonly width=1440;readonly height=3105;
  private key='';private day:SVGGElement;private week:SVGGElement;private dayClip:SVGRectElement;private weekClip:SVGRectElement;private selection:SVGRectElement;private cursor:SVGGElement;private time:SVGTextElement;private heading:SVGTextElement;private chrome:SVGElement[];
  constructor(){
    this.element.className='app-vector-screen';
    Object.assign(this.element.style,{width:this.width+'px',height:this.height+'px',overflow:'hidden',borderRadius:'162px',backfaceVisibility:'hidden',pointerEvents:'none'});
    this.element.innerHTML=renderAppScreenSvg();
    const svg=this.element.querySelector('svg')!;svg.setAttribute('aria-hidden','true');svg.style.width='100%';svg.style.height='100%';svg.style.display='block';
    const find=<T extends SVGElement>(name:string)=>this.element.querySelector<T>(`[data-art-${name}]`)!;
    this.day=find('day');this.week=find('week');this.dayClip=find('day-clip');this.weekClip=find('week-clip');this.selection=find('selection');this.cursor=find('cursor');this.time=find('time');this.heading=find('heading');this.chrome=[...this.element.querySelectorAll<SVGElement>('[data-art-chrome]')];
  }
  update(scene:AppSceneState){
    const s=getAppArtworkState(scene.day,scene.graph,scene.compare,scene.zoom),key=JSON.stringify(s);if(key===this.key)return;this.key=key;
    this.dayClip.setAttribute('width',String(s.dayWidth));this.weekClip.setAttribute('width',String(s.weekWidth));this.selection.setAttribute('x',String(s.selectionX));this.cursor.setAttribute('transform',`translate(${s.cursorX} 0)`);this.time.textContent=s.time;
    this.day.setAttribute('opacity',String(s.dayOpacity));this.week.setAttribute('opacity',String(s.weekOpacity));this.chrome.forEach(node=>node.setAttribute('opacity',String(s.chromeOpacity)));
    this.heading.textContent=s.weekOpacity>.5?'История движения':'Ритм дня';
  }
  dispose(){this.element.remove();}
}
