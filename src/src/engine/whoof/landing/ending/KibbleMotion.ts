const TAU=Math.PI*2;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function projectKibblePointer(px:number,py:number,width:number,height:number,progress:number){return {x:px*width*.5,y:-py*height*.5+(1-clamp(progress,0,1))*.24*height};}
function random(seed:number){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

/** Adapted from source footer Particles: spiral drift, damped attraction,
 * cursor momentum and contacts. A linked-cell grid replaces the all-pairs loop. */
export class KibbleMotion{
  readonly position:Float32Array;readonly velocity:Float32Array;readonly rotation:Float32Array;
  readonly scale:Float32Array;readonly phase:Float32Array;readonly radius:Float32Array;readonly progress:Float32Array;
  readonly angular:Float32Array;private baseAngular:Float32Array;private speed:Float32Array;
  count:number;time=0;contactChecks=0;
  private next:Int32Array;private heads=new Int32Array(0);private nx=1;private ny=13;private nz=9;
  private width=6;private cell=.46;private minX=0;private minY=-3;private minZ=-2;
  private mouseX=0;private mouseY=0;private mouseReady=false;
  constructor(readonly capacity=420,seed=521){
    this.count=capacity;const rng=random(seed);
    this.position=new Float32Array(capacity*3);this.velocity=new Float32Array(capacity*3);this.rotation=new Float32Array(capacity*3);
    this.angular=new Float32Array(capacity*3);this.baseAngular=new Float32Array(capacity*3);
    this.scale=new Float32Array(capacity);this.phase=new Float32Array(capacity);this.radius=new Float32Array(capacity);this.progress=new Float32Array(capacity);this.speed=new Float32Array(capacity);this.next=new Int32Array(capacity);
    for(let i=0;i<capacity;i++){
      this.progress[i]=rng();this.phase[i]=rng()*TAU;this.radius[i]=.18+Math.sqrt(rng())*.65;
      this.scale[i]=.30+Math.pow(rng(),1.7)*.34;this.speed[i]=.018*(.8+rng()*.4);
      for(let axis=0;axis<3;axis++){const k=i*3+axis;this.rotation[k]=rng()*TAU;this.angular[k]=this.baseAngular[k]=(rng()-.5)*.55;}
      this.place(i);
    }
    this.resize(6);
  }
  private target(i:number){
    const u=this.progress[i],a=8*u+this.time*.25,r=this.radius[i],phase=this.phase[i]+u*8;
    return [this.width*(u*1.3-.65),-.95+(u-.5)*.5+.18*Math.sin(a)+r*.65*Math.cos(phase),.16*Math.cos(a)+r*1.25*Math.sin(phase)] as const;
  }
  private place(i:number){const p=this.target(i),k=i*3;this.position[k]=p[0];this.position[k+1]=p[1];this.position[k+2]=p[2];this.velocity[k]=this.width*1.3*this.speed[i];this.velocity[k+1]=this.velocity[k+2]=0;}
  resize(width:number){
    const ratio=width/this.width;
    for(let i=0;i<this.capacity;i++){this.position[i*3]*=ratio;this.velocity[i*3]*=ratio;}
    this.width=width;this.minX=-width*.95-1;this.nx=Math.ceil((width*1.9+2)/this.cell);
    this.heads=new Int32Array(this.nx*this.ny*this.nz);this.mouseReady=false;
  }
  private cellAt(x:number,y:number,z:number){
    const ix=clamp(Math.floor((x-this.minX)/this.cell),0,this.nx-1),iy=clamp(Math.floor((y-this.minY)/this.cell),0,this.ny-1),iz=clamp(Math.floor((z-this.minZ)/this.cell),0,this.nz-1);
    return [ix,iy,iz] as const;
  }
  private contacts(){
    this.heads.fill(-1);
    for(let i=0;i<this.count;i++){const k=i*3,[x,y,z]=this.cellAt(this.position[k],this.position[k+1],this.position[k+2]),cell=(z*this.ny+y)*this.nx+x;this.next[i]=this.heads[cell];this.heads[cell]=i;}
    for(let i=0;i<this.count;i++){
      const k=i*3,[cx,cy,cz]=this.cellAt(this.position[k],this.position[k+1],this.position[k+2]);
      for(let z=Math.max(0,cz-1);z<=Math.min(this.nz-1,cz+1);z++)for(let y=Math.max(0,cy-1);y<=Math.min(this.ny-1,cy+1);y++)for(let x=Math.max(0,cx-1);x<=Math.min(this.nx-1,cx+1);x++){
        for(let j=this.heads[(z*this.ny+y)*this.nx+x];j!==-1;j=this.next[j]){
          if(j<=i)continue;this.contactChecks++;
          const q=j*3,dx=this.position[q]-this.position[k],dy=this.position[q+1]-this.position[k+1],dz=this.position[q+2]-this.position[k+2];
          const d2=dx*dx+dy*dy+dz*dz,min=(this.scale[i]+this.scale[j])*.16;
          if(d2>=min*min||d2<1e-12)continue;
          const distance=Math.sqrt(d2),push=(min-distance)*.5/distance;
          this.position[k]-=dx*push;this.position[k+1]-=dy*push;this.position[k+2]-=dz*push;
          this.position[q]+=dx*push;this.position[q+1]+=dy*push;this.position[q+2]+=dz*push;
        }
      }
    }
  }
  step(dt:number,mx:number,my:number,pointer=false){
    if(!(dt>0))return;dt=Math.min(.05,dt);this.time+=dt;this.contactChecks=0;
    if(!this.mouseReady||!pointer){this.mouseX=mx;this.mouseY=my;this.mouseReady=pointer;}
    const oldX=this.mouseX,oldY=this.mouseY,blend=1-Math.exp(-14*dt);
    this.mouseX+=(mx-this.mouseX)*blend;this.mouseY+=(my-this.mouseY)*blend;
    const sx=this.mouseX-oldX,sy=this.mouseY-oldY,segment=sx*sx+sy*sy;
    const mvx=clamp(sx/dt,-6,6),mvy=clamp(sy/dt,-6,6),steps=Math.ceil(dt/(1/90)),h=dt/steps;
    for(let step=0;step<steps;step++){
      for(let i=0;i<this.count;i++){
        const k=i*3;this.progress[i]+=this.speed[i]*h;
        if(this.progress[i]>1){this.progress[i]-=1;this.place(i);}
        const target=this.target(i);
        for(let axis=0;axis<3;axis++){
          const at=k+axis;this.velocity[at]+=(target[axis]-this.position[at])*2.2*h;this.velocity[at]*=Math.exp(-2.1*h);
          this.angular[at]+=(this.baseAngular[at]-this.angular[at])*(1-Math.exp(-2*h));
        }
        if(pointer){
          const along=segment>1e-10?clamp(((this.position[k]-oldX)*sx+(this.position[k+1]-oldY)*sy)/segment,0,1):1;
          const dx=this.position[k]-(oldX+sx*along),dy=this.position[k+1]-(oldY+sy*along),dz=this.position[k+2]*.22;
          const dist=Math.sqrt(dx*dx+dy*dy+dz*dz),reach=.56;
          if(dist<reach&&dist>.0001){
            const force=(1-dist/reach)**2;
            this.velocity[k]+=(dx/dist*4+mvx*2.2)*force*h;this.velocity[k+1]+=(dy/dist*4+mvy*2.2)*force*h;
            this.velocity[k+2]+=dz/dist*force*h;
            this.angular[k]+=mvy*force*h*1.7;this.angular[k+1]+=mvx*force*h*1.7;
          }
        }
        for(let axis=0;axis<3;axis++){const at=k+axis;this.velocity[at]=clamp(this.velocity[at],-3.2,3.2);this.position[at]+=this.velocity[at]*h;this.rotation[at]=(this.rotation[at]+this.angular[at]*h)%TAU;}
        this.position[k]=clamp(this.position[k],-this.width*.95-1,this.width*.95+1);
        this.position[k+1]=clamp(this.position[k+1],-2.8,.85);this.position[k+2]=clamp(this.position[k+2],-1.6,1.6);
      }
      this.contacts();
    }
  }
}
