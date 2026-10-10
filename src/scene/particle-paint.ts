import {
  BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial,
  Points, ShaderMaterial, Vector2, Vector3, type Texture,
} from 'three';
import { seededRandom } from './materials';

type PaintTriangle = {
  a: Vector3; b: Vector3; c: Vector3; normal: Vector3;
  ua: Vector2; ub: Vector2; uc: Vector2;
  material: MeshStandardMaterial; end: number;
};
const linear = Float32Array.from({ length: 256 }, (_, i) => {
  const value = i / 255;
  return value < .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4);
});

function pigmentReader() {
  const images = new Map<Texture, ImageData>();
  return (material: MeshStandardMaterial, u: number, v: number): number[] => {
    const map = material.map;
    if (!map) return [material.color.r, material.color.g, material.color.b];
    let data = images.get(map);
    if (!data) {
      const canvas = map.image as HTMLCanvasElement;
      const context = canvas?.getContext?.('2d');
      if (!context) return [material.color.r, material.color.g, material.color.b];
      data = context.getImageData(0, 0, canvas.width, canvas.height);
      images.set(map, data);
    }
    const x = Math.floor(((u % 1 + 1) % 1) * data.width);
    const y = Math.min(data.height - 1, Math.floor((1 - (v % 1 + 1) % 1) * data.height));
    const index = (y * data.width + x) * 4;
    return [linear[data.data[index]] * material.color.r,
      linear[data.data[index + 1]] * material.color.g,
      linear[data.data[index + 2]] * material.color.b];
  };
}

/** Sample paint into thick, eroded volumes; the source triangles are never rendered. */
export function samplePaintCloud(meshes: Mesh[], count: number, seed: number) {
  if (!Number.isInteger(count) || count < 1 || count > 250000) throw new RangeError('Invalid pigment point budget');
  const random = seededRandom(seed), readPigment = pigmentReader();
  const triangles: PaintTriangle[] = [];
  let area = 0;
  for (const mesh of meshes) {
    const geometry = mesh.geometry, position = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
    const index = geometry.index;
    const weight = .08 + 1 / Math.pow(1 + Math.max(0, -mesh.matrixWorld.elements[14] - 40) * .014, 1.8);
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const ids = [0, 1, 2].map(k => index ? index.getX(i + k) : i + k);
      const [a, b, c] = ids.map(id => new Vector3().fromBufferAttribute(position, id).applyMatrix4(mesh.matrixWorld));
      const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a));
      const triangleArea = normal.length() * .5 * weight;
      if (triangleArea < .00001) continue;
      area += triangleArea; normal.normalize();
      const [ua, ub, uc] = ids.map(id => uv ? new Vector2(uv.getX(id), uv.getY(id)) : new Vector2(.5, .5));
      triangles.push({ a, b, c, normal, ua, ub, uc, material: mesh.material as MeshStandardMaterial, end: area });
    }
  }
  if (!triangles.length) throw new Error('No pigment surfaces to sample');
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count), sizes = new Float32Array(count), mobility = new Float32Array(count);
  const p = new Vector3();
  for (let i = 0; i < count; i++) {
    const pick = random() * area;
    let left = 0, right = triangles.length - 1;
    while (left < right) {
      const mid = (left + right) >>> 1;
      if (triangles[mid].end < pick) left = mid + 1; else right = mid;
    }
    const t = triangles[left], root = Math.sqrt(random());
    const a = 1 - root, b = root * (1 - random()), c = 1 - a - b;
    p.copy(t.a).multiplyScalar(a).addScaledVector(t.b, b).addScaledVector(t.c, c);
    const u = t.ua.x * a + t.ub.x * b + t.uc.x * c;
    const v = t.ua.y * a + t.ub.y * b + t.uc.y * c;
    const fu = (u % 1 + 1) % 1, fv = (v % 1 + 1) % 1;
    const border = Math.max(0, Math.min(1, 1 - Math.min(fu, fv, 1 - fu, 1 - fv) / .2));
    const thickness = 1.2 + border * 3.2;
    p.addScaledVector(t.normal, (random() + random() + random() - 1.5) * thickness);
    p.x += Math.sin(p.y * .14 + p.z * .043) * 1.6 + (random() - .5) * (2.4 + border * 5);
    p.y += Math.sin(p.x * .12 + p.z * .027) * 1.3 + (random() - .5) * (2.1 + border * 4);
    p.z += Math.sin(p.y * .16 + p.x * .037) * 1.5 + (random() - .5) * (2.6 + border * 5);
    positions.set([p.x, Math.max(.15, p.y), p.z], i * 3);
    const color = readPigment(t.material, u, v), variation = .76 + random() * .24;
    colors.set(color.map(channel => channel * variation), i * 3);
    seeds[i] = random(); sizes[i] = .13 + Math.pow(random(), 1.6) * .30;
    mobility[i] = seeds[i] > .77 ? .35 + random() * .65 : .035 + border * .18;
  }
  return attributes(positions, colors, seeds, sizes, mobility);
}

function attributes(positions: Float32Array, colors: Float32Array, seeds: Float32Array,
  sizes: Float32Array, mobility: Float32Array) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setAttribute('seed', new Float32BufferAttribute(seeds, 1));
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('mobility', new Float32BufferAttribute(mobility, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function atmosphere(count: number, water = false) {
  const random = seededRandom(water ? 887 : 319);
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count), sizes = new Float32Array(count), mobility = new Float32Array(count);
  const slate = new Color('#88999e'), powder = new Color('#d8dbd6'), charcoal = new Color('#39484f');
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2, height = random() * 155 - 4;
    const radius = 148 + random() * 80 + Math.sin(height * .035 + theta * 2) * 26;
    const x = water ? (random() - .5) * 370 : Math.cos(theta) * radius;
    const z = water ? 100 - random() * 450 : -65 + Math.sin(theta) * radius * 1.2;
    const y = water ? -.25 + Math.sin(x * .045 + z * .02) * .15 : height + Math.sin(theta * 3) * 9;
    positions.set([x, y, z], i * 3);
    const ink = Math.max(0, Math.sin(theta * 2.2 + .6) * .65 + Math.cos(height * .047 + theta * 1.7) * .4);
    const color = slate.clone().lerp(powder, random() * .4).lerp(charcoal, water ? 0 : ink * .87);
    colors.set([color.r, color.g, color.b], i * 3);
    seeds[i] = random(); sizes[i] = water ? .22 + random() * .43 : .85 + random() * 1.65;
    mobility[i] = water ? 0 : .15 + random() * .3;
  }
  return attributes(positions, colors, seeds, sizes, mobility);
}

function particleMaterial(kind: number) {
  return new ShaderMaterial({
    vertexColors: true, transparent: kind !== 0, depthWrite: kind === 0,
    uniforms: { phase: { value: 0 }, viewportHeight: { value: 900 }, kind: { value: kind }, fogColor: { value: new Color('#a8b1b3') } },
    vertexShader: `
      attribute float seed; attribute float size; attribute float mobility;
      uniform float phase; uniform float viewportHeight; uniform float kind;
      varying vec3 vColor; varying float vSeed; varying float vDepth; varying float vOpacity;
      void main() {
        vSeed=seed; vColor=color; vOpacity=1.0;
        vec3 p=position;
        float unfold=.18+.82*(.5-.5*cos(phase));
        vec3 curl=vec3(sin(p.y*.12+phase),cos(p.x*.08+phase),sin(p.y*.09+p.x*.03+phase));
        vec3 drift=vec3(sin(seed*17.0+phase)*24.0,cos(seed*23.0+phase)*13.0,sin(seed*31.0+phase)*22.0);
        p+=mobility*(curl*4.0+drift*unfold);
        if (kind>.5 && kind<1.5) {
          if(seed<.73) { gl_Position=vec4(2.0,2.0,2.0,1.0); gl_PointSize=1.0; return; }
          p.y=-max(.2,p.y); p.x+=sin(p.z*.18+phase)*1.9;
          vColor=mix(vColor,vec3(.28,.34,.37),.53);
          vOpacity=.64*exp(-abs(p.y)*.019);
        }
        if(kind>1.5 && kind<2.5) vOpacity=.19;
        if(kind>2.5 && kind<3.5) { p.y+=sin(p.x*.025+phase)*.12; vOpacity=.33; }
        if(kind>3.5) vOpacity=.55;
        vec4 mv=modelViewMatrix*vec4(p,1.0); vDepth=-mv.z;
        float scale=kind>3.5?8.0:(kind>1.5 && kind<2.5 ? 1.2 : 1.0);
        float limit=kind>3.5?46.0:(kind>1.5?17.0:3.8);
        gl_PointSize=clamp(size*viewportHeight/max(vDepth,1.0)*scale,.8,limit);
        vColor*=1.12+.14*sin(position.y*.07+seed*11.0);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform float kind; uniform vec3 fogColor;
      varying vec3 vColor; varying float vSeed; varying float vDepth; varying float vOpacity;
      float hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      void main() {
        vec2 p=gl_PointCoord-.5;
        if(kind>3.5) {
          float angle=vSeed<.38?1.570796:0.0;
          vec2 brush=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
          float tooth=hash(floor(gl_PointCoord*vec2(32.0,11.0))+vSeed*81.0);
          float edge=length(brush*vec2(.9,1.65))+(tooth-.5)*.08;
          float alpha=(1.0-smoothstep(.18,.5,edge))*vOpacity*(.7+tooth*.3);
          if(alpha<.01) discard;
          vec3 ink=mix(vColor*(.88+tooth*.18),fogColor,smoothstep(80.0,460.0,vDepth)*.65);
          gl_FragColor=vec4(ink,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          return;
        }
        float angle=kind>2.5?0.0:vSeed*6.283185;
        p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
        vec2 form=kind>2.5 ? vec2(.8,2.5) : vec2(.93,1.25+vSeed*.85);
        float edge=length(p*form);
        float tooth=hash(floor(gl_PointCoord*15.0)+vSeed*81.0);
        float alpha=(1.0-smoothstep(.12,.5,edge))*(.68+tooth*.32);
        if(alpha<.13) discard;
        vec3 ink=vColor*(.84+tooth*.22);
        float fog=smoothstep(80.0,460.0,vDepth)*.80;
        ink=mix(ink,fogColor,fog);
        if(kind<.5 && vSeed>.992) ink+=vec3(.08,.09,.10)*(1.0-fog);
        gl_FragColor=vec4(ink,kind>.5 ? alpha*vOpacity : 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function createParticlePainting(meshes: Mesh[]) {
  const group = new Group(); group.name = 'Living pigment painting';
  const cloud = samplePaintCloud(meshes, 220000, 7419);
  const points = new Points(cloud, particleMaterial(0)); points.name = 'Volumetric pigment body';
  const mistGeometry = new BufferGeometry();
  for (const [name, attribute] of Object.entries(cloud.attributes)) {
    const subset = new Float32Array(Math.ceil(attribute.count / 8) * attribute.itemSize);
    for (let i = 0; i < attribute.count; i += 8) {
      for (let k = 0; k < attribute.itemSize; k++) subset[i / 8 * attribute.itemSize + k] = attribute.array[i * attribute.itemSize + k];
    }
    mistGeometry.setAttribute(name, new Float32BufferAttribute(subset, attribute.itemSize));
  }
  const mist = new Points(mistGeometry, particleMaterial(4)); mist.name = 'Volumetric pigment wash';
  const reflection = new Points(cloud, particleMaterial(1)); reflection.name = 'Dissolving pigment reflection';
  const surrounding = new Points(atmosphere(55000), particleMaterial(2)); surrounding.name = 'Enveloping ink atmosphere';
  const water = new Points(atmosphere(26000, true), particleMaterial(3)); water.name = 'Silver wash particles';
  group.add(points, reflection, surrounding, water, mist);
  const fields = [points, reflection, surrounding, water, mist];
  for (const field of fields) field.frustumCulled = false;
  return {
    group,
    update(time: number) {
      const phase = ((time % 48 + 48) % 48) / 48 * Math.PI * 2;
      for (const field of fields) field.material.uniforms.phase.value = phase;
    },
    resize(height: number) {
      for (const field of fields) field.material.uniforms.viewportHeight.value = height;
    },
  };
}
