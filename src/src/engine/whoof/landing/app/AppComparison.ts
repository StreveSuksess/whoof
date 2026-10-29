/** Authored example only: relative movement, not sensor readings or a diagnosis. */
export const REFERENCE_DAY=Object.freeze(Array.from({length:144},(_,i)=>{
  const hour=(i+.5)/6;
  const peak=(centre:number,width:number,power:number)=>power*Math.exp(-.5*((hour-centre)/width)**2);
  const envelope=.025+peak(7.7,.75,.80)+peak(8.75,.32,.34)+peak(12.7,.56,.36)+peak(17.9,.95,.73)+peak(20.5,.4,.19);
  return Math.max(0,Math.min(1,envelope*(.73+.18*Math.sin(i*2.17)+.09*Math.cos(i*.71))));
}));
export const EXAMPLE_DAY=Object.freeze(REFERENCE_DAY.map((value,i)=>i>=42&&i<60?value*.38:value));

/** Both the chart and comparison checks use these same ten-minute intervals. */
export function compareWindow(startHour:number,endHour:number){
  if(!Number.isFinite(startHour)||!Number.isFinite(endHour)||startHour<0||endHour>24||startHour>=endHour)throw new RangeError('Expected a window within one day');
  const sum=(values:readonly number[])=>values.reduce((total,value,i)=>total+((i+.5)/6>=startHour&&(i+.5)/6<endHour?value:0),0);
  const reference=sum(REFERENCE_DAY),current=sum(EXAMPLE_DAY);
  return {reference,current,ratio:reference?current/reference:1};
}
