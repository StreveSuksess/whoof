import {RectAreaLight,type Scene} from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

/** Broad physical reflections on black plastic; captured hero HDR remains in place. */
export class StoryLighting {
  readonly key=new RectAreaLight(0xf7f4ee,0,2.8,5);
  readonly rim=new RectAreaLight(0xf5f6f8,0,1.1,3);
  constructor(scene:Scene){
    RectAreaLightUniformsLib.init();
    this.key.position.set(-4,3.5,5.5);this.key.lookAt(0,.855,0);
    this.rim.position.set(3,1.3,-3.6);this.rim.lookAt(0,.855,0);
    scene.add(this.key,this.rim);
  }
  setStrength(amount:number){
    this.key.intensity=3.4*amount;
    this.rim.intensity=12*amount;
  }
}
