/** One mechanical degree of freedom per object; no screen-space follower. */
export type PropKind='keys'|'leash'|'ball';
const settings={keys:{drag:10,maxSpeed:5},leash:{drag:10,maxSpeed:2.8},ball:{drag:4.5,maxSpeed:5}};
export class HeroPropMotion {
  q=0;
  velocity=0;
  constructor(readonly kind:PropKind){}
  get moving(){return Math.abs(this.velocity)>.001;}
  impulse(value:number){
    if(!Number.isFinite(value))return;
    const limit=settings[this.kind].maxSpeed;
    this.velocity=Math.max(-limit,Math.min(limit,this.velocity+value));
  }
  step(dt:number,enabled:boolean){
    if(!enabled){this.q=0;this.velocity=0;return;}
    if(!Number.isFinite(dt)||dt<=0)return;
    const {drag}=settings[this.kind];
    let remaining=Math.min(dt,.08);
    while(remaining>1e-8){
      const h=Math.min(remaining,1/240);remaining-=h;
      const edgeDrag=this.velocity*this.q>0?Math.max(0,Math.abs(this.q)-.8)*50:0;
      this.velocity*=Math.exp(-(drag+edgeDrag)*h);
      this.q+=this.velocity*h;
      if(Math.abs(this.q)>1){this.q=Math.sign(this.q);this.velocity=0;}
    }
    if(Math.abs(this.velocity)<.001&&Math.abs(this.q)<.001){this.q=0;this.velocity=0;}
    else if(Math.abs(this.velocity)<.001)this.velocity=0;
  }
}
