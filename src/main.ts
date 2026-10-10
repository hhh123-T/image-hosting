import './style.css';
import { Experience, type View } from './scene/experience';
import { icon } from './icons';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app-shell">
    <header class="header">
      <a class="brand" href="./" aria-label="STILL 首页">
        <svg class="brand-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M5 30V7h8v23M23 30V7h8v23M5 7h26M13 17h10" stroke="currentColor" stroke-width="2"/><path d="M2 30h32" stroke="currentColor"/></svg>
        <span>STILL<span class="brand-dot">.</span></span>
        <span class="brand-caption">WORLDS WITHIN ART</span>
      </a>
      <nav aria-label="作品导航">
        <span class="nav-current"><span class="tiny-dot"></span> 画境</span>
        <button id="about" class="nav-button" aria-label="关于这件作品">创作手记 ${icon('arrow')}</button>
      </nav>
    </header>

    <div class="prelude">
      <span>从一幅画，走进另一个世界。</span>
      <span class="render-label"><span class="live-dot"></span> LIVE RENDER <span class="prelude-divider">/</span> STUDY 001</span>
    </div>

    <div class="canvas-frame">
      <section id="stage" class="stage" data-render-state="loading" aria-label="三维艺术场景">
        <div id="loading" class="loading"><span class="loading-mark"></span><span>正在展开画境</span><small>BUILDING A QUIET WORLD</small></div>
        <div class="scene-overlay scene-top">
          <span class="scene-index">EXPERIMENT <span>001</span></span>
          <button id="cinema" class="glass-button" aria-label="进入纯画面模式" title="纯画面模式 · C">${icon('cinema')}<span>纯画面</span></button>
        </div>
        <div class="scene-overlay scene-title">
          <span class="eyebrow">A WORLD BEYOND THE FRAME</span>
          <h1>无垠庭院<span class="title-period">。</span></h1>
          <p>THE ENDLESS COURTYARD</p>
          <div class="scene-description">在寂静里，空间没有尽头。</div>
        </div>
        <div class="scene-overlay scene-coordinate">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width=".5"/><path d="M24 2v44M2 24h44m17-5 10 10m0-10-10 10" stroke="currentColor" stroke-width=".6"/></svg>
          <span id="chapter">01 / 水上漫游</span>
          <span class="coordinate-note">SOMEWHERE, OUT OF TIME</span>
        </div>
      </section>
    </div>

    <div class="work-meta">
      <div class="work-caption"><span class="work-number">01 —</span><span>A quiet place, beyond the frame.</span></div>
      <div class="palette" aria-label="原画色彩：灰蓝、粉白、炭黑、赭红"><span>THE PALETTE</span><i style="--swatch:#909b9b"></i><i style="--swatch:#dcd7c9"></i><i style="--swatch:#353d41"></i><i style="--swatch:#ac6550"></i></div>
    </div>

    <section class="transport" aria-label="场景播放控制">
      <div class="playback-controls">
        <button id="play" class="play-button" aria-label="暂停运镜" title="播放 / 暂停 · Space">${icon('pause')}</button>
        <button id="restart" class="icon-button" aria-label="从头播放" title="从头播放">${icon('restart')}</button>
      </div>
      <div class="timeline-group">
        <span id="time" class="time-display">00:00</span>
        <input id="timeline" type="range" min="0" max="47.999" step="0.01" value="0" aria-label="镜头进度" />
        <span class="duration">00:48</span>
        <span class="loop-label">LOOP ${icon('restart')}</span>
      </div>
      <div class="view-controls">
        <label class="select-wrap view-select"><span class="select-label">视角</span><select id="view" aria-label="选择镜头视角"><option value="journey">自动运镜</option><option value="still">静观庭院</option><option value="aerial">云上俯瞰</option></select></label>
        <label class="select-wrap speed-select"><select id="speed" aria-label="运镜速度"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></label>
        <span class="control-divider"></span>
        <button id="aspect" class="text-button" aria-label="切换为竖屏画幅" title="切换横屏 / 竖屏">${icon('frame')}<span>9:16</span></button>
        <button id="fullscreen" class="icon-button" aria-label="进入全屏" title="全屏">${icon('expand')}</button>
      </div>
    </section>
    <footer class="footer"><span>AN EXPLORATION OF SPACE & STILLNESS</span><span class="keyboard-hint"><kbd>SPACE</kbd> 暂停 <span>·</span> <kbd>C</kbd> 纯画面</span><span>TAKE A BREATH. STAY A WHILE.</span></footer>
  </div>

  <button id="exit-cinema" class="cinema-exit glass-button" aria-label="退出纯画面模式" title="退出纯画面 · Esc">${icon('close')}<span>退出纯画面</span></button>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <dialog id="about-dialog" aria-labelledby="about-title">
    <div class="dialog-head"><span class="eyebrow">NOTES ON THE WORLD / 001</span><button id="close-about" class="icon-button" aria-label="关闭作品介绍">${icon('close')}</button></div>
    <h2 id="about-title">从画布，<br>走向无垠。</h2>
    <p class="dialog-intro">有些画里的空白，藏着一整个世界。</p>
    <p>灰蓝、粉白、炭黑与赭红化成有厚度的颜料粒子，聚拢成画境，再沿着风慢慢散开。墨尘、灰蓝晕染和大片墨团围绕镜头铺展，穿行、抬升和环绕都在同一幅无边界的画里。</p>
    <div class="material-notes"><div><i style="--swatch:#909b9b"></i><span>灰蓝</span><small>水上点阵与晕染</small></div><div><i style="--swatch:#dcd7c9"></i><span>粉白</span><small>颜料点群与雾层</small></div><div><i style="--swatch:#353d41"></i><span>炭黑</span><small>墨团与卷动轨迹</small></div><div><i style="--swatch:#ac6550"></i><span>赭红</span><small>色流与画境深处</small></div></div>
    <p>这是一件由真实三维几何与绘画肌理构成的空间习作。48 秒连续运镜，从水面漫游到云上俯瞰；也可以暂停，让时间停在你喜欢的地方。</p>
    <div class="dialog-foot"><span>STILL · A WORLD WITHIN ART</span><button id="return-world" class="text-button">回到画境 ${icon('arrow')}</button></div>
  </dialog>
`;

const stage = document.querySelector<HTMLElement>('#stage')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const timeline = document.querySelector<HTMLInputElement>('#timeline')!;
const timeLabel = document.querySelector('#time')!;
const chapterLabel = document.querySelector('#chapter')!;
const dialog = document.querySelector<HTMLDialogElement>('#about-dialog')!;
let experience: Experience | undefined;
let toastTimer = 0;
let cinemaTimer = 0;
let scrubbing = false;
let resumeAfterScrub = false;

function toast(text: string) {
  const element = document.querySelector<HTMLElement>('#toast')!;
  element.textContent = text; element.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove('visible'), 2400);
}

function syncPlayButton() {
  if (!experience) return;
  const playing = experience.playback.playing;
  play.innerHTML = icon(playing ? 'pause' : 'play');
  play.setAttribute('aria-label', playing ? '暂停运镜' : '播放运镜');
  play.setAttribute('aria-pressed', String(playing));
}

function togglePlay() {
  if (!experience) return;
  experience.playback.playing = !experience.playback.playing;
  syncPlayButton();
}

function showCinemaExit() {
  document.body.classList.add('show-exit');
  window.clearTimeout(cinemaTimer);
  cinemaTimer = window.setTimeout(() => document.body.classList.remove('show-exit'), 2300);
}

function toggleCinema(force?: boolean) {
  const entering = force ?? !document.body.classList.contains('cinema');
  document.body.classList.toggle('cinema', entering);
  if (entering) {
    showCinemaExit();
    stage.tabIndex = -1;
    stage.focus({ preventScroll: true });
  } else {
    document.querySelector<HTMLButtonElement>('#cinema')!.focus({ preventScroll: true });
  }
}

function reportFailure(message: string) {
  stage.dataset.renderState = 'error';
  document.querySelector('#loading')?.remove();
  const error = document.createElement('div');
  error.className = 'render-error'; error.setAttribute('role', 'alert');
  const heading = document.createElement('h2'); heading.textContent = '画境暂时无法展开';
  const description = document.createElement('p'); description.textContent = message;
  const retry = document.createElement('button'); retry.className = 'retry-button';
  retry.textContent = '重新加载'; retry.addEventListener('click', () => location.reload());
  error.append(heading, description, retry); stage.append(error);
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('.transport button, .transport input, .transport select').forEach(control => { control.disabled = true; });
}

stage.addEventListener('renderfailure', event => reportFailure((event as CustomEvent<string>).detail));
// Let the loading screen paint before compiling shaders and constructing the world.
requestAnimationFrame(() => {
  try {
    experience = new Experience(stage, (time, chapter) => {
      if (!scrubbing) timeline.value = time.toFixed(2);
      timeline.style.setProperty('--progress', `${time / 48 * 100}%`);
      const seconds = Math.floor(time);
      timeLabel.textContent = `00:${String(seconds).padStart(2, '0')}`;
      chapterLabel.textContent = chapter;
    });
    document.querySelector('#loading')?.remove();
    syncPlayButton();
  } catch (error) {
    console.error('Unable to render courtyard:', error);
    reportFailure('请使用支持 WebGL 2 的浏览器，并开启硬件加速后重试。');
  }
});

play.addEventListener('click', togglePlay);
document.querySelector('#restart')!.addEventListener('click', () => {
  experience?.playback.reset(); timeline.value = '0';
  timeline.style.setProperty('--progress', '0%'); timeLabel.textContent = '00:00';
});
timeline.addEventListener('pointerdown', () => {
  if (!experience || scrubbing) return;
  scrubbing = true;
  resumeAfterScrub = experience.playback.playing;
  experience.playback.playing = false;
  syncPlayButton();
});
function finishScrub() {
  if (!scrubbing) return;
  scrubbing = false;
  if (experience) experience.playback.playing = resumeAfterScrub;
  syncPlayButton();
}
window.addEventListener('pointerup', finishScrub);
window.addEventListener('pointercancel', finishScrub);
window.addEventListener('blur', finishScrub);
timeline.addEventListener('input', () => { experience?.playback.seek(Number(timeline.value)); });
document.querySelector<HTMLSelectElement>('#view')!.addEventListener('change', event => {
  const select = event.target as HTMLSelectElement;
  experience?.setView(select.value as View);
  toast(select.selectedOptions[0].textContent || '');
});
document.querySelector<HTMLSelectElement>('#speed')!.addEventListener('change', event => {
  if (experience) experience.playback.speed = Number((event.target as HTMLSelectElement).value);
});
document.querySelector<HTMLButtonElement>('#aspect')!.addEventListener('click', event => {
  const portrait = stage.classList.toggle('portrait');
  const button = event.currentTarget as HTMLButtonElement;
  button.setAttribute('aria-label', portrait ? '切换为横屏画幅' : '切换为竖屏画幅');
  button.setAttribute('aria-pressed', String(portrait));
  button.querySelector('span')!.textContent = portrait ? '横屏' : '9:16';
  toast(portrait ? '竖屏画幅 · 9:16' : '横屏画幅');
});
document.querySelector('#cinema')!.addEventListener('click', () => toggleCinema());
document.querySelector('#exit-cinema')!.addEventListener('click', () => toggleCinema(false));
document.addEventListener('pointermove', () => {
  if (document.body.classList.contains('cinema')) showCinemaExit();
});
document.addEventListener('pointerdown', () => {
  if (document.body.classList.contains('cinema')) showCinemaExit();
});
document.querySelector('#about')!.addEventListener('click', () => dialog.showModal());
document.querySelector('#close-about')!.addEventListener('click', () => dialog.close());
document.querySelector('#return-world')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
document.querySelector('#fullscreen')!.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else toast('此浏览器不支持全屏，可使用纯画面模式。');
  } catch { toast('此浏览器暂未允许全屏，可使用纯画面模式。'); }
});
document.addEventListener('fullscreenchange', () => {
  document.querySelector('#fullscreen')!.setAttribute('aria-label', document.fullscreenElement ? '退出全屏' : '进入全屏');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !dialog.open && document.body.classList.contains('cinema')) { toggleCinema(false); return; }
  if (dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof HTMLElement && (/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) || event.target.isContentEditable)) return;
  if (event.key.toLowerCase() === 'c') { toggleCinema(); return; }
  if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); togglePlay(); }
});

if (import.meta.hot) import.meta.hot.dispose(() => experience?.dispose());
