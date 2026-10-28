import {DAY_TREND} from './AppData';

export const SCREEN_WIDTH=1024,SCREEN_HEIGHT=2208;
export const DAY_PLOT={left:84,right:940,baseline:1090,span:856};
export const APP_PALETTE={paper:'#f4f1eb',ink:'#111315',muted:'#8f9298',blue:'#555cf6'};
const bounded=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const fmt=(value:number)=>Number(value.toFixed(3));

// Art-directed demonstration, not a record or classifier output. Each fin is
// a ten-minute interval; height illustrates relative movement, never steps/GPS.
export const DAY_ACTIVITY=Array.from({length:144},(_,i)=>{
  const hour=(i+.5)/6;
  const peak=(centre:number,width:number,power:number)=>power*Math.exp(-.5*((hour-centre)/width)**2);
  const envelope=.025+peak(7.7,.75,.80)+peak(8.75,.32,.34)+peak(12.7,.56,.36)+peak(17.9,.95,.73)+peak(20.5,.4,.19);
  const grain=.73+.18*Math.sin(i*2.17)+.09*Math.cos(i*.71);
  return bounded(envelope*grain);
});

export function getAppArtworkState(day:number,graph:number,compare:number,zoom:number){
  const d=bounded(day),minutes=Math.min(1439,Math.floor(d*1440));
  return {
    dayWidth:fmt(DAY_PLOT.span*d),cursorX:fmt(DAY_PLOT.left+DAY_PLOT.span*d),
    selectionX:fmt(DAY_PLOT.left+Math.max(0,DAY_PLOT.span*d-22)),
    time:`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`,
    weekWidth:fmt(DAY_PLOT.span*bounded(graph)),dayOpacity:1-bounded(compare),weekOpacity:bounded(compare),chromeOpacity:bounded(zoom)
  };
}
const text=(value:string,x:number,y:number,size:number,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${value}</text>`;
function fins(fill:string){
  const step=DAY_PLOT.span/144;
  return DAY_ACTIVITY.map((value,i)=>{
    const height=fmt(14+value*420),x=fmt(DAY_PLOT.left+i*step);
    return `<rect x="${x}" y="${fmt(DAY_PLOT.baseline-height)}" width="3.6" height="${height}" rx="1.8" fill="${fill}"/>`;
  }).join('');
}
function dayMarkup(prefix:string){
  const {paper,muted,blue}=APP_PALETTE;
  return `<g data-art-day>
    <defs><clipPath id="${prefix}-day"><rect data-art-day-clip x="84" y="630" width="856" height="500"/></clipPath><clipPath id="${prefix}-selection"><rect data-art-selection x="918" y="630" width="24" height="500"/></clipPath></defs>
    ${text('23:59',940,600,118,'data-art-time text-anchor="end" font-weight="400" letter-spacing="-7" style="font-variant-numeric:tabular-nums"')}
    ${text('ВРЕМЯ ДНЯ',936,648,23,`text-anchor="end" fill="${muted}" letter-spacing="2"`)}
    <g opacity=".09">${fins(paper)}</g>
    <g clip-path="url(#${prefix}-day)"><g opacity=".88">${fins(paper)}</g><g clip-path="url(#${prefix}-selection)">${fins(blue)}</g></g>
    <path d="M84 1122H940" stroke="${paper}" stroke-opacity=".16"/>
    ${[0,6,12,18,24].map((hour,i)=>{const x=84+i*214;return `<path d="M${x} 1122v12" stroke="${paper}" stroke-opacity=".25"/>${text(String(hour).padStart(2,'0'),x,1198,27,`text-anchor="${i===0?'start':i===4?'end':'middle'}" fill="${muted}" style="font-variant-numeric:tabular-nums"`)}`;}).join('')}
    <g data-art-cursor transform="translate(940 0)"><path d="M0 1115v24" stroke="${blue}" stroke-width="3"/></g>
    <g data-art-chrome><path d="M84 1340h22" stroke="${paper}" stroke-width="4"/>${text('Движение',122,1350,31,`fill="${paper}"`)}<path d="M565 1340h22" stroke="${muted}" stroke-width="4"/>${text('Спокойные периоды',603,1350,31,`fill="${muted}"`)}</g>
  </g>`;
}
function weekMarkup(prefix:string){
  const {paper,muted,blue}=APP_PALETTE,step=DAY_PLOT.span/14;
  return `<g data-art-week opacity="0">
    <defs><clipPath id="${prefix}-week"><rect data-art-week-clip x="84" y="630" width="856" height="500"/></clipPath></defs>
    ${text('14',940,600,118,'text-anchor="end" font-weight="400" letter-spacing="-7"')}${text('ДНЕЙ В ИСТОРИИ',936,648,23,`text-anchor="end" fill="${muted}" letter-spacing="2"`)}
    <path d="M84 1122H940M84 906H940M84 690H940" stroke="${paper}" stroke-opacity=".10"/>
    <g clip-path="url(#${prefix}-week)">${DAY_TREND.map((value,i)=>{const x=fmt(84+i*step+14),h=fmt(value*400);return `<rect x="${x}" y="${1090-h}" width="30" height="${h}" rx="3" fill="${i===13?blue:paper}" opacity="${i===13?1:.34+i*.035}"/>`;}).join('')}</g>
    ${text('11 апреля',84,1198,27,`fill="${muted}"`)}${text('24 апреля',940,1198,27,`text-anchor="end" fill="${muted}"`)}
    <g data-art-chrome>${text('Одна собака. Разные дни.',84,1350,34,`fill="${paper}"`)}${text('Сравнение с её собственной историей',84,1410,28,`fill="${muted}"`)}</g>
  </g>`;
}
function graphic(prefix:string){return dayMarkup(prefix)+weekMarkup(prefix);}
export function renderAppScreenSvg(prefix='whoof-day'){
  const {paper,ink,muted,blue}=APP_PALETTE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="2208" viewBox="0 0 1024 2208" fill="${paper}" font-family="Whoof, Arial, sans-serif" role="img" aria-label="Концепт интерфейса Whoof: демонстрационная история движений за день">
    <rect data-art-chrome width="1024" height="2208" rx="112" fill="${ink}"/>
    <g data-art-chrome>${text('9:41',84,93,31,'font-weight="500"')}
      <path d="M846 72v15m10-22v22m10-29v29" stroke="${paper}" stroke-width="6"/><rect x="894" y="61" width="47" height="25" rx="6" stroke="${paper}" stroke-width="3" fill="none"/><rect x="900" y="67" width="33" height="13" rx="2"/><path d="M947 69v9" stroke="${paper}" stroke-width="3"/>
      <rect x="371" y="51" width="282" height="65" rx="32" fill="#08090b"/><circle cx="605" cy="83" r="12" fill="#202b3c"/>
      ${text('WHOOF',84,258,52,'font-weight="500" letter-spacing="-2"')}${text('Джека',940,258,31,`text-anchor="end" fill="${muted}"`)}
      <path d="M84 306H940" stroke="${paper}" stroke-opacity=".16"/>
      ${text('Ритм дня',84,407,67,'data-art-heading letter-spacing="-3"')}
    </g>
    ${graphic(prefix)}
    <g data-art-chrome><path d="M84 1510H940" stroke="${paper}" stroke-opacity=".16"/>
      ${text('48',84,1660,114,'letter-spacing="-6"')}${text('%',218,1657,49,`fill="${muted}"`)}${text('Движение',84,1723,30,`fill="${muted}"`)}
      ${text('52',565,1660,114,'letter-spacing="-6"')}${text('%',699,1657,49,`fill="${muted}"`)}${text('Спокойные периоды',565,1723,30,`fill="${muted}"`)}
      ${text('После синхронизации',512,1906,29,`text-anchor="middle" fill="${muted}"`)}
      <path d="M84 2030H940" stroke="${paper}" stroke-opacity=".16"/>
      ${['Сегодня','История','Профиль'].map((value,i)=>text(value,184+i*328,2103,30,`text-anchor="middle" fill="${i===0?blue:muted}"`)).join('')}
      <path d="M380 2160h264" stroke="${paper}" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>
    </g>
  </svg>`.replace(/\b(data-art-[\w-]+)(?=[\s>])/g,'$1=""');
}
/** Same vectors as the moving screen; static/native-reading derivatives. */
export function renderAppArtwork(mode:'day'|'week',fullScreen=false){
  let svg=renderAppScreenSvg(`whoof-static-${mode}`);
  if(mode==='week')svg=svg.replace('<g data-art-day="">','<g data-art-day="" opacity="0">').replace('<g data-art-week="" opacity="0">','<g data-art-week="" opacity="1">').replace('data-art-heading="" letter-spacing="-3">Ритм дня','data-art-heading="" letter-spacing="-3">История движения');
  if(!fullScreen){
    svg=svg.replace('width="1024" height="2208" viewBox="0 0 1024 2208"','width="1024" height="768" viewBox="0 475 1024 768"');
    svg=svg.replaceAll('data-art-chrome','opacity="0" data-art-chrome');
    svg=svg.replace('<rect opacity="0" data-art-chrome','<rect data-art-chrome');
  }
  return svg;
}
