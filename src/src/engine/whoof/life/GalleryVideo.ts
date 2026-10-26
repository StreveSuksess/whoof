/** Serial play intent: a late play() resolution cannot restart an inactive clip. */
export class GalleryVideo {
  private desired=false;
  private pending:Promise<void>|null=null;
  private disposed=false;
  private prepared=false;
  blocked=false;
  constructor(readonly element:HTMLVideoElement) { element.muted=true; element.controls=false; }
  prepare() {
    if(this.prepared)return;
    this.prepared=true;
    this.element.preload='auto';
    this.element.load();
  }
  retry() { this.blocked=false; }
  setPlaying(wanted:boolean) {
    this.desired=wanted&&!this.disposed;
    if(!this.desired) { this.element.pause(); return; }
    this.prepare();
    if(this.pending||this.blocked||!this.element.paused)return;
    this.pending=this.element.play().catch(()=>{if(this.desired)this.blocked=true;}).finally(()=>{
      this.pending=null;
      if(!this.desired||this.disposed)this.element.pause();
    });
  }
  dispose() { this.disposed=true; this.setPlaying(false); }
}
