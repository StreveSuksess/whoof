/** Scroll direction with a small dead zone for trackpads and native overscroll. */
export function crossesHeader(rect:{top:number;bottom:number;left:number;right:number},floor:number,width:number){
  return rect.bottom>0&&rect.top<floor&&rect.right>0&&rect.left<width&&rect.bottom-rect.top>1&&rect.right-rect.left>1;
}

export class HeaderMotion{
  private previous=0;
  private turn=0;
  private direction=0;
  private hidden=false;

  reset(y:number){this.previous=this.turn=Math.max(0,y);this.direction=0;}

  update(y:number,height:number,focused=false){
    y=Math.max(0,y);
    const direction=Math.sign(y-this.previous);
    if(direction&&direction!==this.direction){this.turn=this.previous;this.direction=direction;}
    const travel=Math.abs(y-this.turn);
    if(y<=height*.35)this.hidden=false;
    else if(travel>=(this.direction<0?18:12))this.hidden=this.direction>0;
    this.previous=y;
    return this.hidden&&!focused;
  }
}
