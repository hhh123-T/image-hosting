import { Color, PlaneGeometry, ShaderMaterial, Texture } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export function createWater() {
  const shader = {
    name: 'InkWashWater',
    uniforms: {
      color: { value: new Color('#939c9d') }, tDiffuse: { value: null },
      textureMatrix: { value: null }, time: { value: 0 },
      paintMap: { value: null }, usePaint: { value: 0 },
    },
    vertexShader: `
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      varying vec3 vWorld;
      void main() {
        vUv=textureMatrix*vec4(position,1.0);
        vWorld=(modelMatrix*vec4(position,1.0)).xyz;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform sampler2D paintMap;
      uniform float usePaint;
      varying vec4 vUv;
      varying vec3 vWorld;
      float hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
      }
      void main() {
        vec2 p=vWorld.xz;
        float wave=sin(p.x*.16+time)*sin(p.y*.22-time);
        float broad=noise(p*vec2(.07,.2)+vec2(sin(time)*.2,cos(time)*.2));
        float stroke=noise(p*vec2(.24,3.6)+vec2(wave*.06,0.0));
        float bristle=noise(p*vec2(1.7,25.0));
        vec2 uv=vUv.xy/vUv.w;
        uv+=vec2((stroke-.5)*.012,(broad-.5)*.007+wave*.0013);
        vec3 reflection=texture2D(tDiffuse,uv).rgb*.4;
        reflection+=texture2D(tDiffuse,uv+vec2(.003,.0015)).rgb*.15;
        reflection+=texture2D(tDiffuse,uv-vec2(.003,.0015)).rgb*.15;
        reflection+=texture2D(tDiffuse,uv+vec2(.006,-.001)).rgb*.15;
        reflection+=texture2D(tDiffuse,uv-vec2(.006,-.001)).rgb*.15;
        vec3 wash=color+(broad-.5)*.055+(stroke-.5)*.033;
        vec3 surface=mix(reflection,wash,.42+stroke*.23);
        surface+=(bristle-.5)*.028;
        surface-=smoothstep(.68,.87,stroke)*.045;
        vec3 dryPaint=texture2D(paintMap,p*vec2(.024,.052)).rgb;
        surface=mix(surface,surface*.72+dryPaint*.28,usePaint*.7);
        float fade=smoothstep(170.0,500.0,length(p));
        surface=mix(surface,vec3(.40,.43,.44),fade*.65);
        gl_FragColor=vec4(surface,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  };
  const water = new Reflector(new PlaneGeometry(1600, 1600), {
    textureWidth: 512, textureHeight: 512, clipBias: .003,
    color: '#939c9d', multisample: 0, shader,
  });
  water.rotation.x = -Math.PI / 2; water.position.y = -.12;
  const material = water.material as ShaderMaterial;
  return {
    mesh: water,
    update: (time: number) => { material.uniforms.time.value = time; },
    setPaintMap(texture: Texture) {
      material.uniforms.paintMap.value = texture; material.uniforms.usePaint.value = 1;
    },
  };
}
