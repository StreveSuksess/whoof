import {ease} from '../../../core/ease';
import {fit} from '../../../core/math';
import {howScenes} from './HowScenes';
export const HOW_SCROLL_UNITS=6.15;
export const howStops=howScenes.map((_,i)=>.95+i*1.2);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
/** Reversible held frames with a deliberate transport between each explanation. */
export function getHowState(t:number){
  if(!Number.isFinite(t))t=-2;
  const raw=Math.max(0,Math.min(howStops.length-1,(t-howStops[0])/1.2));
  const base=Math.floor(raw),part=raw-base;
  const index=base+fit(part,.4,.9,0,1,ease.sineInOut);
  return {index,active:Math.round(index),
    titleSlide:fit(t,-.55,.3,0,1,ease.cubicOut),
    titleShrink:fit(t,.23,.94,0,1,ease.cubicInOut),
    reveal:fit(t,.3,.95,0,1,ease.cubicInOut),
    glow:fit(t,-.4,-.05,0,1)*(1-fit(t,.25,.9,0,1)),
    pulse:clamp((t+.3)/.85),
  };
}
