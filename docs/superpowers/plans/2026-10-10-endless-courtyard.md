# Endless Courtyard Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline. Steps use checkbox syntax for tracking.

**Goal:** Deliver a visually compelling TypeScript 3D interpretation of the supplied painting with a 48-second cinematic camera loop.

**Architecture:** Vite with Three.js and lightweight DOM controls. Separate painterly materials, architecture, camera path, playback, rendering, and interface.

**Tech Stack:** TypeScript, Three.js, Vite, Vitest, Playwright, Chromium.

**Spec:** `docs/superpowers/specs/2026-10-10-endless-courtyard-design.md`

## Global Constraints

- Camera loop lasts 48 seconds and joins continuously.
- Retain sage-gray, chalk-white, charcoal, and ochre painting language.
- No backend, external image assets, or music required.
- Respect reduced motion, cap resolution, and support phones.
- Use the existing isolated cloud checkout, without another worktree.

## Review Focus

- Smooth camera position and look direction at the seam.
- Pausing/scrubbing keeps displayed time and render synchronized.
- Phone projection updates; controls remain usable.
- Reduced motion/hidden tabs stop automatic advancement.
- WebGL failure shows a readable recovery message.

### Task 1: Camera and playback foundations

**Files:** `package.json`, `tsconfig.json`, `index.html`, `src/scene/camera-path.ts`, `src/playback.ts`, `tests/camera.test.ts`, `tests/playback.test.ts`.

**Interfaces:** `sampleJourney(seconds): {position: Vector3; target: Vector3; chapter: string}`; `Playback` exposes `time`, `playing`, `speed`, `advance(delta)`, `seek(seconds)`, `reset()`.

- [x] Test loop continuity, finite samples, pause, speed, wrapping, seek, reset.
- [x] Install dependencies and confirm missing-implementation failures.
- [x] Implement periodic spline and playback state; run `npm test`.

### Task 2: Rendered painting-world prototype

**Files:** `src/scene/materials.ts`, `src/scene/world.ts`, `src/scene/experience.ts`, `src/main.ts`, `src/style.css`, `tests/experience.spec.ts`, `playwright.config.ts`.

**Interfaces:** `Experience(container, onFrame)` exposes `playback`, `setView`, `resize`, `dispose`. World construction returns scene objects and animation update.

- [x] Write browser checks for visible canvas, time advancement/pause, restart, framing, cinema, reduced motion.
- [x] Confirm checks fail before app implementation.
- [x] Build textures, architecture, reflective water, haze, camera movement and controls.
- [x] Run browser checks; inspect wide/portrait screenshots at several times.

### Task 3: Verify and deliver

**Files:** `README.md`, saved validation stills, environment setup draft.

- [x] Run `npm test`, `npm run test:e2e`, `npm run build`.
- [x] Document `npm ci` and `npm run dev -- --host 0.0.0.0`.
- [x] Save tested installation/start instructions for cloud environment.
- [x] Review final changes and deliver visual evidence with prototype limitations.
