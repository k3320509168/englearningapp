import Phaser from 'phaser';
import { REGIONS } from './regions';
import { useSaveStore } from '../store/saveStore';
import { useBattleStore } from '../store/battleStore';
import { useUiStore } from '../store/uiStore';
import { flagKey, heroKey, registerAvatar, registerHero, registerSprites } from './art/sprites';
import { AVATAR_ORIGIN_X, avatarKey } from './art/avatar';
import { BG_LAYERS, bgKey, registerBackground, THEMES } from './art/backgrounds';
import { labelStyle, textStyle, burst } from './fx';
import { sfx } from './sfx';

// 世界地圖：背景使用玩家目前所在區域的風景，五面旗幟代表五個區域

// 九個區域的旗幟位置（左下往右上，高低交錯）
const NODES = [
  { x: 60, y: 334 }, { x: 145, y: 288 }, { x: 230, y: 326 }, { x: 315, y: 278 }, { x: 400, y: 318 },
  { x: 485, y: 270 }, { x: 570, y: 310 }, { x: 655, y: 262 }, { x: 740, y: 300 },
];

export default class MapScene extends Phaser.Scene {
  private clouds?: Phaser.GameObjects.TileSprite;

  constructor() { super('MapScene'); }

  create() {
    const { width } = this.scale;
    const unlockedIndex = useSaveStore.getState().unlockedIndex;
    const { character } = useSaveStore.getState();
    const region = Math.min(unlockedIndex, THEMES.length - 1);
    registerSprites(this);
    const tier = useSaveStore.getState().player.classPath.length;
    if (character) registerAvatar(this, character, tier);
    else registerHero(this, 'knight');
    registerBackground(this, region);
    BG_LAYERS.forEach(({ layer }) => {
      const sprite = this.add.tileSprite(0, 0, 800, 480, bgKey(region, layer)).setOrigin(0);
      if (layer === 'clouds') this.clouds = sprite;
    });
    // 讓地圖上的文字更清楚
    this.add.rectangle(0, 0, width, 480, 0x0d0b1a, 0.25).setOrigin(0);

    this.add.text(width / 2, 40, '選擇冒險區域', textStyle(34, '#ffcd4b', 7)).setOrigin(0.5);
    this.add.text(width / 2, 78, '點旗幟或下方按鈕開始，通關後解鎖下一區', labelStyle(16, '#e8e6ff')).setOrigin(0.5);

    // 路徑：像素小方塊連成的虛線，已解鎖的段落亮起
    const path = this.add.graphics();
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i], b = NODES[i + 1];
      const lit = unlockedIndex >= i + 1;
      for (let t = 0.12; t < 0.9; t += 0.08) {
        const x = Phaser.Math.Linear(a.x, b.x, t);
        const y = Phaser.Math.Linear(a.y, b.y, t) - Math.sin(t * Math.PI) * 24;
        path.fillStyle(0x1a1226, 1).fillRect(Math.round(x) - 5, Math.round(y) - 5, 10, 10);
        path.fillStyle(lit ? 0xffcd4b : 0x6c667c, 1).fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
      }
    }

    REGIONS.forEach((region, index) => {
      const { x, y } = NODES[index];
      const locked = index > unlockedIndex;
      const current = index === unlockedIndex;

      this.add.image(x, y + 4, 'pedestal').setOrigin(0.5, 0).setScale(5);
      const flag = this.add.image(x - 4, y + 4, flagKey(index, locked)).setOrigin(0.15, 1).setScale(5);
      if (!locked) this.tweens.add({ targets: flag, scaleX: 4.6, yoyo: true, repeat: -1, duration: 700 + index * 90, ease: 'Sine.easeInOut' });
      if (locked) this.add.image(x + 14, y - 36, 'lock').setScale(4);

      this.add.text(x, y + 50, region.name, textStyle(14, locked ? '#8a8494' : current ? '#ffcd4b' : '#ffffff')).setOrigin(0.5);

      if (current) {
        // 英雄站在目前可挑戰的旗幟旁
        const h = character
          ? this.add.image(x - 42, y + 6, avatarKey(character, 'idle', tier)).setOrigin(AVATAR_ORIGIN_X, 1).setScale(2)
          : this.add.image(x - 42, y + 6, heroKey('knight', 'idle')).setOrigin(AVATAR_ORIGIN_X, 1).setScale(2);
        this.tweens.add({ targets: h, y: y - 2, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
        const ring = this.add.circle(x + 10, y - 30, 46).setStrokeStyle(3, 0xffcd4b, 0.8);
        this.tweens.add({ targets: ring, scale: 1.25, alpha: 0, repeat: -1, duration: 1200 });
      }

      if (!locked) {
        const zone = this.add.zone(x + 10, y - 10, 100, 130).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => { flag.setScale(5.6); sfx.click(); });
        zone.on('pointerout', () => flag.setScale(5));
        zone.on('pointerdown', () => {
          burst(this, x + 10, y - 40, [0xffcd4b, 0xffffff], 14, { speed: 160 });
          useUiStore.getState().openRegion(index);
        });
      }
    });

    // 不論從旗幟或地圖下方的按鈕開始關卡，都在這裡切換到戰鬥場景
    const unsubscribe = useBattleStore.subscribe((s, prev) => {
      if (s.active && !prev.active) this.scene.start('MainScene');
    });
    // 在英雄選單換人或重置進度時，重畫地圖
    const unsubscribeSave = useSaveStore.subscribe((s, prev) => {
      if (s.character !== prev.character || s.unlockedIndex !== prev.unlockedIndex) this.scene.restart();
    });
    // 視窗（英雄、設定…）開著時，地圖不接受點擊；不然點視窗裡的按鈕會穿透到後面的旗幟，直接跳進關卡
    this.input.enabled = !useUiStore.getState().modal;
    const unsubscribeUi = useUiStore.subscribe((s, prev) => {
      if (s.modal === prev.modal) return;
      // 關掉視窗的那一下點擊也不要穿透：等下一輪事件再恢復
      if (s.modal) this.input.enabled = false;
      else this.time.delayedCall(80, () => { this.input.enabled = !useUiStore.getState().modal; });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { unsubscribe(); unsubscribeSave(); unsubscribeUi(); });
  }

  update(_time: number, delta: number) {
    if (this.clouds) this.clouds.tilePositionX += delta * 0.006;
  }
}
