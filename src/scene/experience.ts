import {
  ACESFilmicToneMapping, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace,
  Vector3, WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createParticleGrade } from './particle-grade';
import { Playback } from '../playback';
import { createWorld } from './world';
import { sampleJourney } from './camera-path';

export type View = 'journey' | 'still' | 'aerial';
export class Experience {
  readonly playback: Playback;
  readonly renderer: WebGLRenderer;
  private readonly camera = new PerspectiveCamera(43, 1, .3, 1400);
  private readonly world = createWorld();
  private readonly composer: EffectComposer;
  private readonly grain: ShaderPass;
  private readonly resizeObserver: ResizeObserver;
  private frame = 0;
  private lastTime = 0;
  private view: View = 'journey';
  private destroyed = false;
  private contextLost = false;
  private needsRender = true;
  private renderedTime = -1;
  private renderedRevision = -1;
  private assetsReady = false;

  constructor(private readonly container: HTMLElement, private readonly onFrame: (time: number, chapter: string) => void) {
    this.playback = new Playback(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .92;
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    const canvas = this.renderer.domElement;
    canvas.setAttribute('aria-label', '无垠庭院，实时渲染的三维绘画世界');
    canvas.addEventListener('webglcontextlost', this.handleContextLoss);
    container.appendChild(canvas);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.world.scene, this.camera));
    this.composer.addPass(new OutputPass());
    this.grain = createParticleGrade();
    this.composer.addPass(this.grain);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.resize();
    this.world.ready.then(() => {
      if (!this.destroyed) { this.assetsReady = true; this.needsRender = true; }
    });
    this.tick(performance.now());
  }

  setView(view: View) { this.view = view; this.needsRender = true; }

  resize() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.world.resize(height * this.renderer.getPixelRatio());
    this.composer.setSize(width, height);
    this.grain.uniforms.resolution.value.set(width * this.renderer.getPixelRatio(), height * this.renderer.getPixelRatio());
    this.camera.aspect = width / height;
    this.camera.fov = width / height < 0.8 ? 57 : 44;
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
  }

  private readonly handleVisibility = () => { this.lastTime = 0; this.needsRender = true; };
  private readonly handleContextLoss = (event: Event) => {
    event.preventDefault(); this.contextLost = true;
    cancelAnimationFrame(this.frame);
    this.container.dataset.renderState = 'error';
    this.container.dispatchEvent(new CustomEvent('renderfailure', { detail: '图形连接已暂停，请重新加载画境。' }));
  };

  private readonly tick = (timestamp: number) => {
    if (this.destroyed || this.contextLost) return;
    const delta = this.lastTime ? Math.min((timestamp - this.lastTime) / 1000, .12) : 0;
    this.lastTime = timestamp;
    if (!document.hidden) {
      this.playback.advance(delta);
      if (!this.needsRender && this.renderedTime === this.playback.time && this.renderedRevision === this.world.revision) {
        this.frame = requestAnimationFrame(this.tick);
        return;
      }
      const sample = sampleJourney(this.playback.time);
      if (this.view === 'journey') {
        this.camera.position.copy(sample.position); this.camera.lookAt(sample.target);
      } else if (this.view === 'still') {
        const still = sampleJourney(0);
        this.camera.position.copy(still.position); this.camera.lookAt(still.target);
      } else {
        this.camera.position.set(-105, 98, 125); this.camera.lookAt(new Vector3(0, 14, -65));
      }
      this.world.update(this.playback.time);
      this.composer.render();
      if (this.assetsReady) this.container.dataset.renderState = 'ready';
      this.container.dataset.environmentState = this.world.environmentState;
      this.renderedTime = this.playback.time;
      this.renderedRevision = this.world.revision;
      this.needsRender = false;
      this.onFrame(this.playback.time, sample.chapter);
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  dispose() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLoss);
    this.world.dispose();
    for (const pass of this.composer.passes) pass.dispose();
    this.composer.dispose(); this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
