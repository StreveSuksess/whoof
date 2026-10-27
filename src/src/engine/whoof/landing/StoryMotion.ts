import {collarLift} from '../OpeningTransition';
import {ease} from '../../core/ease';
const range=(n:number,a:number,b:number)=>Math.max(0,Math.min(1,(n-a)/(b-a)));

/** Section starts one viewport after the table. All values are reversible. */
export function getStoryState(scroll:number,sectionEnd=2){
  return {
    lift:collarLift(scroll),
    atmosphere:range(scroll,.32,.82),
    studio:ease.cubicInOut(range(scroll,.62,1.28)),
    table:ease.cubicInOut(range(scroll,1.25,2)),
    turn:range(scroll,1.7,Math.max(2,sectionEnd-.75)),
    exit:range(scroll,Math.max(1,sectionEnd-.75),sectionEnd),
    // This intro directly follows the table; its title waits for HeroCard's .61 exit.
    title:range(scroll,.58,.92),
    description:range(scroll,.5,1),
  };
}

/** Reserve the source's right copy column when a wide collar meets a tall screen. */
export function getStoryFraming(width:number,height:number,table=0){
  const introDiameter=Math.min(width*.82,height*.44);
  const stacked=width/height<=.8||width<=600;
  const introX=stacked?width*.5:Math.min(width*.5,width*.687-introDiameter*.5-18);
  const diameter=introDiameter+(Math.min(width*.475,height*.68)-introDiameter)*table;
  const centerX=introX+(width*.5-introX)*table;
  return {diameter,centerX};
}

export const STORY_VISIBILITY={character:.56,content:.72,meta:.78,media:.96,scale:.96} as const;
export function getStoryRowState(center:number,reduced=false){
  const show=reduced?1:range(center,.15,.45);
  return {show,meta:STORY_VISIBILITY.meta+(1-STORY_VISIBILITY.meta)*show,
    media:STORY_VISIBILITY.media+(1-STORY_VISIBILITY.media)*show,
    fade:reduced?1:1-(1-STORY_VISIBILITY.content)*range(center,.55,.85),
    scale:STORY_VISIBILITY.scale+(1-STORY_VISIBILITY.scale)*show};
}
