import {
  BackSide, BoxGeometry, BufferGeometry, Color, DirectionalLight, Float32BufferAttribute,
  Fog, Group, HemisphereLight, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Points, PointsMaterial,
  Scene, ShaderMaterial, SphereGeometry,
} from 'three';
import { createMaterials, loadPaintAtlas, seededRandom } from './materials';
import { createWater } from './water';

function createSky() {
  return new Mesh(new SphereGeometry(650, 32, 16), new ShaderMaterial({
    side: BackSide, depthWrite: false,
    uniforms: { paintMap: { value: null }, usePaint: { value: 0 } },
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D paintMap;
      uniform float usePaint;
      varying vec3 vPosition;
      float hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1)), f.x), f.y);
      }
      void main() {
        vec3 dir = normalize(vPosition);
        float height = smoothstep(-.06, .72, dir.y);
        vec3 color = mix(vec3(.42,.44,.44), vec3(.29,.32,.34), height);
        vec2 p=vec2(atan(dir.z,dir.x)*8.0,dir.y*19.0);
        float clouds=noise(p*vec2(1.0,2.8))*.55+noise(p*vec2(3.0,9.0))*.3+noise(p*vec2(15.0,38.0))*.15;
        color += (clouds - .5) * .15;
        vec2 paintUv=vec2(atan(dir.z,dir.x)/6.283185+.5,acos(clamp(dir.y,-1.0,1.0))/3.141593)*vec2(5.0,3.0);
        vec3 brushed=texture2D(paintMap,paintUv).rgb;
        color=mix(color,brushed*.55+vec3(.18),usePaint*.38);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }));
}

export function createWorld() {
  const scene = new Scene();
  scene.background = new Color('#a9b0b1');
  scene.fog = new Fog('#a9b0b1', 135, 460);
  const materials = createMaterials();
  let disposed = false;
  const geometry = new BoxGeometry(1, 1, 1, 4, 10, 2);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    vertices.setXYZ(i, x + Math.sin(y * 31 + z * 11) * .013,
      y + Math.sin(x * 19 + z * 35) * .010, z + Math.sin(x * 23 + y * 41) * .009);
  }
  geometry.computeVertexNormals();
  const architecture = new Group();
  scene.add(architecture);
  const random = seededRandom(915);

  const block = (
    x: number, y: number, z: number, width: number, height: number, depth: number,
    material: MeshStandardMaterial, parent: Group = architecture,
  ) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const slab = (x: number, y: number, z: number, width: number, depth: number, thick = 1.05) => {
    const group = new Group(); architecture.add(group);
    block(x, y, z, width, thick, depth, materials.sage, group);
    block(x, y - thick / 2 + 0.045, z + depth / 2 - 0.06, width, 0.09, 0.16, materials.dark, group);
    return group;
  };

  // Main motif: chalk walls, an ochre incision, and charcoal uprights lifted from the painting.
  block(-17, 14, -24, 12, 26, 12, materials.chalk);
  block(-25, 22, -25, 3.8, 43, 9, materials.dark).rotation.z = .018;
  block(-8.2, 14.5, -23.5, 5.2, 27.5, 7, materials.ochre);
  block(-11.1, 14.5, -19.8, .7, 27.5, .5, materials.dark);
  block(12.4, 15.8, -24, 15.8, 29.4, 9, materials.ivory);
  block(23.9, 29, -25, 6.4, 58, 13, materials.dark).rotation.z = -.012;
  block(20.2, 18.2, -19.8, 1.6, 34.4, 1, materials.stone);
  block(-31.5, 10.8, -26, 7.4, 20.4, 9, materials.ivory);
  slab(-3, 29.2, -24, 58, 14, 1.9);
  slab(-2, 14.1, -21.5, 59, 7.8, 1.1);
  slab(-2, 1.1, -21, 64, 20, 2);
  slab(-20, 39, -26, 22, 15, 1.4);
  // Thin lines interrupt broad walls like the dark strokes in the painting.
  for (const x of [-17.4, -15.9, 10.4, 13.4]) {
    block(x, 10.2, -17.9, 0.1, 15.3, 0.12, materials.stone);
  }

  // Successive portals make the unpainted spaces in the source into immense courtyards.
  for (let i = 0; i < 7; i++) {
    const z = -62 - i * 33;
    const height = 31 + Math.sin(i * 1.7) * 8 + i * 1.4;
    const span = 34 + i * 3;
    const offset = Math.sin(i * 1.3) * 6;
    block(offset - span / 2, height / 2, z, 5 + i * .45, height, 6, i % 2 ? materials.stone : materials.ivory);
    block(offset + span / 2, height / 2 + 4, z, 4.5, height + 8, 8, i % 2 ? materials.dark : materials.chalk);
    block(offset - span / 2 + 4, height * .47, z + 0.2, 2.4, height * .94, 4, materials.ochre);
    slab(offset, height, z, span + 7, 10, 1.3);
    slab(offset, 1.2, z, span + 20, 17, 1.8);
    if (i < 3) slab(offset, height * .45, z, span + 5, 5.5, .75);
  }

  // Two displaced galleries extend the architecture sideways, beyond the original frame.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const x = side * (43 + i * 21);
      const z = -63 - i * 14 + side * 13;
      const height = 20 + random() * 34;
      block(x, height / 2, z, 10 + random() * 8, height, 8 + random() * 8, i % 3 === 0 ? materials.dark : materials.chalk);
      slab(x + side * 5, height - 1, z, 25, 10, 1.1);
      if (i < 3) block(x - side * 5, height * .38, z + 5, 2.7, height * .74, 4, materials.ochre);
      slab(x, .9, z, 20, 18, 1.5);
    }
  }

  // The source's charcoal masses rise beyond the frame as rough, ink-dark cliffs.
  const rockGeometry = new IcosahedronGeometry(1, 1);
  for (const [x, y, z, sx, sy, sz] of [
    [25, 55, -28, 9, 14, 10], [28, 30, -34, 8, 28, 12],
    [-25, 39, -29, 6, 10, 9], [53, 45, -91, 12, 32, 10],
  ]) {
    const rock = new Mesh(rockGeometry, materials.dark);
    rock.position.set(x, y, z); rock.scale.set(sx, sy, sz);
    rock.rotation.set(.12, x * .13, .1);
    rock.castShadow = true; rock.receiveShadow = true; architecture.add(rock);
  }
  for (let i = 0; i < 7; i++) {
    block(27 + i * 1.1, 23 + i * 1.7, -25 - i * .8, .6 + random(), 43 + random() * 15, 8, i % 3 ? materials.dark : materials.stone);
  }
  slab(-36, 2.4, 5, 29, 13, 1.4);
  slab(-30, 1.1, 19, 20, 9, .7);

  // Broken horizontal brush marks become low, stepping islands across the water.
  for (let i = 0; i < 12; i++) {
    const x = -15 + Math.sin(i * .64) * 12;
    const z = 35 - i * 6;
    const stone = block(x, .34 + random() * .12, z, 4 + random() * 8, .4 + random() * .5, 1.5 + random() * 2.5, i % 3 ? materials.sage : materials.dark);
    stone.rotation.y = (random() - .5) * .3;
  }
  for (let i = 0; i < 28; i++) {
    const x = (random() - .5) * 430;
    const z = -230 - random() * 170;
    const height = 18 + random() * 90;
    block(x, height / 2, z, 4 + random() * 12, height, 5 + random() * 15, i % 4 ? materials.stone : materials.dark);
  }

  // Batch identical pigment faces. Source boxes retain their individual bounds
  // for the collision check, while the renderer draws the batches instead.
  scene.updateMatrixWorld(true);
  const batches = new Map<MeshStandardMaterial, Mesh[]>();
  architecture.traverse(object => {
    if (!(object instanceof Mesh) || object.geometry !== geometry) return;
    const material = object.material as MeshStandardMaterial;
    const list = batches.get(material) || []; list.push(object); batches.set(material, list);
  });
  for (const [material, meshes] of batches) {
    const batch = new InstancedMesh(geometry, material, meshes.length);
    batch.name = 'Painted architecture batch';
    meshes.forEach((mesh, index) => { batch.setMatrixAt(index, mesh.matrixWorld); mesh.visible = false; });
    batch.instanceMatrix.needsUpdate = true; batch.computeBoundingSphere();
    batch.castShadow = true; batch.receiveShadow = true; scene.add(batch);
  }
  const sky = createSky(); scene.add(sky);
  scene.add(new HemisphereLight('#e2e5e5', '#737a7d', 1.4));
  const sunlight = new DirectionalLight('#eee9e0', 1.8);
  sunlight.position.set(-65, 95, 40);
  sunlight.target.position.set(0, 0, -55);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -150, right: 150, top: 130, bottom: -110, near: 1, far: 300 });
  sunlight.shadow.bias = -0.0004;
  sunlight.shadow.normalBias = 0.12;
  scene.add(sunlight, sunlight.target);
  const fill = new DirectionalLight('#bccad2', .38);
  fill.position.set(55, 35, -70);
  scene.add(fill);

  materials.dark.emissive.set('#596267');
  materials.dark.emissiveIntensity = .24;

  const water = createWater(); scene.add(water.mesh);
  const ready = loadPaintAtlas(materials, () => disposed).then(atlas => {
    if (disposed) return;
    if (atlas) {
      water.setPaintMap(atlas);
      sky.material.uniforms.paintMap.value = atlas;
      sky.material.uniforms.usePaint.value = 1;
    }
  });
  const dustGeometry = new BufferGeometry();
  const positions: number[] = [], seeds: number[] = [];
  for (let i = 0; i < 650; i++) {
    positions.push((random() - .5) * 170, random() * 60 + 1, -random() * 210 + 45);
    seeds.push(random());
  }
  dustGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  dustGeometry.setAttribute('seed', new Float32BufferAttribute(seeds, 1));
  const dust = new Points(dustGeometry, new ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: `attribute float seed; varying float vSeed; varying float vFade;
      void main() {
        vSeed=seed; vec4 p=modelViewMatrix*vec4(position,1.0);
        vFade=1.0-smoothstep(35.0,150.0,-p.z);
        gl_PointSize=clamp((.25+seed*.65)*180.0/-p.z,.6,3.0);
        gl_Position=projectionMatrix*p;
      }`,
    fragmentShader: `varying float vSeed; varying float vFade;
      void main() {
        vec2 p=gl_PointCoord-.5;
        float d=length(p*vec2(1.0,1.6));
        float alpha=(1.0-smoothstep(.12,.5,d))*.22*vFade;
        gl_FragColor=vec4(mix(vec3(.23,.26,.28),vec3(.72,.74,.71),vSeed),alpha);
        #include <colorspace_fragment>
      }`,
  }));
  scene.add(dust);

  return {
    scene, ready,
    update(time: number) {
      // All movement is periodic with the camera loop, including the ripples.
      const phase = time / 48 * Math.PI * 2;
      // Architecture stays fixed like dry paint; only the wash and flecks drift.
      dust.position.x = Math.sin(phase) * 1.4;
      dust.position.y = Math.cos(phase) * .45;
      water.update(phase);
    },
    dispose() {
      disposed = true;
      water.mesh.dispose();
      const geometries = new Set<BufferGeometry>();
      const mats = new Set<MeshStandardMaterial | ShaderMaterial | PointsMaterial>();
      scene.traverse(object => {
        if (object instanceof InstancedMesh) object.dispose();
        if (object instanceof Mesh || object instanceof Points) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          for (const mat of list) mats.add(mat as MeshStandardMaterial);
        }
      });
      for (const geo of geometries) geo.dispose();
      for (const texture of new Set(Object.values(materials).map(material => material.map))) texture?.dispose();
      for (const mat of mats) mat.dispose();
      sunlight.shadow.dispose();
    },
  };
}
