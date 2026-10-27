import {CanvasTexture,SRGBColorSpace} from 'three';
import {clamp,type AppSceneState} from './AppMotion';
const W=1024,H=2208;
import {DAY_POINTS,DAY_TREND as values} from './AppData';
/** Native canvas reconstruction of the supplied app-day/app-dynamics examples. */
export class AppScreen {
  canvas=document.createElement('canvas');texture:CanvasTexture;
  private ctx:CanvasRenderingContext2D;private key='';
  constructor(){this.canvas.width=W;this.canvas.height=H;this.ctx=this.canvas.getContext('2d')!;this.texture=new CanvasTexture(this.canvas);this.texture.colorSpace=SRGBColorSpace;this.texture.anisotropy=4;}
  private text(text:string,x:number,y:number,size:number,color='#252629',weight=400,align:CanvasTextAlign='left'){const c=this.ctx;c.fillStyle=color;c.font=`${weight} ${size}px Whoof,Arial,sans-serif`;c.textAlign=align;c.fillText(text,x,y);}
  private card(x:number,y:number,w:number,h:number,r=42){const c=this.ctx;c.fillStyle='#ffffff';c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  update(s:AppSceneState){
    const key=[s.day.toFixed(3),s.compare.toFixed(3),s.graph.toFixed(3),s.zoom.toFixed(3)].join('/');if(key===this.key)return;this.key=key;
    const c=this.ctx;c.clearRect(0,0,W,H);c.fillStyle='#f7f7f5';c.fillRect(0,0,W,H);
    c.globalAlpha=s.zoom;this.text('9:41',84,81,34,'#22252a',600);this.text('▰',930,81,35,'#22252a',400,'right');
    this.text('WHOOF',78,252,55,'#24262b',600);this.text('Джека',944,252,34,'#74777d',400,'right');
    this.text(s.compare>.5?'Привычный ритм':'Карта дня',78,389,78,'#252629',500);
    this.text('Пример интерфейса',80,451,31,'#8c8d92');
    c.globalAlpha=1-s.compare;this.day(s.day,s.zoom);c.globalAlpha=s.compare;this.comparison(s.graph);c.globalAlpha=s.zoom;
    this.text('После синхронизации',W/2,1925,33,'#757880',400,'center');
    this.text('Демонстрационные данные',W/2,1978,27,'#999ba1',400,'center');
    c.strokeStyle='#e7e7e4';c.lineWidth=2;c.beginPath();c.moveTo(55,2042);c.lineTo(969,2042);c.stroke();
    ['Сегодня','История','Профиль'].forEach((v,i)=>this.text(v,180+i*332,2112,31,i===0?'#5052ee':'#95979d',i===0?500:400,'center'));
    c.globalAlpha=1;this.texture.needsUpdate=true;
  }
  private day(progress:number,ui:number){
    const c=this.ctx,cx=512,cy=1050,r=356;
    const gradient=c.createRadialGradient(cx,cy,0,cx,cy,r);gradient.addColorStop(0,'#e9e8f9');gradient.addColorStop(.72,'#efedf8');gradient.addColorStop(1,'#f7f7f5');c.fillStyle=gradient;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
    c.lineWidth=2;c.strokeStyle='#dfe0da';for(const scale of [1,.72,.40]){c.setLineDash(scale===1?[]:[3,17]);c.beginPath();c.arc(cx,cy,r*scale,0,Math.PI*2);c.stroke();}c.setLineDash([]);
    c.strokeStyle='#e4e4df';c.beginPath();c.moveTo(cx-r-20,cy);c.lineTo(cx+r+20,cy);c.moveTo(cx,cy-r-20);c.lineTo(cx,cy+r+20);c.stroke();
    [['00:00',cx,cy-r-52],['06:00',cx+r+22,cy+11],['12:00',cx,cy+r+73],['18:00',cx-r-22,cy+11]].forEach(([v,x,y],i)=>this.text(v as string,x as number,y as number,29,'#969990',400,i===1?'left':i===3?'right':'center'));
    for(const point of DAY_POINTS){const show=clamp((progress*24-point.hour)*2);if(show===0)continue;c.globalAlpha*=show;c.fillStyle=point.color;c.beginPath();c.arc(cx+point.x*r,cy+point.y*r,point.size*(.6+.4*show),0,Math.PI*2);c.fill();c.globalAlpha/=show;}
    const a=Math.min(progress,.9999)*Math.PI*2-Math.PI/2;c.strokeStyle='#5355ef';c.lineWidth=7;c.lineCap='round';c.beginPath();c.arc(cx,cy,r+12,a-.18,a+.18);c.stroke();c.strokeStyle='#7778ed65';c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);c.stroke();
    let point=DAY_POINTS[0];for(const sample of DAY_POINTS){if(sample.hour>progress*24)break;point=sample;}c.fillStyle='#fff';c.strokeStyle='#5658ec';c.lineWidth=5;c.beginPath();c.arc(cx+point.x*r,cy+point.y*r,15,0,Math.PI*2);c.fill();c.stroke();
    c.save();c.globalAlpha*=ui;this.card(74,1575,426,215);this.card(524,1575,426,215);this.text('48%',107,1670,68,'#292b30',500);this.text('Движение',108,1733,32,'#93969c');this.text('52%',558,1670,68,'#292b30',500);this.text('Покой',559,1733,32,'#93969c');c.restore();
  }
  private comparison(progress:number){
    const c=this.ctx;this.card(65,615,894,840);this.text('Активность',108,720,45,'#272a30',500);this.text('14 дней',914,720,31,'#b0b2b8',400,'right');
    const left=115,top=820,w=795,h=470,bottom=top+h;
    c.lineWidth=2;c.strokeStyle='#e3e4e8';for(let i=0;i<4;i++){c.beginPath();c.moveTo(left,top+i*h/3);c.lineTo(left+w,top+i*h/3);c.stroke();}
    const path=(fill=false)=>{c.beginPath();values.forEach((value,i)=>{const x=left+i*w/13,y=bottom-value*h*.9;i===0?c.moveTo(x,y):c.lineTo(x,y);});if(fill){c.lineTo(left+w,bottom);c.lineTo(left,bottom);c.closePath();}};
    c.save();c.beginPath();c.rect(left-10,top-20,w*progress+20,h+50);c.clip();const gradient=c.createLinearGradient(0,top,0,bottom);gradient.addColorStop(0,'#5b5dfa8a');gradient.addColorStop(1,'#585aff00');c.fillStyle=gradient;path(true);c.fill();c.strokeStyle='#4d50f6';c.lineWidth=8;c.lineJoin='round';path();c.stroke();c.restore();
    const i=Math.min(13,Math.floor(progress*13)),x=left+i*w/13,y=bottom-values[i]*h*.9;c.fillStyle='#4d50f6';c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fill();c.stroke();this.text('11.04',left,1390,30,'#adafb5');this.text('24.04',left+w,1390,30,'#adafb5',400,'right');
    this.card(74,1575,426,215);this.card(524,1575,426,215);this.text('52%',107,1670,68,'#292b30',500);this.text('Покой',108,1733,32,'#93969c');this.text('48%',558,1670,68,'#292b30',500);this.text('Активность',559,1733,32,'#93969c');
  }
  dispose(){this.texture.dispose();}
}
