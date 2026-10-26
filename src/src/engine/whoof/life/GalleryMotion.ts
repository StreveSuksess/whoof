import { ease } from '../../core/ease';
import { fit } from '../../core/math';
import { lifeScenes } from './LifeScenes';

export const cardStops = lifeScenes.map((_,i)=>1.9+i);
const clamp = (n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

/** WearableSection's held gallery index + sine ease, adapted to the authored scene count. */
export function getGalleryState(local:number, reduced=false, exit=false) {
  if (!Number.isFinite(local)) local=-2;
  const raw=clamp(local-cardStops[0],0,cardStops.length-1);
  const base=Math.floor(raw), part=raw-base;
  const continuous=base+fit(part,.35,.8,0,1,ease.sineInOut);
  const index=reduced?Math.round(continuous):continuous;
  const end=cardStops[cardStops.length-1];
  const cover=fit(local,-.75,-.08,0,1,ease.cubicInOut)*(exit?fit(local,end+.6,end+1.5,1,0,ease.cubicInOut):1);
  return {
    index, cover, active:Math.round(index), visible:local>-.8&&(!exit||local<end+1.5),
    // Source WearableText: right-to-centre travel, bloom pulse, then rect shrink.
    titleSlide:reduced?1:fit(local,-.28,.72,0,1,ease.cubicOut),
    titleShrink:reduced?1:fit(local,1.0,1.82,0,1,ease.cubicInOut),
    pulse:reduced?0:fit(local,.25,.92,0,1),
    glow:reduced?0:fit(local,-.1,.2,0,1)*(1-fit(local,1.08,1.82,0,1)),
    galleryReveal:reduced?1:fit(local,1.05,1.86,0,1,ease.cubicInOut),
  };
}
