type Point=[number,number];
type Segment=[Point,Point];
export type LeashContact={negative:Segment;rest:Segment;positive:Segment};
type View={width:number;height:number;left:number;top:number};

/** Generalized force along the rendered bend. Stationary handle has no contacts;
 * contact near the splice has a short lever and therefore almost no influence.
 */
export function leashImpulse(contacts:LeashContact[],q:number,mouse:Point,delta:Point,view:View,radius:number){
  let nearest=Infinity,travel:Point=[0,0],maxTravelSquared=15*15;
  const project=(p:Point):Point=>[p[0]*view.width+view.left,p[1]*view.height+view.top];
  for(const contact of contacts){
    const endpoint=q>=0?contact.positive:contact.negative,t=Math.min(1,Math.abs(q));
    const points=contact.rest.map((p,i)=>project([p[0]+(endpoint[i][0]-p[0])*t,p[1]+(endpoint[i][1]-p[1])*t]));
    const motion:Point=[
      (contact.positive[0][0]-contact.negative[0][0]+contact.positive[1][0]-contact.negative[1][0])*view.width/4,
      (contact.positive[0][1]-contact.negative[0][1]+contact.positive[1][1]-contact.negative[1][1])*view.height/4,
    ];
    maxTravelSquared=Math.max(maxTravelSquared,motion[0]**2+motion[1]**2);
    const [a,b]=points,ex=b[0]-a[0],ey=b[1]-a[1];
    const along=Math.max(0,Math.min(1,((mouse[0]-a[0])*ex+(mouse[1]-a[1])*ey)/(ex*ex+ey*ey||1)));
    const distance=Math.hypot(mouse[0]-a[0]-ex*along,mouse[1]-a[1]-ey*along);
    if(distance<nearest){nearest=distance;travel=motion;}
  }
  if(nearest>=radius)return 0;
  const pressure=1-(nearest/radius)**2;
  return (delta[0]*travel[0]+delta[1]*travel[1])/maxTravelSquared*8*pressure;
}
