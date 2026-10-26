import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene, WebGLRenderer } from 'three';

// A soft directional key describes black plastic without turning flat faces white.
export function collarEnvironment(renderer: WebGLRenderer) {
  const studio = new Scene(); studio.background = new Color('#010101');
  function softbox(x: number, y: number, z: number, width: number, height: number, strength: number) {
    const mesh = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({ color: new Color(strength, strength, strength), toneMapped: false }));
    mesh.position.set(x, y, z); mesh.lookAt(0, 0, 0); studio.add(mesh);
  }
  softbox(-5, 4, 1, 2.8, 5, 10);
  softbox(-3, 5, -4, 1.2, 4, 2.5);
  softbox(-4, -1, 5, 3, 3, 4.5);
  const pmrem = new PMREMGenerator(renderer), target = pmrem.fromScene(studio, .01);
  studio.traverse(o => { if (o instanceof Mesh) { o.geometry.dispose(); (o.material as MeshBasicMaterial).dispose(); } }); pmrem.dispose();
  return target.texture;
}
