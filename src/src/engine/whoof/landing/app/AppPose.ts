/** Nonuniform cubic Hermite: pass through poses with continuous velocity. */
export function sampleAppTrack(t:number,keys:readonly (readonly number[])[]){
  if(t<=keys[0][0])return keys[0].slice(1);
  const last=keys.length-1;if(t>=keys[last][0])return keys[last].slice(1);
  let i=0;while(t>keys[i+1][0])i++;
  const a=keys[i],b=keys[i+1],duration=b[0]-a[0],u=(t-a[0])/duration;
  const h00=2*u**3-3*u*u+1,h10=u**3-2*u*u+u,h01=-2*u**3+3*u*u,h11=u**3-u*u;
  return a.slice(1).map((value,k)=>{
    const j=k+1,da=i===0?0:(b[j]-keys[i-1][j])/(b[0]-keys[i-1][0]);
    const db=i+1===last?0:(keys[i+2][j]-a[j])/(keys[i+2][0]-a[0]);
    return h00*value+h10*duration*da+h01*b[j]+h11*duration*db;
  });
}
/** Normalized framing, body pitch/yaw/bank and diagonal collar-axis travel. */
export function getAppObjectPose(t:number,mobile:boolean,portrait:boolean,macroX:number,macroY:number){
  const phone=sampleAppTrack(t,[
    [.85,macroX,macroY,1,0,0,0],
    [2.05,mobile?.52:portrait?.69:.66,mobile?.61:.54,1,.10,-.43,-.10],
    [3.30,mobile?.52:portrait?.69:.65,mobile?.61:.55,1,-.12,.36,.085],
    [4.30,mobile?.695:.685,mobile?.61:.56,.98,.06,.20,.055],
    [5.25,.33,mobile?.61:.55,1.03,.20,-.68,-.14],
    [5.90,mobile?.28:.27,mobile?.61:.55,1,.16,-.57,-.10],
    [6.65,mobile?.28:portrait?.28:.31,mobile?.64:.66,.84,.02,.12,.065],
    [7.80,mobile?.29:.36,mobile?.68:.67,.70,-.16,.40,.11],
  ]);
  const collar=sampleAppTrack(t,[
    [4.70,1.30,.78,.94,-.15,-.65,-.35,-.50],
    [5.20,1.00,mobile?.72:portrait?.67:.75,1.03,-.52,-.38,-.32,0],
    [5.90,mobile?.76:.73,mobile?.64:portrait?.59:.65,1.08,-.34,.35,.12,.70],
    [6.70,mobile?.77:portrait?.73:.71,.65,.98,-.50,.75,.28,1.50],
    [7.80,mobile?.75:.67,mobile?.68:.66,.86,-.18,1.05,.10,2.30],
  ]);
  return {phone,collar};
}
