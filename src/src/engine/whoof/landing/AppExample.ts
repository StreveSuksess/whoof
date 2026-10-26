export class AppExample {
  private tabs:HTMLButtonElement[];
  private panels:HTMLElement[];
  private abort=new AbortController();
  constructor(root:HTMLElement,onChange:()=>void) {
    this.tabs=[...root.querySelectorAll<HTMLButtonElement>('[data-app-tab]')];
    this.panels=[...root.querySelectorAll<HTMLElement>('[role=tabpanel]')];
    const select=(index:number,focus=false)=>{
      this.tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;this.panels[i].hidden=i!==index;});
      if(focus)this.tabs[index].focus();onChange();
    };
    this.tabs.forEach((tab,i)=>{
      tab.addEventListener('click',()=>select(i),{signal:this.abort.signal});
      tab.addEventListener('keydown',event=>{
        let next=i;
        if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%this.tabs.length;
        else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i+this.tabs.length-1)%this.tabs.length;
        else if(event.key==='Home')next=0;
        else if(event.key==='End')next=this.tabs.length-1;
        else return;
        event.preventDefault();select(next,true);
      },{signal:this.abort.signal});
    });
  }
  dispose(){this.abort.abort();}
}
