export type LoadingTask='fonts'|'hero'|'world'|'app';
const weights={fonts:.1,hero:.25,world:.5,app:.15};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Preparation milestones, not a simulated byte-download percentage. */
export class LoadingGate{
  private tasks:Record<LoadingTask,number>={fonts:0,hero:0,world:0,app:0};
  private exit?:number;private skipped=false;
  private phase:'loading'|'revealing'|'done'='loading';
  private reason:'ready'|'skip'|'timeout'='ready';
  constructor(private started:number){}
  set(task:LoadingTask,value:number){if(Number.isFinite(value))this.tasks[task]=Math.max(this.tasks[task],clamp(value));}
  get progress(){return Math.min(1,Object.entries(this.tasks).reduce((sum,[key,value])=>sum+value*weights[key as LoadingTask],0));}
  skip(){this.skipped=true;}
  tick(now:number,reduced=false){
    const ready=Object.values(this.tasks).every(n=>n===1);
    if(this.phase==='loading'&&(this.skipped||now-this.started>=8||ready&&(reduced||now-this.started>=.45))){
      this.reason=this.skipped?'skip':ready?'ready':'timeout';this.exit=now;this.phase='revealing';
    }
    const reveal=this.exit===undefined?0:reduced?1:clamp((now-this.exit)/.65);
    if(reveal===1)this.phase='done';
    return {phase:this.phase,reason:this.reason,progress:this.progress,reveal};
  }
}
