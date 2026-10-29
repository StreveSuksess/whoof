/** Touch momentum already supplies its own easing; a second lag loses the scene. */
export function advanceSceneScroll(current:number,actual:number,dt:number,native:boolean){
  actual=Math.max(0,actual);
  if(native||Math.abs(actual-current)>.75)return actual;
  const next=current+(actual-current)*(1-Math.exp(-9*Math.max(0,Math.min(.05,dt))));
  return Math.abs(actual-next)<.0003?actual:next;
}
