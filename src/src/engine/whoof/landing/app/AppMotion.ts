import {ease} from '../../../core/ease';
import {getAppObjectPose} from './AppPose';
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
  const portrait=width/height<1.15;
  const poses=getAppObjectPose(reduced?2.05:t,mobile,portrait,mobile?.5:portrait?.56:.62,mobile?.65:.75);
  const [x,y,size,pitch,yaw,bank]=poses.phone,[cx,cy,cs,cp,cr,cb,spin]=poses.collar;
  const phoneX=width*x,phoneY=height*y;
  const normalHeight=Math.min(height*(mobile?.56:.76),width*1.55),collarBase=Math.min(width*(mobile?.46:.43),height*.50);
  const phoneHeight=Math.min(normalHeight*size,mobile?mix(normalHeight*1.1,width*.91,handoff):width*1.05);
  const collarDiameter=collarBase*Math.min(cs,mobile?1:1.12),collarVisible=reduced?0:range(t,4.7,4.9);
  const captionWeights=[1-range(t,2.2,2.45),range(t,2.2,2.45)*(1-range(t,3.5,3.75)),range(t,3.5,3.75)*(1-range(t,4.7,4.95)),range(t,5.35,5.65)*(1-range(t,6.0,6.35))];
  const nextTitle=range(t,6.35,6.75)*(1-range(t,APP_SCROLL_UNITS+.25,APP_SCROLL_UNITS+.6));
  return {t,day,zoom,compare,graph,context,handoff,opacity,nextTitle,paper:0,phoneX,phoneY,phoneHeight,macroDiameter:Math.min(width*(mobile?.92:.72),height*.94),rotateX:pitch*(mobile?.8:1),rotateY:yaw*(mobile?.75:1),rotateZ:bank*(mobile?.5:1),collarX:cx*width,collarY:cy*height,collarDiameter,collarPitch:cp,collarYaw:cr,collarBank:cb,collarSpin:spin,collarVisible,captionWeights};
}
export type AppSceneState=ReturnType<typeof getAppSceneState>;
