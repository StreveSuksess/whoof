import {ease} from '../../core/ease';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function getOfferState(local:number,height:number,mobile=false,reduced=false){
  const progress=clamp(local/height),travel=reduced?1:ease.cubicInOut(progress);
  return {progress,yaw:.16+.16*(reduced?1:progress),pickerY:height*(mobile?.23:.34-.11*travel),modelY:height*(mobile?.54-.025*travel:.73-.11*travel),show:clamp((local/height+.8)/.8)};
}
export function getSketchProximity(distance:number){return clamp((1.3-distance));}
/** StackScene/PostProfile and the non-convolution Bloom path, unchanged. */
export const OFFER_SOURCE_FX=Object.freeze({iterations:5,amount:6,radius:.25,threshold:.3,smoothWidth:.75,lumaStrength:0,selectiveStrength:4,saturation:2});
export function getOfferBloomWeights(){return Array.from({length:5},(_,i)=>{const falloff=(5-i)/5;return (6*(falloff+(1.2-falloff*2)*.25))/Math.pow(2,4-i);});}
export function getOfferBloomLayout(width:number,height:number,limit=1600){
  const scale=Math.min(1,limit/Math.max(1,width),limit/Math.max(1,height));
  const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
  let x=Math.ceil(w/2),y=Math.ceil(h/2);
  const levels=Array.from({length:5},()=>{const size={width:x,height:y};x=Math.ceil(x/2);y=Math.ceil(y/2);return size;});
  return {width:w,height:h,levels};
}
export function getOfferBrushRadius(rawDistance:number,viewportHeight:number,paintHeight:number,quiet=false){return quiet?0:Math.max(0,Math.min(100,rawDistance))*paintHeight/viewportHeight;}
export function getOfferSketchBreathing(time:number,order:number,quiet=false){return quiet?{rotation:0,scale:1}:{rotation:Math.sin(time*.3+order*Math.PI*2)*.1,scale:1+Math.sin(time*.4+order*Math.PI*2)*.1};}
export function nextOfferTab(current:number,key:string,count=2){
  if(key==='Home')return 0;if(key==='End')return count-1;
  return key==='ArrowRight'?(current+1)%count:key==='ArrowLeft'?(current+count-1)%count:current;
}
