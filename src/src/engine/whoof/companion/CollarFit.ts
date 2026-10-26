import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';

/** Flex only the textile ellipse to the neck; keep STL and fittings rigid. */
export function collarFit(group: Group) {
  const amount = {value: 0};
  const configured = new Set<MeshStandardMaterial>();
  const keepers: {mesh: Mesh; position: Vector3}[] = [];
  group.traverse(object => {
    if (!(object instanceof Mesh)) return;
    if (object.name === 'Strap keeper') keepers.push({mesh: object, position: object.position.clone()});
    if (object.name !== 'Woven band' && !object.name.includes('yarn')) return;
    const material = object.material as MeshStandardMaterial;
    if (configured.has(material)) return;
    configured.add(material);
    const previous = material.onBeforeCompile.bind(material), key=material.customProgramCacheKey();
    material.onBeforeCompile=(shader,renderer)=>{
      previous(shader,renderer);shader.uniforms.neckFit=amount;
      shader.vertexShader='uniform float neckFit;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>', `
        vec4 mvPosition=vec4(transformed,1.0);
        #ifdef USE_BATCHING
          mvPosition=batchingMatrix*mvPosition;
        #endif
        #ifdef USE_INSTANCING
          mvPosition=instanceMatrix*mvPosition;
        #endif
        mvPosition.x*=mix(1.0,.87,neckFit);
        mvPosition=modelViewMatrix*mvPosition;
        gl_Position=projectionMatrix*mvPosition;
      `);
    };
    material.customProgramCacheKey=()=>key+'-neck-fit';material.needsUpdate=true;
  });
  return (value: number)=>{
    amount.value=value;
    keepers.forEach(({mesh,position})=>{mesh.position.copy(position);mesh.position.x*=1-.13*value;});
  };
}
