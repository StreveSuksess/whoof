import { ACESFilmicToneMapping, AmbientLight, DirectionalLight, Group, PCFSoftShadowMap, PerspectiveCamera, Quaternion, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createProductCollar } from './ProductCollar';
import { collarEnvironment } from './CollarLighting';

export async function bootCollarReview() {
  const el = document.querySelector<HTMLElement>('#collar-review')!;
  const status = document.querySelector<HTMLElement>('#model-status')!;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; el.append(renderer.domElement);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  const scene = new Scene(), camera = new PerspectiveCamera(28, 1, .01, 30), root = new Group(); scene.add(root);
  scene.environment = collarEnvironment(renderer); scene.environmentIntensity = 1;
  scene.add(new AmbientLight('#ffffff', .035));
  const key = new DirectionalLight('#ffffff', 2.8); key.position.set(-3, 5, 4); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -1.5; key.shadow.camera.right = key.shadow.camera.top = 1.5; key.shadow.camera.near = .1; key.shadow.camera.far = 15; key.shadow.normalBias = .0006; key.shadow.bias = -.00002;
  const edge = new DirectionalLight('#f4f4f3', .65); edge.position.set(-3, 3, -4); scene.add(edge);
  const fill = new DirectionalLight('#ffffff', .06); fill.position.set(1, -1, 5); scene.add(fill);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.minDistance = .55; controls.maxDistance = 10; controls.enablePan = false;
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);
  function resize() { const { width, height } = el.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render(); }
  new ResizeObserver(resize).observe(el);
  function preset(view: string) {
    const img = document.querySelector<HTMLImageElement>('#reference-frame')!, label = document.querySelector<HTMLElement>('#reference-label')!;
    img.parentElement!.className = `frame reference ${view}`;
    root.rotation.set(0, 0, 0); camera.up.set(0, 1, 0);
    if (view === 'macro') {
      img.src = '/whoof/reference-macro.png'; img.alt = 'Крупный план в исходном видео, 0,8 секунды'; label.textContent = 'КАДР ИЗ ВИДЕО · 0,8 С';
      controls.target.set(0, -.015, .86); camera.position.set(-.25, -.62, 1.65); camera.up.set(.36, 1, 0); el.style.background = '#000'; scene.environmentIntensity = 1; key.intensity = 2.8; key.position.set(-3, 5, 4); fill.intensity = .025;
    } else if (view === 'front') {
      img.src = '/whoof/device-photo.jpg'; img.alt = 'Исходное изображение ошейника спереди'; label.textContent = 'ИСХОДНОЕ ИЗОБРАЖЕНИЕ';
      controls.target.set(0, .01, .75); camera.position.set(0, .52, 4.6); el.style.background = '#fafafa'; scene.environmentIntensity = 1; key.intensity = 2.8; key.position.set(-3, 5, 4); fill.intensity = .06;
    } else {
      img.src = '/whoof/reference-full.png'; img.alt = 'Ошейник в исходном видео, 3,2 секунды'; label.textContent = 'КАДР ИЗ ВИДЕО · 3,2 С';
      controls.target.set(0, 0, 0); camera.position.set(0, 2.37, 4.13);
      root.quaternion.setFromAxisAngle(camera.position.clone().normalize(), -.79).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -.1));
      el.style.background = 'linear-gradient(#afafae,#dddcd9)'; scene.environmentIntensity = 1; key.intensity = 2.8; key.position.set(-3, 5, 4); fill.intensity = .06;
    }
    camera.lookAt(controls.target); controls.update(); render();
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  }
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b => b.addEventListener('click', () => preset(b.dataset.view!)));
  try { root.add((await createProductCollar(true)).group); status.textContent = 'Модель готова'; preset('full'); resize(); }
  catch (e) { status.textContent = 'Модель не загрузилась — обновите страницу'; console.error(e); }
}
