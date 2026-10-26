import {ease} from '../core/ease';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

/** Shared pose/plate timing keeps the baked ground contact tied to the lift. */
export const collarLift=(scroll:number)=>ease.cubicInOut(clamp((scroll-.32)/.54));
export function collarContact(scroll:number){
  const release=clamp(collarLift(scroll)/.06);
  return 1-release*release*(3-2*release);
}
export const liveCollarVisible=(scroll:number,cover:number)=>scroll>.08&&cover<1;
