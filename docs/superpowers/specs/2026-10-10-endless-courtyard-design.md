# 无垠庭院 / The Endless Courtyard

## Intent and approved direction

Create a TypeScript browser-based visual prototype inspired by the user's attached painting. Its sage-gray slabs, chalk-white walls, charcoal vertical masses, and ochre openings become a vast, impossible architectural landscape. The user approved this direction and asked to try it immediately to see the effect; proceed with an inline visual prototype.

## Experience

A restrained editorial frame surrounds a live 3D artwork. The first frame reveals monumental architecture and shallow reflective water. Floating lintels, repeating distant structures, painterly surfaces, drifting particles, and atmospheric perspective establish scale. An ochre opening anchors the composition. The painting is interpreted as geometry and materials, with no external images or music required.

A 48-second looping camera journey approaches over water, passes beside the ochre opening, rises to reveal the scene, orbits widely, and returns. Position and look direction join smoothly. Controls: play/pause, restart, scrub, camera viewpoints, speed, portrait framing, fullscreen, clean cinema view, and artwork information. Space toggles play, C toggles cinema, and Escape exits cinema. Reduced-motion preference starts paused.

## Architecture and limits

Vite + TypeScript + Three.js, no backend. Separate painterly materials, world construction, camera path, playback state, render lifecycle, and DOM controls. Cap pixel ratio and reflection resolution. Share repeated geometry and materials. Pause motion while hidden. Handle WebGL failure/context loss with a readable recovery message. The clean mode enables screen recording for later music editing; video-file export and audio are outside this first prototype.

## Verification

Run type check/build. Test camera continuity, finite positions throughout the loop, time wrapping, and pause/scrub behavior. Use Chromium WebGL via Playwright to exercise rendering and controls, portrait layout, and reduced-motion startup. Inspect screenshots at several camera positions and phone size. Save representative stills for review.
