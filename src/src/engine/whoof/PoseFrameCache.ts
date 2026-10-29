type Bitmap={width:number;height:number;close():void};
/** One bounded decode queue for all three hero props. */
export class PoseFrameCache<T extends Bitmap=ImageBitmap>{
  private entries=new Map<string,{value:T;bytes:number}>();private queue:string[]=[];private pending=new Set<string>();private pinned=new Set<string>();private wanted=new Set<string>();private waiters:(()=>void)[]=[];private disposed=false;private paused=false;
  bytes=0;
  constructor(private decode:(key:string)=>Promise<T>,readonly budget=64*1024*1024,private concurrency=2,private changed=()=>{}){}
  get(key:string){const entry=this.entries.get(key);if(!entry)return;this.entries.delete(key);this.entries.set(key,entry);return entry.value;}
  request(keys:string[],pinned:string[]){
    if(this.disposed)return;this.pinned=new Set(pinned);this.wanted=new Set(keys);
    this.queue=[...new Set(keys)].filter(key=>!this.entries.has(key)&&!this.pending.has(key));this.trim();this.drain();
  }
  setPaused(paused:boolean){this.paused=paused;if(paused){this.queue=[];this.wanted=new Set(this.pinned);this.trim(true);}else this.drain();}
  private trim(toPinned=false){for(const [key,entry] of this.entries){if(this.pinned.has(key))continue;if(!toPinned&&this.bytes<=this.budget)break;entry.value.close();this.entries.delete(key);this.bytes-=entry.bytes;}}
  private drain(){
    while(!this.disposed&&!this.paused&&this.pending.size<this.concurrency&&this.queue.length){
      const key=this.queue.shift()!;this.pending.add(key);
      void this.decode(key).then(value=>{
        if(this.disposed||!this.wanted.has(key)&&!this.pinned.has(key)){value.close();return;}
        const bytes=value.width*value.height*4;this.entries.set(key,{value,bytes});this.bytes+=bytes;this.trim();this.changed();
      }).catch(()=>{}).finally(()=>{this.pending.delete(key);this.drain();this.flush();});
    }
    this.flush();
  }
  private flush(){if(!this.pending.size&&(!this.queue.length||this.paused||this.disposed))this.waiters.splice(0).forEach(done=>done());}
  settled(){return !this.pending.size&&(!this.queue.length||this.paused||this.disposed)?Promise.resolve():new Promise<void>(resolve=>this.waiters.push(resolve));}
  dispose(){this.disposed=true;this.queue=[];this.wanted.clear();this.pinned.clear();for(const entry of this.entries.values())entry.value.close();this.entries.clear();this.bytes=0;this.flush();}
}
