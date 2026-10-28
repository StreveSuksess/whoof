import {ease} from '../../../core/ease';
import {sampleAppTrack} from '../app/AppPose';
export const TRUST_SCROLL_UNITS=4.4;
const range=(v:number,a:number,b:number)=>Math.max(0,Math.min(1,(v-a)/(b-a)));
/** Use actual document bounds for the shared fixed host, independent of easing. */
export function getTrustClip(top:number,size:number,scroll:number,height:number){
  return {top:Math.max(0,Math.min(height,top-scroll)),bottom:Math.max(0,Math.min(height,scroll-top-size))};
}
/** Native sticky text leaves upward while the fixed header keeps its clear lane. */
export function getTrustTextClip(local:number,height:number,nav:number){
  const stageTop=local<0?-local:Math.min(0,(TRUST_SCROLL_UNITS-1)*height-local);
  return Math.max(0,Math.min(height,nav-stageTop));
}
/** Continuous product travel. Source Wearing motion is evaluated underneath the final blend. */
export function getTrustState(local:number,height:number,width:number){
  const t=Number.isFinite(local)?local/height:-2,mobile=width<=600,stacked=width/height<=1.2;
  const a=stacked?.5:.68,b=stacked?.5:.29,c=stacked?.5:.70;
  const y=stacked?(mobile?.38:.40):.55;
  const pose=sampleAppTrack(t,[
    [-.6,a,y+.06,.86,-.40,-.28,-.17,-.35],
    [.35,a,y,1.06,-.24,.02,-.10,0],
    [1.20,a,y,.96,.12,.32,.14,.45],
    [1.80,b,y,.83,-.36,.58,-.20,1.05],
    [2.75,b,y,.82,.16,.93,.15,1.65],
    [3.30,c,y,.88,-.23,1.20,-.16,2.15],
    [4.40,c,y,.90,.10,1.40,.18,2.75],
  ]);
  const [x,cy,size,pitch,yaw,bank,spin]=pose;
  const base=stacked?Math.min(width*.88,height*(mobile?.37:.54)):Math.min(width*.50,height*.78);
  const weight=(a:number,b:number,c:number,d:number)=>ease.cubicOut(range(t,a,b))*(1-ease.cubicInOut(range(t,c,d)));
  return {t,x:x*width,y:cy*height,diameter:base*size,pitch,yaw,bank,spin,
    wearBlend:(u=>u*u*u*(u*(u*6-15)+10))(range(t,3.30,TRUST_SCROLL_UNITS)),
    episodes:[weight(-.1,.32,1.05,1.35),weight(1.4,1.68,2.65,2.9),weight(2.95,3.22,4.0,4.35)],
    protocol:range(t,1.55,2.55),
  };
}
export type TrustSceneState=ReturnType<typeof getTrustState>;
