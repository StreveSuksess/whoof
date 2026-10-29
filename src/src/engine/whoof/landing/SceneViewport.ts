export type SceneSize={width:number;height:number};

/** Browser chrome changes the visible phone window, not the authored document. */
export function resolveSceneSize(previous:SceneSize|undefined,next:SceneSize,mobile:boolean,rotated=false):SceneSize{
  if(previous&&mobile&&!rotated&&Math.abs(next.width-previous.width)<2)return previous;
  return {width:Math.max(1,next.width),height:Math.max(1,next.height)};
}
let size:SceneSize|undefined,orientation:string|undefined;
export const getSceneViewport=():SceneSize=>size||{width:innerWidth,height:innerHeight};
export function updateSceneViewport(){
  const nextOrientation=screen.orientation?.type;
  const next=resolveSceneSize(size,{width:innerWidth,height:innerHeight},innerWidth<=900||matchMedia('(pointer: coarse)').matches,orientation!==undefined&&nextOrientation!==orientation);
  const changed=!size||next.width!==size.width||next.height!==size.height;
  orientation=nextOrientation;size=next;
  if(changed)document.documentElement.style.setProperty('--scene-vh',size.height/100+'px');
  return changed;
}
