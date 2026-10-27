import {ease} from '../../core/ease';
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
const fit=(n:number,a:number,b:number)=>clamp((n-a)/(b-a||1));
export type PosterBounds={left:number;width:number};

/** Keep the live scene behind the arriving picture until it is covered. */
export function getOwnerEntryState(local:number,height:number){
  const backdrop=ease.cubicInOut(fit(local/height,-.12,0));
  return {backdrop,worldVisible:backdrop<1};
}

/** SocialSection's horizontal rail and200/1080 background travel. */
export function getOwnerPosterState(local:number,height:number,width:number,movable:number,items:PosterBounds[],mobile:boolean,reduced=false){
  if(reduced)return {offset:0,clip:1,backdrop:1,panels:items.map(()=>({x:0,imageX:0,opacity:1,visible:true})),active:0};
  const {backdrop}=getOwnerEntryState(local,height);
  const offset=clamp(local,0,movable),clip=mobile?1:ease.expoInOut(fit(local/height,-1.1,-.8));
  let active=0;
  const panels=items.map((item,index)=>{
    if(mobile){
      const from=index*width,to=(index+1)*width;
      const x=width*(1-fit(offset+width,from,to));
      let opacity=index===items.length-1?1:1-fit(offset,to-width*.75,to);
      if(offset+width<from)opacity=0;
      if(offset>=from)active=index;
      return {x,imageX:0,opacity,visible:opacity>.001};
    }
    const from=item.left-width,to=item.left+item.width;
    if(offset>=item.left-width*.5)active=index;
    return {x:0,imageX:-(200/1080)*height*.8*(1-fit(offset,from,to)),opacity:1,visible:item.left+item.width>=offset-width*.25&&item.left<=offset+width*1.25};
  });
  return {offset,clip,backdrop,panels,active};
}
