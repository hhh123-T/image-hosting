import { Vector2 } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Edge-aware strokes, with stationary paper grain to avoid temporal flicker.
export function createPaintPass() {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, resolution: { value: new Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      varying vec2 vUv;
      float hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
      }
      float luma(vec3 c) { return dot(c,vec3(.299,.587,.114)); }
      vec3 samplePaint(vec2 uv) { return texture2D(tDiffuse,clamp(uv,vec2(.001),vec2(.999))).rgb; }
      void main() {
        vec2 px=1.0/resolution;
        vec2 paperCoord=vUv*resolution;
        vec2 warp=vec2(noise(paperCoord*.035),noise(paperCoord.yx*.037+27.0))-.5;
        vec2 uv=vUv+warp*px*3.3;
        vec3 c=samplePaint(uv);
        float center=luma(c);
        float gx=luma(samplePaint(uv+vec2(px.x*1.8,0)))-luma(samplePaint(uv-vec2(px.x*1.8,0)));
        float gy=luma(samplePaint(uv+vec2(0,px.y*1.8)))-luma(samplePaint(uv-vec2(0,px.y*1.8)));
        vec2 tangent=normalize(vec2(-gy,gx)+vec2(.001,.0001));
        vec2 stepUv=tangent*px*(1.4+noise(paperCoord*.07)*1.5);
        vec3 pigment=c*.5;
        float weight=.5;
        for (int i=-2;i<=2;i++) {
          if (i==0) continue;
          vec3 stroke=samplePaint(uv+stepUv*float(i));
          float w=.18*(1.0-smoothstep(.035,.18,abs(luma(stroke)-center)));
          pigment+=stroke*w; weight+=w;
        }
        c=mix(c,pigment/weight,.68);
        float tooth=noise(paperCoord*.28)*.55+noise(paperCoord*.63)*.3+hash(paperCoord)*.15;
        float fibre=sin(paperCoord.x*2.1)*sin(paperCoord.y*2.7);
        float contour=min(length(vec2(gx,gy))*.3,.095);
        c-=contour*(.45+tooth*.55);
        c+=(tooth-.5)*.052+fibre*.006;
        c=(c-vec3(.43))*1.10+vec3(.43);
        c.b+=.006; c.g-=.008;
        c*=1.0-dot(vUv-.5,vUv-.5)*.065;
        gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);
      }
    `,
  });
}
