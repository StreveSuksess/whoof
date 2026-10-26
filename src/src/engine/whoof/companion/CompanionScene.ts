import { Bone, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Quaternion, SkinnedMesh, Vector3, CanvasTexture, PlaneGeometry, MeshBasicMaterial, DoubleSide, WebGLRenderer, PMREMGenerator, TextureLoader, SRGBColorSpace, EquirectangularReflectionMapping, WebGLRenderTarget } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { applyOpeningColorLook, openingColorLook } from '../OpeningLighting';
import { CompanionMotion } from './CompanionMotion';

/** Authored seated pose, short skinned guard hairs and the source facial shapes. */
export class CompanionScene {
  root = new Group();
  mount = new Object3D();
  ready = false;
  failed = false;
  private promise?: Promise<void>;
  private studio?: WebGLRenderTarget;
  private motion = new CompanionMotion();
  private bones = new Map<string, { bone: Bone; rest: Quaternion; yaw: Vector3; pitch: Vector3 }>();
  private materials = new Set<MeshStandardMaterial>();
  private faces: SkinnedMesh[] = [];
  private reveal = {value: 0};
  private time = 0;
  private blinkAt = 2.8;
  private rotation = new Quaternion();
  private shadow: Mesh;
  constructor() {
    this.root.visible = false;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(35,32,27,.36)'); gradient.addColorStop(.35, 'rgba(35,32,27,.18)'); gradient.addColorStop(1, 'rgba(35,32,27,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
    const shadowMaterial = new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false, opacity: 0, toneMapped: false });
    this.shadow = new Mesh(new PlaneGeometry(2.8, 2.1), shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.set(0, -.028, -.1); this.root.add(this.shadow);
  }
  load(renderer: WebGLRenderer) {
    if (this.promise) return this.promise;
    this.promise = this.loadModel(renderer).catch(error => { this.failed = true; console.warn('Companion model unavailable', error); });
    return this.promise;
  }
  private async loadModel(renderer: WebGLRenderer) {
    const draco = new DRACOLoader().setDecoderPath('/whoof/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    try {
      const [gltf, radiance, colorLook, shadowMap, occlusion] = await Promise.all([
        loader.loadAsync('/whoof/companion/labrador-v1.glb'),
        new RGBELoader().loadAsync('/whoof/companion/studio.hdr'), openingColorLook(),
        new TextureLoader().loadAsync('/whoof/companion/contact-shadow.png'),
        new TextureLoader().loadAsync('/whoof/companion/occlusion.png'),
      ]);
      occlusion.flipY=false; occlusion.channel=0;
      radiance.mapping=EquirectangularReflectionMapping;
      const pmrem = new PMREMGenerator(renderer); this.studio=pmrem.fromEquirectangular(radiance); pmrem.dispose(); radiance.dispose();
      const shadowMaterial = this.shadow.material as MeshBasicMaterial;
      shadowMaterial.map?.dispose(); shadowMap.colorSpace=SRGBColorSpace; shadowMaterial.map=shadowMap; shadowMaterial.onBeforeCompile=shader=>{
        shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\n diffuseColor.a *= 1.0-smoothstep(.20,.47,length(vMapUv-.5));');
      }; shadowMaterial.customProgramCacheKey=()=> 'companion-soft-contact'; shadowMaterial.needsUpdate=true;
      this.shadow.geometry.dispose(); this.shadow.geometry=new PlaneGeometry(6,6); this.shadow.position.z=0;
      const dog = gltf.scene; this.root.add(dog); dog.updateMatrixWorld(true);
      dog.traverse(object => {
        if (object instanceof Mesh) {
          object.frustumCulled = false; object.castShadow = !object.name.includes('coat'); object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if (!(material instanceof MeshStandardMaterial)) return;
            material.side = DoubleSide;
            material.aoMap=occlusion;material.aoMapIntensity=.85;
            material.envMap = this.studio!.texture; material.envMapIntensity = 1;
            material.transparent = false;
            material.onBeforeCompile = shader => {
              shader.uniforms.companionReveal = this.reveal;
              shader.fragmentShader = 'uniform float companionReveal;\n' + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', `
                #include <alphatest_fragment>
                float coverage = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(.06711056, .00583715))));
                if (coverage > companionReveal) discard;
              `);
            };
            material.customProgramCacheKey = () => 'companion-reveal-v1';
            applyOpeningColorLook(material, colorLook);
            if (material instanceof MeshPhysicalMaterial) material.sheenColor.setRGB(.7, .6, .45);
            this.materials.add(material);
          });
        }
        if (object instanceof SkinnedMesh && object.morphTargetDictionary) this.faces.push(object);
        if (object instanceof Bone && ['Neck1', 'Neck2', 'Neck3', 'Head', 'Ear1L', 'Ear1R', 'Ear1.L', 'Ear1.R'].includes(object.name)) {
          const inverse = object.getWorldQuaternion(new Quaternion()).invert();
          this.bones.set(object.name, { bone: object, rest: object.quaternion.clone(), yaw: new Vector3(0, 1, 0).applyQuaternion(inverse), pitch: new Vector3(1, 0, 0).applyQuaternion(inverse) });
        }
      });
      const neck = this.bones.get('Neck1')?.bone || dog;
      neck.add(this.mount);
      this.mount.position.copy(neck.worldToLocal(new Vector3(0, 2.23, .47)));
      this.mount.quaternion.copy(neck.getWorldQuaternion(new Quaternion()).invert()).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), .40));
      this.ready = true;
    } finally { draco.dispose(); }
  }
  pointer(x: number, y: number) { this.motion.pointer(x, y); }
  leave() { this.motion.leave(); }
  update(dt: number, fade: number, stacked: boolean, mobile: boolean, reduced: boolean, coarse: boolean) {
    this.root.visible = this.ready && fade > .001;
    if (!this.root.visible) return;
    this.root.position.set(stacked ? 0 : .95, stacked ? (mobile ? .90 : .72) : -.02, 0);
    this.root.rotation.y = -.55;
    this.root.scale.setScalar(stacked ? .84 : 1);
    this.reveal.value = fade;
    (this.shadow.material as MeshBasicMaterial).opacity = fade * .58;
    const pose = this.motion.update(dt, reduced, coarse);
    this.time += reduced ? 0 : dt;
    for (const [name, state] of this.bones) {
      const yaw = name === 'Neck3' ? pose.headYaw * .7 : name === 'Head' ? pose.headYaw * .3 : name === 'Neck2' ? pose.neckYaw : 0;
      const pitch = name === 'Neck3' ? pose.headPitch * .65 : name === 'Head' ? pose.headPitch * .35 : 0;
      state.bone.quaternion.copy(state.rest).multiply(this.rotation.setFromAxisAngle(state.yaw, yaw)).multiply(this.rotation.setFromAxisAngle(state.pitch, pitch));
      if (name.startsWith('Ear1')) state.bone.quaternion.multiply(this.rotation.setFromAxisAngle(state.pitch, pose.earTilt));
    }
    const blinkTime = this.time - this.blinkAt;
    const blink = reduced ? 0 : blinkTime >= 0 && blinkTime < .22 ? Math.sin(blinkTime / .22 * Math.PI) ** 2 : 0;
    if (blinkTime > .22) this.blinkAt = this.time + 3.4 + Math.sin(this.time * 7) * .75;
    for (const face of this.faces) {
      const d = face.morphTargetDictionary!, values = face.morphTargetInfluences!;
      if (d['eye blink'] !== undefined) values[d['eye blink']] = blink;
      // A small fraction of the authored breath, so the coat stays in contact.
      if (d.breath !== undefined) values[d.breath] = reduced ? 0 : (pose.breath / .003 + 1) * .025;
    }
    this.root.updateMatrixWorld(true);
  }
  collarPose(position: Vector3, quaternion: Quaternion) {
    this.mount.getWorldPosition(position); this.mount.getWorldQuaternion(quaternion);
  }
}
