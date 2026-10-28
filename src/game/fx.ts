import Phaser from 'phaser';

// 共用的打擊感特效：像素粒子、跳字、頓幀、閃光。MainScene 與其他場景共用。

export const FONT = '"Pixelify Sans", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
// 數字（血量、傷害、金幣、Combo）用字形最清楚的像素字型
export const NUM_FONT = '"Press Start 2P", monospace';

// 外框粗細預設隨字級調整，小字才不會被外框吃掉
export const textStyle = (size: number, color = '#ffffff', stroke = Math.max(3, Math.round(size / 5))): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  color,
  stroke: '#1a1226',
  strokeThickness: stroke,
  fontStyle: 'bold',
  shadow: { offsetX: 0, offsetY: Math.max(2, Math.round(size / 8)), color: '#1a1226', blur: 0, fill: true, stroke: true },
});

// 一般說明文字（含數字）用系統無襯線字型，避免像素字的數字難以辨認
export const labelStyle = (size: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle => ({
  ...textStyle(size, color),
  fontFamily: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif',
});

export const numStyle = (size: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle => ({
  ...textStyle(size, color),
  fontFamily: NUM_FONT,
  fontStyle: 'normal',
});

// 頓幀（hit stop）：命中瞬間讓所有補間動畫幾乎停住，製造「打中了」的重量感
export function hitStop(scene: Phaser.Scene, ms: number) {
  scene.tweens.timeScale = 0.05;
  window.setTimeout(() => { if (scene.sys.isActive()) scene.tweens.timeScale = 1; }, ms);
}

// 慢動作：擊倒時短暫放慢
export function slowMo(scene: Phaser.Scene, ms: number, scale = 0.3) {
  scene.tweens.timeScale = scale;
  window.setTimeout(() => { if (scene.sys.isActive()) scene.tweens.timeScale = 1; }, ms);
}

// 像素方塊粒子：往四周噴出並受重力落下
export function burst(scene: Phaser.Scene, x: number, y: number, colors: number[], count: number, opts: { speed?: number; size?: number; gravity?: number; up?: boolean } = {}) {
  const { speed = 160, size = 8, gravity = 260, up = false } = opts;
  for (let i = 0; i < count; i++) {
    const angle = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    const s = Math.round(size * (0.5 + Math.random() * 0.7) / 2) * 2;
    const p = scene.add.rectangle(x, y, s, s, colors[i % colors.length]).setDepth(60);
    const dur = 420 + Math.random() * 380;
    const dx = Math.cos(angle) * v * (dur / 1000);
    const dy = Math.sin(angle) * v * (dur / 1000);
    scene.tweens.add({
      targets: p, x: x + dx, duration: dur, ease: 'Quad.easeOut',
    });
    scene.tweens.add({
      targets: p, y: y + dy + gravity * (dur / 1000) ** 2, duration: dur, ease: 'Quad.easeIn',
    });
    scene.tweens.add({ targets: p, alpha: 0, delay: dur * 0.6, duration: dur * 0.4, onComplete: () => p.destroy() });
  }
}

// 跳字：先放大彈出再往上飄散
export function popText(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color: string, opts: { rise?: number; dur?: number; depth?: number; numeric?: boolean } = {}) {
  const { rise = 70, dur = 900, depth = 70, numeric = false } = opts;
  // 數字用 Press Start 2P（字身較寬，縮小一點）
  const style = numeric ? numStyle(Math.round(size * 0.7), color) : textStyle(size, color);
  const t = scene.add.text(x, y, text, style).setOrigin(0.5).setDepth(depth).setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1.15, duration: 110, ease: 'Back.easeOut', yoyo: false });
  scene.tweens.add({ targets: t, scale: 1, delay: 110, duration: 90 });
  scene.tweens.add({ targets: t, y: y - rise, alpha: 0, delay: dur * 0.45, duration: dur * 0.55, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  return t;
}

// 系統設定「減少動態效果」時，震動與閃光減弱
export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// 斬擊軌跡：一道快速張開又消失的弧線；combo 高時換顏色、轉角度疊成十字斬
export function slashArc(scene: Phaser.Scene, x: number, y: number, big = false, color = 0xfff3a0, angle = -15) {
  const g = scene.add.graphics().setDepth(55);
  const r = big ? 110 : 80;
  const start = Phaser.Math.DegToRad(-70);
  const end = Phaser.Math.DegToRad(60);
  g.lineStyle(big ? 18 : 12, 0xffffff, 1);
  g.beginPath();
  g.arc(0, 0, r, start, end);
  g.strokePath();
  g.lineStyle(big ? 8 : 6, color, 1);
  g.beginPath();
  g.arc(0, 0, r - 10, start + 0.2, end - 0.1);
  g.strokePath();
  g.setPosition(x - r * 0.4, y).setScale(0.6).setAngle(angle);
  scene.tweens.add({ targets: g, scale: 1.1, alpha: 0, duration: 200, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
}

// 命中震波環：從命中點往外擴散的圓環
export function shockwave(scene: Phaser.Scene, x: number, y: number, color: number, radius = 120, thickness = 8) {
  const ring = scene.add.circle(x, y, 20).setStrokeStyle(thickness, color, 1).setDepth(54);
  scene.tweens.add({ targets: ring, radius, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
}

// 能量往中心收聚：蓄力時的小光點
export function gather(scene: Phaser.Scene, x: number, y: number, color: number, count: number, radius = 70) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = radius * (0.7 + Math.random() * 0.5);
    const p = scene.add.rectangle(x + Math.cos(a) * d, y + Math.sin(a) * d, 4, 4, color).setDepth(31);
    scene.tweens.add({ targets: p, x, y, alpha: 0.2, duration: 200 + Math.random() * 120, ease: 'Quad.easeIn', onComplete: () => p.destroy() });
  }
}

// 衝刺殘影：在角色目前位置留下一個漸淡的半透明分身
export function afterimage(scene: Phaser.Scene, src: Phaser.GameObjects.Image, x: number, y: number, tint: number, delay = 0) {
  scene.time.delayedCall(delay, () => {
    const img = scene.add.image(x, y, src.texture.key).setOrigin(src.originX, src.originY).setScale(src.scaleX, src.scaleY)
      .setTint(tint).setTintMode(Phaser.TintModes.FILL).setAlpha(0.55).setDepth(19);
    scene.tweens.add({ targets: img, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => img.destroy() });
  });
}

// 天降雷擊：鋸齒狀的閃電打在命中點
export function lightning(scene: Phaser.Scene, x: number, y: number, color: number) {
  const g = scene.add.graphics().setDepth(57);
  const draw = (w: number, c: number) => {
    g.lineStyle(w, c, 1);
    g.beginPath();
    let px = x + Phaser.Math.Between(-30, 30);
    let py = 0;
    g.moveTo(px, py);
    while (py < y) {
      py = Math.min(y, py + Phaser.Math.Between(24, 44));
      px = py === y ? x : px + Phaser.Math.Between(-26, 26);
      g.lineTo(px, py);
    }
    g.strokePath();
  };
  draw(10, color);
  draw(4, 0xffffff);
  scene.tweens.add({ targets: g, alpha: 0, duration: 260, delay: 60, onComplete: () => g.destroy() });
}

// 光柱：從天而降的一道光，最高等級的 combo 才有
export function pillar(scene: Phaser.Scene, x: number, groundY: number, color: number) {
  const beam = scene.add.rectangle(x, groundY, 90, groundY * 2, color, 0.55).setOrigin(0.5, 1).setDepth(53).setScale(0.1, 1);
  const core = scene.add.rectangle(x, groundY, 30, groundY * 2, 0xffffff, 0.8).setOrigin(0.5, 1).setDepth(53).setScale(0.1, 1);
  scene.tweens.add({ targets: [beam, core], scaleX: 1, duration: 120, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: [beam, core], scaleX: 0, alpha: 0, delay: 260, duration: 300, ease: 'Quad.easeIn', onComplete: () => { beam.destroy(); core.destroy(); } });
}

// 全畫面色閃（受傷紅光、Boss 登場等）
export function screenFlash(scene: Phaser.Scene, color: number, alpha: number, dur: number) {
  const { width, height } = scene.scale;
  const r = scene.add.rectangle(0, 0, width, height, color, alpha).setOrigin(0).setDepth(90);
  scene.tweens.add({ targets: r, alpha: 0, duration: dur, onComplete: () => r.destroy() });
}

// 像素風血條：外框、底色、延遲消退的白色殘影（格鬥遊戲常見）、主血條
export class PixelBar {
  private g: Phaser.GameObjects.Graphics;
  private shown = 1;
  private ghost = 1;
  private ghostTween?: Phaser.Tweens.Tween;
  private x: number;
  private y: number;
  private w: number;
  private h: number;
  private alignRight: boolean;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, alignRight = false) {
    this.scene = scene;
    this.x = x; this.y = y; this.w = w; this.h = h; this.alignRight = alignRight;
    this.g = scene.add.graphics().setDepth(80);
    this.draw();
  }

  set(ratio: number, instant = false) {
    const r = Phaser.Math.Clamp(ratio, 0, 1);
    const wasHigher = r < this.shown;
    this.shown = r;
    this.ghostTween?.stop();
    if (instant || !wasHigher) {
      this.ghost = r;
      this.draw();
      return;
    }
    this.draw();
    const obj = { v: this.ghost };
    this.ghostTween = this.scene.tweens.add({
      targets: obj, v: r, delay: 350, duration: 450, ease: 'Quad.easeIn',
      onUpdate: () => { this.ghost = obj.v; this.draw(); },
    });
  }

  private draw() {
    const { g, x, y, w, h } = this;
    g.clear();
    g.fillStyle(0x1a1226, 1).fillRect(x - 4, y - 4, w + 8, h + 8);
    g.fillStyle(0x3b2d4f, 1).fillRect(x, y, w, h);
    const color = this.shown > 0.5 ? 0x5fd36b : this.shown > 0.25 ? 0xffcd4b : 0xff5a6e;
    const gw = Math.round(w * this.ghost);
    const sw = Math.round(w * this.shown);
    const gx = this.alignRight ? x + w - gw : x;
    const sx = this.alignRight ? x + w - sw : x;
    g.fillStyle(0xffffff, 0.9).fillRect(gx, y, gw, h);
    g.fillStyle(color, 1).fillRect(sx, y, sw, h);
    // 上緣高光，讓血條有立體感
    g.fillStyle(0xffffff, 0.35).fillRect(sx, y, sw, 3);
  }

  destroy() { this.g.destroy(); }
}
