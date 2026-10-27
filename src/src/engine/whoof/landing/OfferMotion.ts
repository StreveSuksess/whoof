import {ease} from '../../core/ease';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function getOfferState(local:number,height:number,mobile=false,reduced=false){
  const progress=clamp(local/height),travel=reduced?1:ease.cubicInOut(progress);
  return {progress,yaw:.16+.16*(reduced?1:progress),pickerY:height*(mobile?.23:.34-.11*travel),modelY:height*(mobile?.54-.025*travel:.73-.11*travel),show:clamp((local/height+.8)/.8)};
}
export function getSketchProximity(distance:number){return clamp((1.3-distance));}
export function nextOfferTab(current:number,key:string,count=2){
  if(key==='Home')return 0;if(key==='End')return count-1;
  return key==='ArrowRight'?(current+1)%count:key==='ArrowLeft'?(current+count-1)%count:current;
}
