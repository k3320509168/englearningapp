// Combo 大招的畫面特效：用幾個基本元素（劍氣、天降物、魔法陣、光束、箭、羽翼、裂空）組合出各職業五個等級的大招。
// 每個大招約 0.6～1 秒，和一般攻擊同時播放，不拖慢答題節奏。
import Phaser from 'phaser';
import type { ClassId } from './character';
import { burst, screenFlash, shake, shockwave, pillar, lightning, reducedMotion } from './fx';

export interface UltimateCtx {
  scene: Phaser.Scene;
  from: { x: number; y: number };  // 出手隊員
  to: { x: number; y: number };    // 怪物中心
  ground: number;                  // 地面 y
  color: number;                   // 屬性主色
  light: number;                   // 屬性亮色
}

const DEPTH = 60;

// 月牙劍氣：一道（或數道）弧形劍氣飛向怪物
function crescent(c: UltimateCtx, count = 1, size = 1) {
  for (let i = 0; i < count; i++) {
    const g = c.scene.add.graphics().setDepth(DEPTH);
    g.lineStyle(10 * size, c.light, 1).beginPath().arc(0, 0, 46 * size, -1.1, 1.1).strokePath();
    g.lineStyle(4 * size, 0xffffff, 1).beginPath().arc(0, 0, 46 * size, -0.9, 0.9).strokePath();
    g.setPosition(c.from.x + 40, c.from.y - 20 + (i - (count - 1) / 2) * 34);
    c.scene.tweens.add({
      targets: g, x: c.to.x, y: c.to.y + (i - (count - 1) / 2) * 20, duration: 260, delay: i * 70, ease: 'Quad.easeIn',
      onComplete: () => { burst(c.scene, c.to.x, c.to.y, [c.light, 0xffffff], 10, { speed: 220 }); g.destroy(); },
    });
  }
}

// 天降物：從天而降砸在怪物身上（巨劍、隕石、巨錘、聖光）
function fallFromSky(c: UltimateCtx, draw: (g: Phaser.GameObjects.Graphics) => void, size = 1, delay = 0) {
  const g = c.scene.add.graphics().setDepth(DEPTH);
  draw(g);
  g.setScale(size).setPosition(c.to.x, -160);
  c.scene.tweens.add({
    targets: g, y: c.to.y, duration: 320, delay, ease: 'Quad.easeIn',
    onComplete: () => {
      shockwave(c.scene, c.to.x, c.ground - 10, c.light, 160 * size, 8);
      burst(c.scene, c.to.x, c.ground - 20, [c.color, c.light, 0xffffff], Math.round(24 * size), { speed: 300, up: true });
      if (!reducedMotion()) shake(c.scene, 260, 0.02);
      c.scene.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    },
  });
}

const bigSword = (c: UltimateCtx) => (g: Phaser.GameObjects.Graphics) => {
  g.fillStyle(0xffffff, 1).fillRect(-12, -150, 24, 150);
  g.fillStyle(c.light, 1).fillRect(-6, -150, 12, 150);
  g.fillStyle(c.color, 1).fillTriangle(-12, 0, 12, 0, 0, 30);
  g.fillStyle(0xffcd4b, 1).fillRect(-40, -160, 80, 14).fillRect(-6, -200, 12, 44);
};
const meteor = (c: UltimateCtx) => (g: Phaser.GameObjects.Graphics) => {
  g.fillStyle(c.color, 0.5).fillCircle(0, -40, 70);
  g.fillStyle(c.color, 1).fillCircle(0, 0, 48);
  g.fillStyle(c.light, 1).fillCircle(-12, -12, 22);
};
const hammer = (c: UltimateCtx) => (g: Phaser.GameObjects.Graphics) => {
  g.fillStyle(0x9a6a3a, 1).fillRect(-8, -200, 16, 160);
  g.fillStyle(0xdfe6f0, 1).fillRect(-70, -60, 140, 70);
  g.fillStyle(c.light, 1).fillRect(-70, -60, 140, 14);
};

// 魔法陣：腳下展開旋轉的法陣，再爆開
function magicCircle(c: UltimateCtx, size = 1) {
  const g = c.scene.add.graphics().setDepth(DEPTH - 1);
  g.lineStyle(4, c.light, 1).strokeCircle(0, 0, 90).strokeCircle(0, 0, 64);
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    g.lineBetween(Math.cos(a) * 90, Math.sin(a) * 90, Math.cos(a + Math.PI * 2 / 3) * 90, Math.sin(a + Math.PI * 2 / 3) * 90);
  }
  g.setPosition(c.to.x, c.ground - 6).setScale(0, 0);
  c.scene.tweens.add({ targets: g, scaleX: size, scaleY: size * 0.35, duration: 220, ease: 'Back.easeOut' });
  // 平躺的法陣不能整個旋轉（會轉成直立），改成呼吸般的脈動
  c.scene.tweens.add({ targets: g, scaleX: size * 1.1, scaleY: size * 0.4, delay: 220, duration: 220, yoyo: true, repeat: 1 });
  c.scene.tweens.add({ targets: g, alpha: 0, delay: 650, duration: 300, onComplete: () => g.destroy() });
  c.scene.time.delayedCall(380, () => pillar(c.scene, c.to.x, c.ground, c.light));
}

// 光束：從出手隊員直射怪物（太陽神之箭、銀河貫穿）
function beam(c: UltimateCtx, width = 18, delay = 0, color = c.light) {
  c.scene.time.delayedCall(delay, () => {
    const len = Phaser.Math.Distance.Between(c.from.x, c.from.y, c.to.x + 400, c.to.y);
    const r = c.scene.add.rectangle(c.from.x, c.from.y - 30, len, width, color, 0.95).setOrigin(0, 0.5).setDepth(DEPTH).setScale(0, 1);
    const core = c.scene.add.rectangle(c.from.x, c.from.y - 30, len, width / 3, 0xffffff, 1).setOrigin(0, 0.5).setDepth(DEPTH + 1).setScale(0, 1);
    c.scene.tweens.add({ targets: [r, core], scaleX: 1, duration: 140, ease: 'Quad.easeOut' });
    c.scene.tweens.add({ targets: [r, core], scaleY: 0, alpha: 0, delay: 360, duration: 240, onComplete: () => { r.destroy(); core.destroy(); } });
  });
}

// 箭：數支箭飛向怪物（三連箭），或從天而降（箭雨、流星箭）
function arrows(c: UltimateCtx, count: number, fromSky = false, size = 1) {
  for (let i = 0; i < count; i++) {
    const a = c.scene.add.rectangle(0, 0, 46 * size, 5 * size, c.light).setDepth(DEPTH);
    const tip = c.scene.add.triangle(0, 0, 0, -6 * size, 0, 6 * size, 12 * size, 0, 0xffffff).setDepth(DEPTH);
    const startX = fromSky ? c.to.x - 160 + Math.random() * 260 : c.from.x + 30;
    const startY = fromSky ? -40 - Math.random() * 120 : c.from.y - 40 + (i - count / 2) * 14;
    const endX = c.to.x - 40 + Math.random() * 80;
    const endY = fromSky ? c.ground - 10 : c.to.y + (i - count / 2) * 10;
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    [a, tip].forEach(o => o.setPosition(startX, startY).setRotation(angle));
    c.scene.tweens.add({
      targets: [a, tip], x: endX, y: endY, duration: fromSky ? 300 : 220, delay: i * (fromSky ? 25 : 60), ease: 'Quad.easeIn',
      onComplete: () => { burst(c.scene, endX, endY, [c.light, 0xffffff], 4, { speed: 140 }); a.destroy(); tip.destroy(); },
    });
  }
}

// 法球連射：數顆屬性法球飛向怪物
function orbs(c: UltimateCtx, count: number, size = 1) {
  for (let i = 0; i < count; i++) {
    const o = c.scene.add.circle(c.from.x + 20, c.from.y - 50, 12 * size, c.color).setStrokeStyle(4, c.light).setDepth(DEPTH);
    const midY = c.from.y - 160 - Math.random() * 80;
    c.scene.tweens.add({ targets: o, x: c.to.x, duration: 380, delay: i * 70, ease: 'Linear' });
    c.scene.tweens.add({
      targets: o, y: { from: c.from.y - 50, to: midY }, duration: 190, delay: i * 70, yoyo: true, ease: 'Sine.easeOut',
      onComplete: () => { burst(c.scene, c.to.x, c.to.y, [c.color, c.light], 8, { speed: 180 }); o.destroy(); },
    });
  }
}

// 天使羽翼：在出手隊員背後展開
function wings(c: UltimateCtx, size = 1) {
  [-1, 1].forEach(side => {
    const w = c.scene.add.ellipse(c.from.x + side * 36, c.from.y - 70, 70 * size, 130 * size, 0xffffff, 0.85).setDepth(DEPTH - 2).setAngle(side * 25).setScale(0);
    c.scene.tweens.add({ targets: w, scale: 1, duration: 240, ease: 'Back.easeOut' });
    c.scene.tweens.add({ targets: w, alpha: 0, delay: 700, duration: 300, onComplete: () => w.destroy() });
  });
}

// 回響光環：1000 combo 以上每多 1000 多一層
function echoes(c: UltimateCtx, n: number) {
  for (let i = 0; i < n; i++) c.scene.time.delayedCall(120 * i, () => shockwave(c.scene, c.to.x, c.to.y, i % 2 ? c.light : 0xffffff, 200 + i * 60, 10));
}

// 裂空：一道白光橫切畫面
function splitSky(c: UltimateCtx) {
  const { width } = c.scene.scale;
  const line = c.scene.add.rectangle(width / 2, c.to.y, width, 6, 0xffffff).setDepth(DEPTH + 5).setScale(0, 1).setAngle(-12);
  c.scene.tweens.add({ targets: line, scaleX: 1, duration: 160, ease: 'Quad.easeOut' });
  c.scene.tweens.add({ targets: line, scaleY: 30, alpha: 0, delay: 260, duration: 380, onComplete: () => line.destroy() });
  c.scene.time.delayedCall(260, () => screenFlash(c.scene, 0xffffff, 0.8, 500));
}

type Recipe = (c: UltimateCtx) => void;

const RECIPES: Record<ClassId, Recipe[]> = {
  swordsman: [
    c => crescent(c, 1),
    c => { crescent(c, 1); fallFromSky(c, bigSword(c), 1, 120); },
    c => { fallFromSky(c, bigSword(c), 1.6); crescent(c, 2, 1.3); pillar(c.scene, c.to.x, c.ground, 0xffffff); },
    c => { for (let i = 0; i < 4; i++) fallFromSky(c, bigSword(c), 0.6, i * 80); crescent(c, 3, 1.2); },
    c => { fallFromSky(c, bigSword(c), 2); crescent(c, 3, 1.6); splitSky(c); },
  ],
  warrior: [
    c => { shockwave(c.scene, c.to.x, c.ground - 10, c.light, 180, 10); burst(c.scene, c.to.x, c.ground - 10, [c.color, 0x9a6a3a], 20, { up: true, speed: 260 }); },
    c => fallFromSky(c, meteor(c), 1),
    c => { fallFromSky(c, hammer(c), 1.4); shockwave(c.scene, c.to.x, c.ground, 0xffffff, 260, 12); },
    c => { for (let i = 0; i < 3; i++) c.scene.time.delayedCall(i * 120, () => pillar(c.scene, c.to.x - 80 + i * 80, c.ground, c.light)); fallFromSky(c, hammer(c), 1.2, 200); },
    c => { for (let i = 0; i < 5; i++) fallFromSky(c, meteor(c), 0.7 + i * 0.1, i * 90); splitSky(c); },
  ],
  archer: [
    c => arrows(c, 3),
    c => arrows(c, 16, true),
    c => { beam(c, 26, 0, 0xffcd4b); burst(c.scene, c.from.x, c.from.y - 40, [0xffcd4b, 0xffffff], 20, { speed: 200 }); },
    c => { arrows(c, 24, true, 1.4); beam(c, 16, 150); },
    c => { beam(c, 60, 0, 0xffffff); beam(c, 30, 80, c.light); arrows(c, 20, true, 1.2); splitSky(c); },
  ],
  mage: [
    c => orbs(c, 5),
    c => { magicCircle(c, 1.2); orbs(c, 3, 1.2); },
    c => { magicCircle(c, 1.8); lightning(c.scene, c.to.x, c.to.y, c.light); pillar(c.scene, c.to.x, c.ground, 0xffffff); },
    c => { magicCircle(c, 1.6); fallFromSky(c, meteor(c), 2, 200); },
    c => { magicCircle(c, 2.4); orbs(c, 8, 1.4); fallFromSky(c, meteor(c), 2.4, 260); splitSky(c); },
  ],
  monk: [
    c => { pillar(c.scene, c.to.x, c.ground, 0xfff6c0); burst(c.scene, c.to.x, c.to.y, [0xffffff, 0xfff6c0], 14, { up: true }); },
    c => { wings(c); beam(c, 14, 200, 0xfff6c0); },
    c => { wings(c, 1.3); for (let i = 0; i < 3; i++) c.scene.time.delayedCall(i * 110, () => pillar(c.scene, c.to.x - 60 + i * 60, c.ground, 0xffffff)); },
    c => { wings(c, 1.5); magicCircle(c, 1.6); beam(c, 24, 250, 0xfff6c0); },
    c => { wings(c, 1.8); magicCircle(c, 2.2); beam(c, 50, 200, 0xffffff); splitSky(c); },
  ],
};

export function playUltimate(c: UltimateCtx, classId: ClassId, tier: number, echoCount = 0) {
  if (tier <= 0) return;
  RECIPES[classId][Math.min(tier, 5) - 1](c);
  if (tier >= 3 && !reducedMotion()) screenFlash(c.scene, c.light, 0.15 + tier * 0.04, 260);
  if (echoCount > 0) echoes(c, echoCount);
}
