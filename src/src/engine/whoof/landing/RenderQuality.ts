export type QualityLevel=0|1|2;
export function getRenderBudget(width:number,height:number,dpr:number,level:QualityLevel){
  const mobile=width<=600,maxPixels=[2100000,4200000,8300000][level];
  const cap=mobile?[1,1.25,1.5][level]:[.85,1.25,1.8][level];
  return {ratio:Math.min(dpr,cap,Math.sqrt(maxPixels/Math.max(1,width*height))),maxPixels,bloomLimit:[1024,1280,1600][level],endingLimit:(mobile?[640,800,920]:[800,1024,1280])[level]};
}
/** Active frame-time feedback; slow degradation, much slower recovery. */
export class RenderQuality{
  level:QualityLevel=2;
  private ema=16.67;private slow=0;private fast=0;private active=false;
  sample(ms:number,rendering:boolean){
    if(!rendering||!Number.isFinite(ms)||ms>250||ms<2){this.active=false;this.slow=this.fast=0;return false;}
    if(!this.active){this.active=true;return false;}
    this.ema+=(ms-this.ema)*.08;
    const seconds=Math.min(ms,50)/1000;
    this.slow=this.ema>23?this.slow+seconds:Math.max(0,this.slow-seconds*2);
    this.fast=this.ema<18?this.fast+seconds:0;
    if(this.slow>2&&this.level>0){this.level=(this.level-1) as QualityLevel;this.slow=this.fast=0;return true;}
    if(this.fast>7&&this.level<2){this.level=(this.level+1) as QualityLevel;this.slow=this.fast=0;return true;}
    return false;
  }
  reset(){this.active=false;this.slow=this.fast=0;}
}
