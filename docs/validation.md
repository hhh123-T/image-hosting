# Prototype validation — 2026-10-10

- Frozen `npm ci` succeeds using `/workspace/.cache/npm`; the normal home cache is outside this cloud environment's writable roots.
- `npm test`: 7/7 passing (camera seam, velocity, finite/above-water samples, wrapping, pause, speed, scrub bounds, reset).
- `npm run test:e2e`: 7/7 passing in Chromium with actual software WebGL. Checks include rendering without console/page errors, playback/pause/restart, portrait aspect, cinema/info controls, keyboard shortcuts, scrub hold/cancellation, missing-WebGL recovery, full-route collision checks, reduced motion, and phone layout.
- Camera collision check: 960 sampled points, 0 collisions with box architecture plus a 0.45-unit margin.
- `npm run build`: TypeScript checking and production build pass. Three.js makes the bundled application approximately 576 kB (147 kB gzip); Vite gives its bundle-size advisory.
- Desktop, phone, water-level, portal and elevated screenshots were inspected. The camera was pulled back and the ring moved to reveal more spatial depth and avoid foreground obstruction.
- Fresh independent code review identified two interaction problems. Both were reproduced with failing browser tests and fixed: dragging now holds selected time; Space after entering cinema pauses instead of activating Exit. No deferred review findings.
- Paused/reduced-motion scenes reuse the rendered frame until time, view or dimensions change. This also makes deterministic video sampling efficient on software WebGL.
- `install_script` and `start_skill` were saved successfully to the environment draft. This saves reusable instructions; it does not publish the environment or establish validation in a new task.
- The production build was served and rendered into a 48-second silent portrait MP4, 540×960 at 12 fps. Export samples the actual scene at fixed times, so slower cloud rendering does not alter the video duration or camera speed.

## Decisions

This is a procedural 3D interpretation of the supplied painting, approved for immediate prototype evaluation, rather than a pixel-exact reconstruction. If the visual direction needs changing, the geometry and camera remain editable in TypeScript. The cloud npm cache uses a writable workspace location; local installations can use their default cache.

## Prototype boundaries

No music or in-browser video export button is included. The FFmpeg/browser script produces a silent 48-second portrait preview, with resolution and frame rate configurable for a slower, higher-quality export. Performance on hardware-accelerated user devices has not been measured in this CPU-rendered cloud environment.
