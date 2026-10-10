import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three';

export function seededRandom(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Paint is attached to every face, so turning the camera reveals painted sides.
function paintedSurface(seed: number, palette: string[], vertical = false) {
  const random = seededRandom(seed), size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = palette[0]; ctx.fillRect(0, 0, size, size);
  if (vertical) { ctx.translate(size, 0); ctx.rotate(Math.PI / 2); }
  for (let i = 0; i < 600; i++) {
    const x = random() * size, y = random() * size;
    const length = 25 + random() * 265, width = 3 + random() * 29;
    ctx.fillStyle = palette[1 + Math.floor(random() * (palette.length - 2))];
    ctx.globalAlpha = .12 + random() * .5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length * .26, y - random() * width * .3);
    ctx.lineTo(x + length, y + width * .15);
    ctx.lineTo(x + length * .91, y + width * .77);
    ctx.lineTo(x + length * .48, y + width);
    ctx.lineTo(x - random() * 6, y + width * .6);
    ctx.closePath(); ctx.fill();
    for (let j = 0; j < 3; j++) {
      ctx.globalAlpha = .08 + random() * .18;
      ctx.strokeStyle = palette[j % palette.length];
      ctx.lineWidth = .45 + random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x + random() * 9, y + width * j / 5);
      ctx.bezierCurveTo(x + length * .3, y + width * j / 5 - 2,
        x + length * .8, y + width * j / 5 + 2, x + length, y + width * j / 5);
      ctx.stroke();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const image = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const weave = Math.cos(x * Math.PI) * 1.5 + Math.cos(y * Math.PI) * 1.5;
    const grain = (random() - .5) * 18 + weave;
    for (let channel = 0; channel < 3; channel++) image.data[i + channel] += grain;
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 90; i++) {
    const edge = i % 4;
    const x = edge < 2 ? (edge ? size - random() * 20 : random() * 20) : random() * size;
    const y = edge >= 2 ? (edge === 2 ? random() * 18 : size - random() * 18) : random() * size;
    ctx.strokeStyle = palette[palette.length - 1]; ctx.globalAlpha = .08 + random() * .2;
    ctx.lineWidth = 1 + random() * 6;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (edge < 2 ? random() * 4 : 20 + random() * 70), y + (edge < 2 ? 30 + random() * 100 : random() * 3));
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createMaterials() {
  const material = (seed: number, palette: string[], vertical = false, bumpScale = .16) => {
    const map = paintedSurface(seed, palette, vertical);
    return new MeshStandardMaterial({ color: '#ffffff', map, bumpMap: map,
      bumpScale, roughness: 1, metalness: 0 });
  };
  const materials = {
    chalk: material(71, ['#d9d9d2', '#eeeae0', '#c6cac7', '#f4f0e6', '#b1b8b7', '#626b6b']),
    ivory: material(81, ['#d4d5cd', '#e9e6db', '#bec4c1', '#f1eee2', '#9ea8a7', '#636b6b']),
    sage: material(91, ['#8f9b9b', '#a8b0ad', '#727f83', '#bbc2bb', '#848b95', '#424b50']),
    dark: material(101, ['#424b50', '#5e6a6d', '#343d42', '#788281', '#505b61', '#222a2f'], true, .22),
    ochre: material(111, ['#ac6951', '#c38265', '#935847', '#cc8970', '#a26a59', '#35373b'], true, .12),
    copper: material(121, ['#755345', '#9a6751', '#55514b', '#b38064', '#64534d', '#303438'], true),
    stone: material(131, ['#9baba9', '#b8bfba', '#869798', '#c9cac1', '#828d96', '#505b60']),
  };
  // Painted whites and reds retain pigment in shade, as they do on the canvas.
  for (const paint of [materials.chalk, materials.ivory, materials.ochre]) {
    paint.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
        'outgoingLight = mix(outgoingLight, diffuseColor.rgb, .35);\n#include <opaque_fragment>');
    };
  }
  return materials;
}
export type ArtMaterials = ReturnType<typeof createMaterials>;

export async function loadPaintAtlas(materials: ArtMaterials, disposed: () => boolean) {
  try {
    const atlas = await new TextureLoader().loadAsync('/textures/paint-atlas.png');
    if (disposed()) { atlas.dispose(); return null; }
    atlas.colorSpace = SRGBColorSpace;
    const regions: [keyof ArtMaterials, number, number][] = [
      ['chalk', 0, .5], ['ivory', 0, .5], ['sage', .5, .5],
      ['dark', 0, 0], ['ochre', .5, 0], ['copper', .5, 0], ['stone', .5, .5],
    ];
    const tiles = new Map<string, CanvasTexture>();
    for (const [name, x, y] of regions) {
      const key = `${x}/${y}`;
      let map = tiles.get(key);
      if (!map) {
        // Separate GPU images keep wrapping and mipmaps within one pigment.
        const tile = document.createElement('canvas');
        tile.width = atlas.image.width / 2; tile.height = atlas.image.height / 2;
        tile.getContext('2d')!.drawImage(atlas.image,
          x * atlas.image.width, (.5 - y) * atlas.image.height,
          tile.width, tile.height, 0, 0, tile.width, tile.height);
        map = new CanvasTexture(tile);
        map.colorSpace = SRGBColorSpace; map.anisotropy = 4;
        map.wrapS = map.wrapT = RepeatWrapping;
        tiles.set(key, map);
      }
      const material = materials[name]; material.map?.dispose();
      material.map = material.bumpMap = map;
      material.bumpScale = name === 'dark' ? .14 : .09;
      material.needsUpdate = true;
    }
    materials.copper.color.set('#b9a99e');
    materials.stone.color.set('#d4dbd9');
    atlas.dispose();
    return materials.sage.map;
  } catch {
    // Keep the local procedural pigment if a texture cannot be loaded.
    console.warn('Paint atlas unavailable; using procedural paint.');
    return null;
  }
}
