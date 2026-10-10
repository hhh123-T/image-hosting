import { Vector2 } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Keep visible particles crisp while chalk-colored highlights diffuse into paper.
export function createParticleGrade() {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, resolution: { value: new Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 resolution; varying vec2 vUv;
      float hash(vec2 p) {vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
      vec3 light(vec2 uv){vec3 c=texture2D(tDiffuse,uv).rgb;return c*smoothstep(.68,.95,dot(c,vec3(.299,.587,.114)));}
      void main(){
        vec2 px=3.8/resolution;vec3 c=texture2D(tDiffuse,vUv).rgb;
        vec3 glow=(light(vUv+vec2(px.x,0))+light(vUv-vec2(px.x,0))+light(vUv+vec2(0,px.y))+light(vUv-vec2(0,px.y)))*.25;
        c=mix(c,c+glow*.085,.55);
        c+=(hash(floor(vUv*resolution))-.5)*.028;
        c=(c-.43)*1.06+.43;c*=1.0-dot(vUv-.5,vUv-.5)*.12;
        gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
      }`,
  });
}
