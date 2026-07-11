/**
 * Generate a distinct sunshine currency icon (not a star).
 * Stars stay for ratings; this sun is for Sunshine Points.
 */
export function generateSunshineTexture(scene, key = 'ui_sunshine') {
  if (!scene?.textures || scene.textures.exists(key)) return key;

  const size = 64;
  const cx = size / 2;
  const cy = size / 2;
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });

  // Rays
  gfx.fillStyle(0xffc107, 1);
  const rayLen = 28;
  const rayW = 5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * rayLen;
    const y2 = cy + Math.sin(a) * rayLen;
    gfx.fillTriangle(
      cx + Math.cos(a + Math.PI / 2) * rayW * 0.35,
      cy + Math.sin(a + Math.PI / 2) * rayW * 0.35,
      cx + Math.cos(a - Math.PI / 2) * rayW * 0.35,
      cy + Math.sin(a - Math.PI / 2) * rayW * 0.35,
      x2,
      y2,
    );
  }

  // Disk
  gfx.fillStyle(0xffe135, 1);
  gfx.fillCircle(cx, cy, 14);
  gfx.fillStyle(0xfff59d, 1);
  gfx.fillCircle(cx - 3, cy - 3, 6);

  gfx.generateTexture(key, size, size);
  gfx.destroy();
  return key;
}

/** Apply NEAREST filtering to scaled pixel-art textures after load. */
export function applyNearestFilterToTextures(scene) {
  const textures = scene?.textures;
  if (!textures?.getTextureKeys) return;

  const nearest = Phaser.Textures?.FilterMode?.NEAREST;
  if (nearest == null) return;

  for (const key of textures.getTextureKeys()) {
    if (key === '__DEFAULT' || key === '__MISSING' || key === '__WHITE') continue;
    const tex = textures.get(key);
    if (tex?.setFilter) tex.setFilter(nearest);
  }
}
