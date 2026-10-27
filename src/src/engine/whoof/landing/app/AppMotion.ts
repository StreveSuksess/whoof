import {ease} from '../../../core/ease';
export const APP_SCROLL_UNITS=7;
export const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const range=(n:number,a:number,b:number)=>clamp((n-a)/(b-a));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
/** One deterministic camera/screen timeline; no elapsed-time dependent poses. */
export function getAppSceneState(local:number,height:number,width:number,reduced=false){
  const t=local/height,mobile=width<=600;
  const day=reduced?1:range(t,.05,1.05),zoom=reduced?1:ease.cubicInOut(range(t,.85,2.1));
  const compare=reduced?0:ease.cubicInOut(range(t,2.4,2.95)),graph=reduced?1:range(t,2.55,3.2);
  const context=reduced?0:ease.cubicInOut(range(t,3.7,4.05))*(1-ease.cubicInOut(range(t,4.65,4.95)));
  const handoff=reduced?0:ease.cubicInOut(range(t,4.9,5.8));
  const opacity=range(t,-.45,.02)*(1-range(t,APP_SCROLL_UNITS+.35,APP_SCROLL_UNITS+.95));
  const phoneX=mix(mix(width*(mobile?.5:width/height<1.15?.56:.62),width*(mobile?.52:.65),zoom)+width*(mobile?.16:.035)*context,width*(mobile?.30:.32),handoff);
  const phoneY=mix(mix(height*(mobile?.51:.46),height*(mobile?.61:.54),zoom),height*(mobile?.64:.65),handoff);
  const normalHeight=Math.min(height*(mobile?.56:.76),width*1.55),collarDiameter=Math.min(width*(mobile?.46:.34),height*.48);
  const phoneHeight=mix(normalHeight,Math.min(normalHeight*.84,collarDiameter*1.38),handoff);
  const captionWeights=[1-range(t,2.2,2.45),range(t,2.2,2.45)*(1-range(t,3.5,3.75)),range(t,3.5,3.75)*(1-range(t,4.7,4.95)),range(t,4.7,4.95)*(1-range(t,6.0,6.35))];
  const nextTitle=range(t,6.35,6.75)*(1-range(t,APP_SCROLL_UNITS+.25,APP_SCROLL_UNITS+.6));
  return {t,day,zoom,compare,graph,context,handoff,opacity,nextTitle,paper:1-range(zoom,.18,.78),phoneX,phoneY,phoneHeight,macroDiameter:Math.min(width*(mobile?.70:.66),height*.78),rotateX:zoom*(-.035+compare*.075)+handoff*.04,rotateY:zoom*(-.22+compare*.36)-handoff*.34,rotateZ:zoom*(-.055)+context*.07+handoff*.055,captionWeights};
}
export type AppSceneState=ReturnType<typeof getAppSceneState>;
