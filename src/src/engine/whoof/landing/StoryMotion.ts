import {collarLift} from '../OpeningTransition';
const range=(n:number,a:number,b:number)=>Math.max(0,Math.min(1,(n-a)/(b-a)));

/** Section starts one viewport after the table. All values are reversible. */
export function getStoryState(scroll:number){
  return {
    lift:collarLift(scroll),
    atmosphere:range(scroll,.32,.82),
    exit:Math.max(0,scroll-1),
    // This intro directly follows the table; its title waits for HeroCard's .61 exit.
    title:range(scroll,.58,.92),
    description:range(scroll,.5,1),
  };
}

/** Reserve the source's right copy column when a wide collar meets a tall screen. */
export function getStoryFraming(width:number,height:number){
  const diameter=Math.min(width*.82,height*.44);
  const stacked=width/height<=.8||width<=600;
  const centerX=stacked?width*.5:Math.min(width*.5,width*.687-diameter*.5-18);
  return {diameter,centerX};
}
