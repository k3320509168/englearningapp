// Combo 招式的畫面特效（第二十一輪：12 階 × 5 職業 × 7 屬性）：
// 職業決定招式形狀（劍氣、天降物、魔法陣、光束、箭、羽翼、裂空…），屬性決定顏色與粒子（屬性紋樣 motif），
// 階數決定規模。每招約 0.3～1.1 秒，和一般攻擊同時播放，不拖慢答題節奏。
import Phaser from 'phaser';
import type { ClassId, Element } from './character';
import { burst, screenFlash, shake, shockwave, pillar, lightning, reducedMotion } from './fx';

export interface UltimateCtx {
  scene: Phaser.Scene;
  from: { x: number; y: number };  // 出手隊員
  to: { x: number; y: number };    // 怪物中心
  ground: number;                  // 地面 y
  color: number;                   // 屬性主色
  light: number;                   // 屬性亮色
  element: Element;                // 屬性：決定粒子形狀與命中反應
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

// ---------- 屬性紋樣：同一招不同屬性，粒子形狀、方向、命中反應都不同 ----------
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
function fade(c: UltimateCtx, o: Phaser.GameObjects.GameObject & { alpha: number }, delay: number, dur = 260) {
  c.scene.tweens.add({ targets: o, alpha: 0, delay, duration: dur, onComplete: () => o.destroy() });
}
const MOTIFS: Record<Element, (c: UltimateCtx, n: number) => void> = {
  // 金：菱形刀片向外飛散，加兩道銳利切線
  metal: (c, n) => {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const r = c.scene.add.rectangle(c.to.x, c.to.y, 4, 16, i % 2 ? 0xffffff : c.light).setDepth(DEPTH + 1).setRotation(a);
      c.scene.tweens.add({ targets: r, x: c.to.x + Math.cos(a) * rnd(60, 140), y: c.to.y + Math.sin(a) * rnd(40, 110), angle: r.angle + 180, duration: 320, ease: 'Quad.easeOut' });
      fade(c, r, 240);
    }
    [-30, 30].forEach(angle => {
      const l = c.scene.add.rectangle(c.to.x, c.to.y, 220, 3, 0xffffff).setDepth(DEPTH + 2).setAngle(angle).setScale(0, 1);
      c.scene.tweens.add({ targets: l, scaleX: 1, duration: 120 });
      fade(c, l, 180, 200);
    });
  },
  // 木：葉片旋轉散開，地面長出藤蔓
  wood: (c, n) => {
    for (let i = 0; i < n; i++) {
      const leaf = c.scene.add.ellipse(c.to.x, c.to.y, 10, 5, i % 3 ? c.color : c.light).setDepth(DEPTH + 1);
      const a = rnd(0, Math.PI * 2);
      c.scene.tweens.add({ targets: leaf, x: c.to.x + Math.cos(a) * rnd(50, 130), y: c.to.y + Math.sin(a) * rnd(30, 90) - 20, angle: rnd(180, 540), duration: rnd(380, 560), ease: 'Sine.easeOut' });
      fade(c, leaf, 380, 220);
    }
    for (let i = 0; i < Math.min(4, Math.ceil(n / 6)); i++) {
      const vine = c.scene.add.rectangle(c.to.x - 50 + i * 34, c.ground, 5, rnd(60, 110), c.color).setOrigin(0.5, 1).setDepth(DEPTH).setScale(1, 0).setAngle(rnd(-15, 15));
      c.scene.tweens.add({ targets: vine, scaleY: 1, duration: 200, delay: i * 50, ease: 'Back.easeOut' });
      fade(c, vine, 520);
    }
  },
  // 水：泡泡往上漂，地面一圈圈漣漪
  water: (c, n) => {
    for (let i = 0; i < n; i++) {
      const b = c.scene.add.circle(c.to.x + rnd(-60, 60), c.ground - rnd(0, 30), rnd(3, 8)).setStrokeStyle(2, i % 2 ? 0xffffff : c.light).setDepth(DEPTH + 1);
      c.scene.tweens.add({ targets: b, y: b.y - rnd(80, 160), x: b.x + rnd(-20, 20), duration: rnd(420, 620), ease: 'Sine.easeOut' });
      fade(c, b, 360, 260);
    }
    for (let i = 0; i < 3; i++) {
      const ring = c.scene.add.ellipse(c.to.x, c.ground - 4, 40, 12).setStrokeStyle(3, c.light).setDepth(DEPTH - 1);
      c.scene.tweens.add({ targets: ring, scaleX: 4, scaleY: 3, alpha: 0, delay: i * 110, duration: 480, onComplete: () => ring.destroy() });
    }
  },
  // 火：餘燼往上竄、地面噴出火舌
  fire: (c, n) => {
    for (let i = 0; i < n; i++) {
      const e = c.scene.add.rectangle(c.to.x + rnd(-50, 50), c.to.y + rnd(-10, 40), 5, 5, [0xffd15c, 0xff7049, c.light][i % 3]).setDepth(DEPTH + 1);
      c.scene.tweens.add({ targets: e, y: e.y - rnd(90, 170), x: e.x + rnd(-30, 30), duration: rnd(420, 640), ease: 'Quad.easeOut' });
      fade(c, e, 300, 300);
    }
    for (let i = 0; i < Math.min(5, Math.ceil(n / 5)); i++) {
      const f = c.scene.add.triangle(c.to.x - 60 + i * 30, c.ground, -12, 0, 12, 0, 0, -rnd(50, 90), i % 2 ? 0xff7049 : 0xffd15c).setOrigin(0.5, 1).setDepth(DEPTH).setScale(1, 0);
      c.scene.tweens.add({ targets: f, scaleY: 1, duration: 140, delay: i * 40, yoyo: true, hold: 160, onComplete: () => f.destroy() });
    }
  },
  // 土：方形碎石噴起、地面裂痕
  earth: (c, n) => {
    burst(c.scene, c.to.x, c.ground - 8, [c.color, c.light, 0x7a5a3a], n, { up: true, speed: 280, size: 7, gravity: 900 });
    const g = c.scene.add.graphics().setDepth(DEPTH - 1);
    g.lineStyle(3, 0x2a1a0e, 1);
    for (let k = -1; k <= 1; k += 2) {
      let x = c.to.x; let y = c.ground - 2;
      g.beginPath().moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += k * rnd(20, 34); y += rnd(-3, 3); g.lineTo(x, y); }
      g.strokePath();
    }
    fade(c, g, 520, 300);
  },
  // 光：八角星芒向外放射、羽光飄落
  light: (c, n) => {
    for (let i = 0; i < 8; i++) {
      const ray = c.scene.add.rectangle(c.to.x, c.to.y, 120, i % 2 ? 3 : 6, i % 2 ? c.light : 0xffffff).setOrigin(0, 0.5).setDepth(DEPTH + 1).setAngle(i * 45).setScale(0, 1);
      c.scene.tweens.add({ targets: ray, scaleX: 1, duration: 160, ease: 'Quad.easeOut' });
      fade(c, ray, 200, 240);
    }
    for (let i = 0; i < Math.ceil(n / 2); i++) {
      const f = c.scene.add.ellipse(c.to.x + rnd(-90, 90), c.to.y - rnd(80, 140), 6, 14, 0xffffff, 0.9).setDepth(DEPTH + 1).setAngle(rnd(-40, 40));
      c.scene.tweens.add({ targets: f, y: f.y + rnd(80, 130), angle: f.angle + rnd(-60, 60), duration: rnd(600, 800), ease: 'Sine.easeInOut' });
      fade(c, f, 500, 300);
    }
  },
  // 暗：紫黑旋渦向內收縮、暗影碎片被吸進中心
  dark: (c, n) => {
    for (let i = 0; i < 2; i++) {
      const ring = c.scene.add.circle(c.to.x, c.to.y, 110).setStrokeStyle(6 - i * 2, i ? 0x2a1240 : c.light).setDepth(DEPTH + 1).setScale(1.2 + i * 0.4);
      c.scene.tweens.add({ targets: ring, scale: 0, angle: 180, duration: 420, delay: i * 80, ease: 'Quad.easeIn', onComplete: () => ring.destroy() });
    }
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const d = c.scene.add.rectangle(c.to.x + Math.cos(a) * 140, c.to.y + Math.sin(a) * 100, 6, 6, i % 2 ? 0x2a1240 : c.color).setDepth(DEPTH + 1);
      c.scene.tweens.add({ targets: d, x: c.to.x, y: c.to.y, duration: 380, delay: rnd(0, 120), ease: 'Quad.easeIn', onComplete: () => d.destroy() });
    }
  },
};
function motif(c: UltimateCtx, n: number, delay = 0) {
  if (reducedMotion()) return;
  c.scene.time.delayedCall(delay, () => MOTIFS[c.element](c, Math.min(n, 30)));
}

// ---------- 高階新元素 ----------
// 環繞劍刃／星球：一圈物件繞著怪物轉，最後一起刺進去
function ring(c: UltimateCtx, count: number, make: (i: number) => Phaser.GameObjects.Shape, radius = 120) {
  for (let i = 0; i < count; i++) {
    const o = make(i).setDepth(DEPTH + 1);
    const a0 = (Math.PI * 2 * i) / count;
    const state = { t: 0 };
    c.scene.tweens.add({
      targets: state, t: 1, duration: 520, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const a = a0 + state.t * Math.PI * 1.5;
        const r = radius * (1 - Math.max(0, state.t - 0.7) / 0.3);
        o.setPosition(c.to.x + Math.cos(a) * r, c.to.y + Math.sin(a) * r * 0.55).setRotation(a + Math.PI / 2);
      },
      onComplete: () => { burst(c.scene, c.to.x, c.to.y, [c.light, 0xffffff], 4, { speed: 160 }); o.destroy(); },
    });
  }
}
const blade = (c: UltimateCtx) => () => c.scene.add.rectangle(0, 0, 8, 46, c.light).setStrokeStyle(2, 0xffffff);
const star = (c: UltimateCtx) => (i: number) => c.scene.add.circle(0, 0, 9 + (i % 3) * 3, i % 2 ? c.color : c.light).setStrokeStyle(2, 0xffffff);
// 巨大投影（巨劍、巨拳、巨人）：半透明的大剪影壓下來
function giantShadow(c: UltimateCtx, kind: 'sword' | 'fist', delay = 0) {
  c.scene.time.delayedCall(delay, () => {
    const g = c.scene.add.graphics().setDepth(DEPTH - 3).setAlpha(0);
    g.fillStyle(c.light, 0.35);
    if (kind === 'sword') { g.fillRect(-30, -320, 60, 320); g.fillTriangle(-30, 0, 30, 0, 0, 60); g.fillRect(-90, -340, 180, 26); }
    else { g.fillRoundedRect(-110, -150, 220, 150, 30); g.fillRect(-80, -260, 160, 120); }
    g.setPosition(c.to.x, c.ground - 40).setScale(1.4);
    c.scene.tweens.add({ targets: g, alpha: 1, scale: 1, duration: 260, ease: 'Quad.easeIn' });
    c.scene.time.delayedCall(260, () => {
      shockwave(c.scene, c.to.x, c.ground - 10, 0xffffff, 300, 12);
      if (!reducedMotion()) shake(c.scene, 180, 0.012);
    });
    fade(c, g, 520, 320);
  });
}
// 結界：半球形光罩罩住全場
function dome(c: UltimateCtx, size = 1, delay = 0) {
  c.scene.time.delayedCall(delay, () => {
    const d = c.scene.add.ellipse(c.to.x - 120, c.ground, 520 * size, 340 * size, c.light, 0.18).setStrokeStyle(4, c.light).setOrigin(0.5, 1).setDepth(DEPTH - 4).setScale(0);
    c.scene.tweens.add({ targets: d, scale: 1, duration: 300, ease: 'Back.easeOut' });
    fade(c, d, 650, 350);
  });
}
// 十字斷：兩道交叉的裂空
function crossSplit(c: UltimateCtx) {
  [-35, 35].forEach((angle, i) => c.scene.time.delayedCall(i * 140, () => {
    const l = c.scene.add.rectangle(c.to.x, c.to.y, 700, 8, 0xffffff).setDepth(DEPTH + 5).setAngle(angle).setScale(0, 1);
    c.scene.tweens.add({ targets: l, scaleX: 1, duration: 140, ease: 'Quad.easeOut' });
    c.scene.tweens.add({ targets: l, scaleY: 12, alpha: 0, delay: 200, duration: 320, onComplete: () => l.destroy() });
  }));
  c.scene.time.delayedCall(320, () => screenFlash(c.scene, c.light, 0.5, 360));
}
// 星海：滿天星點閃爍，再一起墜落
function starfield(c: UltimateCtx, n: number) {
  const { width } = c.scene.scale;
  for (let i = 0; i < n; i++) {
    const s = c.scene.add.rectangle(rnd(0, width), rnd(20, 160), 4, 4, i % 3 ? 0xffffff : c.light).setDepth(DEPTH - 2).setAlpha(0);
    c.scene.tweens.add({ targets: s, alpha: 1, duration: 120, delay: rnd(0, 200), yoyo: true, repeat: 1 });
    c.scene.tweens.add({ targets: s, x: c.to.x + rnd(-40, 40), y: c.to.y, delay: 420 + rnd(0, 120), duration: 260, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
  }
}
// 世界裂縫：畫面中央裂開一道光縫，四周變暗
function worldRift(c: UltimateCtx) {
  const { width, height } = c.scene.scale;
  const dim = c.scene.add.rectangle(width / 2, height / 2, width, height, 0x05040f, 0).setDepth(DEPTH - 5);
  c.scene.tweens.add({ targets: dim, fillAlpha: 0.55, duration: 200, yoyo: true, hold: 500, onComplete: () => dim.destroy() });
  const rift = c.scene.add.rectangle(c.to.x, height / 2, 10, height, 0xffffff).setDepth(DEPTH + 6).setScale(1, 0);
  c.scene.tweens.add({ targets: rift, scaleY: 1, duration: 220, delay: 120, ease: 'Quad.easeOut' });
  c.scene.tweens.add({ targets: rift, scaleX: 40, alpha: 0, delay: 520, duration: 360, onComplete: () => rift.destroy() });
  c.scene.time.delayedCall(520, () => screenFlash(c.scene, 0xffffff, 0.85, 520));
}

type Recipe = (c: UltimateCtx) => void;

// 每個職業 11 階（第 1 階＝10 combo … 第 11 階＝30 萬 combo）；屬性紋樣依階數加量
const RECIPES: Record<ClassId, Recipe[]> = {
  swordsman: [
    c => { crescent(c, 2, 0.7); },
    c => crescent(c, 1),
    c => { crescent(c, 1); fallFromSky(c, bigSword(c), 1, 120); },
    c => { fallFromSky(c, bigSword(c), 1.6); crescent(c, 2, 1.3); pillar(c.scene, c.to.x, c.ground, 0xffffff); },
    c => { for (let i = 0; i < 4; i++) fallFromSky(c, bigSword(c), 0.6, i * 80); crescent(c, 3, 1.2); },
    c => { fallFromSky(c, bigSword(c), 2); crescent(c, 3, 1.6); splitSky(c); },
    c => { crossSplit(c); crescent(c, 2, 1.4); },
    c => { ring(c, 8, blade(c)); crescent(c, 2, 1.4); },
    c => { crossSplit(c); ring(c, 10, blade(c), 140); splitSky(c); },
    c => { giantShadow(c, 'sword'); ring(c, 12, blade(c), 150); crescent(c, 3, 1.8); },
    c => { worldRift(c); giantShadow(c, 'sword', 200); ring(c, 12, blade(c), 160); crossSplit(c); },
  ],
  warrior: [
    c => { shockwave(c.scene, c.to.x, c.ground - 10, c.light, 120, 6); },
    c => { shockwave(c.scene, c.to.x, c.ground - 10, c.light, 180, 10); burst(c.scene, c.to.x, c.ground - 10, [c.color, 0x9a6a3a], 20, { up: true, speed: 260 }); },
    c => fallFromSky(c, meteor(c), 1),
    c => { fallFromSky(c, hammer(c), 1.4); shockwave(c.scene, c.to.x, c.ground, 0xffffff, 260, 12); },
    c => { for (let i = 0; i < 3; i++) c.scene.time.delayedCall(i * 120, () => pillar(c.scene, c.to.x - 80 + i * 80, c.ground, c.light)); fallFromSky(c, hammer(c), 1.2, 200); },
    c => { for (let i = 0; i < 5; i++) fallFromSky(c, meteor(c), 0.7 + i * 0.1, i * 90); splitSky(c); },
    c => { giantShadow(c, 'fist'); fallFromSky(c, hammer(c), 1.4, 260); },
    c => { for (let i = 0; i < 6; i++) c.scene.time.delayedCall(i * 70, () => pillar(c.scene, c.to.x - 150 + i * 60, c.ground, i % 2 ? c.light : 0xffffff)); giantShadow(c, 'fist', 200); },
    c => { for (let i = 0; i < 4; i++) c.scene.time.delayedCall(i * 90, () => shockwave(c.scene, c.to.x, c.ground - 10, i % 2 ? c.light : 0xffffff, 260 + i * 120, 14)); fallFromSky(c, hammer(c), 2, 160); splitSky(c); },
    c => { giantShadow(c, 'fist'); giantShadow(c, 'fist', 260); for (let i = 0; i < 4; i++) fallFromSky(c, meteor(c), 1, 300 + i * 80); },
    c => { worldRift(c); giantShadow(c, 'fist', 160); for (let i = 0; i < 6; i++) fallFromSky(c, meteor(c), 1.1, 260 + i * 70); },
  ],
  archer: [
    c => arrows(c, 2),
    c => arrows(c, 3),
    c => arrows(c, 16, true),
    c => { beam(c, 26, 0, 0xffcd4b); burst(c.scene, c.from.x, c.from.y - 40, [0xffcd4b, 0xffffff], 20, { speed: 200 }); },
    c => { arrows(c, 24, true, 1.4); beam(c, 16, 150); },
    c => { beam(c, 60, 0, 0xffffff); beam(c, 30, 80, c.light); arrows(c, 20, true, 1.2); splitSky(c); },
    c => { ring(c, 8, () => c.scene.add.triangle(0, 0, 0, -8, 0, 8, 16, 0, c.light)); arrows(c, 12, true, 1.2); },
    c => { ring(c, 12, () => c.scene.add.triangle(0, 0, 0, -8, 0, 8, 16, 0, c.light), 140); arrows(c, 20, true, 1.3); beam(c, 20, 300); },
    c => { arrows(c, 30, true, 1.5); fallFromSky(c, meteor(c), 1.2, 200); beam(c, 40, 320, c.light); },
    c => { starfield(c, 24); beam(c, 50, 380, 0xffffff); beam(c, 26, 440, c.light); },
    c => { worldRift(c); starfield(c, 30); beam(c, 80, 420, 0xffffff); arrows(c, 24, true, 1.5); },
  ],
  mage: [
    c => orbs(c, 3, 0.8),
    c => orbs(c, 5),
    c => { magicCircle(c, 1.2); orbs(c, 3, 1.2); },
    c => { magicCircle(c, 1.8); lightning(c.scene, c.to.x, c.to.y, c.light); pillar(c.scene, c.to.x, c.ground, 0xffffff); },
    c => { magicCircle(c, 1.6); fallFromSky(c, meteor(c), 2, 200); },
    c => { magicCircle(c, 2.4); orbs(c, 8, 1.4); fallFromSky(c, meteor(c), 2.4, 260); splitSky(c); },
    c => { magicCircle(c, 1.4); c.scene.time.delayedCall(120, () => magicCircle(c, 2)); c.scene.time.delayedCall(240, () => magicCircle(c, 2.6)); orbs(c, 6, 1.3); },
    c => { ring(c, 7, star(c)); magicCircle(c, 2.2); lightning(c.scene, c.to.x, c.to.y, c.light); },
    c => { magicCircle(c, 2.8); ring(c, 9, star(c), 150); fallFromSky(c, meteor(c), 2.4, 320); splitSky(c); },
    c => { starfield(c, 26); magicCircle(c, 3); fallFromSky(c, meteor(c), 2.8, 360); },
    c => { worldRift(c); starfield(c, 30); magicCircle(c, 3.2); ring(c, 10, star(c), 170); },
  ],
  monk: [
    c => { const h = c.scene.add.circle(c.from.x, c.from.y - 60, 30).setStrokeStyle(4, c.light).setDepth(DEPTH); c.scene.tweens.add({ targets: h, scale: 2, alpha: 0, duration: 420, onComplete: () => h.destroy() }); },
    c => { pillar(c.scene, c.to.x, c.ground, 0xfff6c0); burst(c.scene, c.to.x, c.to.y, [0xffffff, 0xfff6c0], 14, { up: true }); },
    c => { wings(c); beam(c, 14, 200, 0xfff6c0); },
    c => { wings(c, 1.3); for (let i = 0; i < 3; i++) c.scene.time.delayedCall(i * 110, () => pillar(c.scene, c.to.x - 60 + i * 60, c.ground, 0xffffff)); },
    c => { wings(c, 1.5); magicCircle(c, 1.6); beam(c, 24, 250, 0xfff6c0); },
    c => { wings(c, 1.8); magicCircle(c, 2.2); beam(c, 50, 200, 0xffffff); splitSky(c); },
    c => { dome(c); wings(c, 1.6); magicCircle(c, 2); },
    c => { dome(c, 1.2); for (let i = 0; i < 5; i++) c.scene.time.delayedCall(i * 90, () => pillar(c.scene, c.to.x - 120 + i * 60, c.ground, i % 2 ? c.light : 0xffffff)); },
    c => { wings(c, 2.2); dome(c, 1.3, 120); beam(c, 60, 260, 0xffffff); splitSky(c); },
    c => { for (let i = 0; i < 3; i++) c.scene.time.delayedCall(i * 120, () => { const h = c.scene.add.circle(c.to.x, c.to.y, 60 + i * 30).setStrokeStyle(5, i % 2 ? c.light : 0xffffff).setDepth(DEPTH); c.scene.tweens.add({ targets: h, scale: 2.4, alpha: 0, duration: 520, onComplete: () => h.destroy() }); }); wings(c, 2.4); dome(c, 1.4, 200); },
    c => { worldRift(c); wings(c, 2.6); dome(c, 1.5, 160); starfield(c, 24); },
  ],
};

export function playUltimate(c: UltimateCtx, classId: ClassId, tier: number, echoCount = 0) {
  if (tier <= 0) return;
  const t = Math.min(tier, RECIPES[classId].length);
  RECIPES[classId][t - 1](c);
  // 屬性紋樣：階數越高粒子越多（第 1 階 6 顆 … 第 11 階 30 顆）
  motif(c, 4 + t * 2 + Math.floor(t / 3) * 2, 120);
  if (t >= 4 && !reducedMotion()) screenFlash(c.scene, c.light, 0.12 + t * 0.03, 260);
  if (echoCount > 0) echoes(c, echoCount);
}

// 百萬 Combo 成就演出：全螢幕金光、大字（一場戰鬥只播一次，由 MainScene 控制）
export function playMillion(scene: Phaser.Scene, light: number) {
  const { width, height } = scene.scale;
  screenFlash(scene, 0xffffff, 0.9, 700);
  for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 120, () => shockwave(scene, width / 2, height / 2, i % 2 ? light : 0xffd15c, 260 + i * 90, 12));
  if (!reducedMotion()) shake(scene, 400, 0.01);
}
