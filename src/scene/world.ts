import {
  BackSide, BoxGeometry, BufferGeometry, Color,
  Fog, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, Points, PointsMaterial,
  RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, Texture, TextureLoader,
} from 'three';
import { createMaterials, loadPaintAtlas, seededRandom } from './materials';
import { createParticlePainting } from './particle-paint';

function createSky() {
  return new Mesh(new SphereGeometry(650, 32, 16), new ShaderMaterial({
    side: BackSide, depthWrite: false,
    uniforms: { paintMap: { value: null }, usePaint: { value: 0 }, environmentMap: { value: null }, useEnvironment: { value: 0 } },
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
      uniform sampler2D environmentMap;
      uniform float useEnvironment;
      varying vec3 vPosition;
      float hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1)), f.x), f.y);
      }
      void main() {
        vec3 dir = normalize(vPosition);
        float height = smoothstep(-.06, .72, dir.y);
        vec3 color = mix(vec3(.44,.47,.48), vec3(.34,.38,.40), height);
        vec2 p=vec2(dir.x*19.0+dir.z*13.0,dir.y*19.0);
        float clouds=noise(p*vec2(1.0,2.8))*.55+noise(p*vec2(3.0,9.0))*.3+noise(p*vec2(15.0,38.0))*.15;
        color += (clouds - .5) * .15;
        float ink=smoothstep(.46,.75,noise(p*vec2(.42,.8)+vec2(7.0,1.0)));
        ink*=smoothstep(-.23,.15,dir.y)*(1.0-smoothstep(.57,.9,dir.y));
        float chalk=smoothstep(.44,.77,noise(p*vec2(.32,.55)+vec2(19.0,8.0)));
        color=mix(color,vec3(.63,.65,.64),chalk*.55);
        color=mix(color,vec3(.055,.075,.09),ink*.80);
        vec2 paintUv=vec2(atan(dir.z,dir.x)/6.283185+.5,acos(clamp(dir.y,-1.0,1.0))/3.141593)*vec2(5.0,3.0);
        vec3 brushed=texture2D(paintMap,paintUv).rgb;
        color=mix(color,color*(brushed*.75+vec3(.63)),usePaint*.42);
        vec2 panoramaUv=vec2(atan(dir.z,dir.x)/6.283185+.5,.5+asin(clamp(dir.y,-1.0,1.0))/3.141593);
        vec3 surroundingPaint=texture2D(environmentMap,panoramaUv).rgb;
        float seam=1.0-smoothstep(0.0,.045,min(panoramaUv.x,1.0-panoramaUv.x));
        vec3 oppositeEdge=texture2D(environmentMap,vec2(1.0-panoramaUv.x,panoramaUv.y)).rgb;
        surroundingPaint=mix(surroundingPaint,(surroundingPaint+oppositeEdge)*.5,seam);
        surroundingPaint*=brushed*.24+vec3(.88);
        color=mix(color,surroundingPaint,useEnvironment*.96);
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
  let painting: ReturnType<typeof createParticlePainting> | null = null;
  let environment: Texture | null = null;
  let revision = 0;
  let environmentState: 'loading' | 'ready' | 'fallback' = 'loading';
  let viewportHeight = 900, lastTime = 0;
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

  // Geometry only defines the original motif's placement; visible matter is paint particles.
  scene.updateMatrixWorld(true);
  const surfaces: Mesh[] = [];
  architecture.traverse(object => {
    if (!(object instanceof Mesh)) return;
    surfaces.push(object); object.visible = false;
  });
  const sky = createSky(); scene.add(sky);
  const panoramaReady = new TextureLoader().loadAsync('/textures/ink-panorama.png').then(texture => {
    if (disposed) { texture.dispose(); return null; }
    texture.colorSpace = SRGBColorSpace; texture.wrapS = RepeatWrapping;
    environment = texture;
    sky.material.uniforms.environmentMap.value = texture;
    sky.material.uniforms.useEnvironment.value = 1;
    environmentState = 'ready'; revision++;
    return texture;
  }).catch(() => {
    if (!disposed) { environmentState = 'fallback'; revision++; }
    console.warn('Ink panorama unavailable; using procedural washes.'); return null;
  });
  const ready = loadPaintAtlas(materials, () => disposed).then(atlas => {
    if (disposed) return;
    if (atlas) {
      sky.material.uniforms.paintMap.value = atlas;
      sky.material.uniforms.usePaint.value = 1;
    }
    painting = createParticlePainting(surfaces);
    painting.resize(viewportHeight); painting.update(lastTime);
    scene.add(painting.group);
    revision++;
  });

  return {
    scene, ready, panoramaReady,
    get revision() { return revision; },
    get environmentState() { return environmentState; },
    update(time: number) {
      lastTime = time; painting?.update(time);
    },
    resize(height: number) { viewportHeight = height; painting?.resize(height); },
    dispose() {
      disposed = true;
      const geometries = new Set<BufferGeometry>();
      const mats = new Set<MeshStandardMaterial | ShaderMaterial | PointsMaterial>(Object.values(materials));
      scene.traverse(object => {
        if (object instanceof Mesh || object instanceof Points) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          for (const mat of list) mats.add(mat as MeshStandardMaterial);
        }
      });
      for (const geo of geometries) geo.dispose();
      for (const texture of new Set(Object.values(materials).map(material => material.map))) texture?.dispose();
      environment?.dispose();
      for (const mat of mats) mat.dispose();
    },
  };
}
