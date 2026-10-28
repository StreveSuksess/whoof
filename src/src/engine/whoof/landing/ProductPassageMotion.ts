const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const passageEase=(v:number)=>{const t=clamp(v);return t*t*t*(t*(t*6-15)+10);};
/** One reversible material/camera bridge around the actual Trust/Offer join. */
export function getProductPassageState(local:number,height:number,actualLocal=local){
  const t=local/height,actual=actualLocal/height;
  return {blend:passageEase((t+.45)/.9),ui:Math.min(passageEase((t-.05)/.25),passageEase((actual-.05)/.25)),trustCopy:1-passageEase((actual+.9)/.35)};
}
export function getProductPassageClip(top:number,end:number,scroll:number,height:number){
  return {top:Math.max(0,Math.min(height,top-scroll)),bottom:Math.max(0,Math.min(height,scroll+height-end))};
}
