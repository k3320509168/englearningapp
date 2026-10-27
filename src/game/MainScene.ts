import Phaser from 'phaser';
import { useBattleStore } from '../store/battleStore';
import type { BattleEvent } from '../store/battleStore';
import { PLAYER_MAX_HP, comboMultiplier } from './battle';

// 戰鬥畫面：只負責顯示與動畫。作答邏輯在 battleStore，作答介面在 React (BattleHUD)。

const PLAYER_X = 220;
const MONSTER_X = 580;
const GROUND_Y = 300;

class HealthBar {
  private bgBar: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.bgBar = scene.add.graphics();
    this.bar = scene.add.graphics();
  }

  setHp(hp: number, maxHp: number) {
    this.bgBar.clear(); this.bar.clear();
    this.bgBar.fillStyle(0x000000, 0.6).fillRoundedRect(this.x - 2, this.y - 2, 124, 16, 4);
    this.bgBar.lineStyle(2, 0xffffff, 0.8).strokeRoundedRect(this.x - 2, this.y - 2, 124, 16, 4);
    const w = maxHp > 0 ? Math.max(0, (hp / maxHp) * 120) : 0;
    const color = hp <= maxHp * 0.3 ? 0xff4444 : 0x44ff44;
    if (w > 0) this.bar.fillStyle(color, 1).fillRoundedRect(this.x, this.y, w, 12, 2);
  }
}

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private monster!: Phaser.GameObjects.Image;
  private playerHpBar!: HealthBar;
  private monsterHpBar!: HealthBar;
  private stageTxt!: Phaser.GameObjects.Text;
  private comboTxt!: Phaser.GameObjects.Text;
  private fontBase = {
    fontFamily: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", monospace',
    stroke: '#000', strokeThickness: 4,
    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true },
  };

  constructor() { super('MainScene'); }

  preload() {
    this.load.spritesheet('player', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('monster', 'https://labs.phaser.io/assets/sprites/space-baddie.png');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height).setAlpha(0.8);

    if (!this.anims.exists('idle')) {
      this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 4 }], frameRate: 10 });
      this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });
    }

    this.player = this.add.sprite(PLAYER_X, GROUND_Y, 'player', 4).setScale(2.5);
    this.monster = this.add.image(MONSTER_X, GROUND_Y, 'monster').setScale(2);
    this.add.text(PLAYER_X, 182, '玩家', { ...this.fontBase, fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    this.playerHpBar = new HealthBar(this, PLAYER_X - 60, 200);
    this.monsterHpBar = new HealthBar(this, MONSTER_X - 60, 200);
    this.stageTxt = this.add.text(width / 2, 40, '', { ...this.fontBase, fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    this.comboTxt = this.add.text(width / 2, 110, '', { ...this.fontBase, fontSize: '44px', color: '#ffaa00', fontStyle: 'italic bold' }).setOrigin(0.5);

    const unsubscribe = useBattleStore.subscribe((state, prev) => this.sync(state, prev));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.sync(useBattleStore.getState(), null);
  }

  private sync(s: ReturnType<typeof useBattleStore.getState>, prev: ReturnType<typeof useBattleStore.getState> | null) {
    if (!s.active) {
      this.scene.start('MapScene');
      return;
    }
    const stage = s.stages[s.stageIdx];
    if (stage) this.stageTxt.setText(`${stage.name}  (${s.stageIdx + 1}/${s.stages.length})`);
    this.playerHpBar.setHp(s.playerHp, PLAYER_MAX_HP);

    if (s.combo !== prev?.combo) {
      if (s.combo > 1) {
        this.comboTxt.setText(`${s.combo} COMBO!  ×${comboMultiplier(s.combo).toFixed(1)}`).setAlpha(1);
        this.tweens.add({ targets: this.comboTxt, scale: 1.2, yoyo: true, duration: 150 });
      } else {
        this.comboTxt.setText('');
      }
    }

    if (s.event && s.event !== prev?.event) this.playEvent(s.event);

    if (s.phase === 'gameOver') {
      this.player.anims.stop();
      this.player.setTint(0x555555);
    }
  }

  private playEvent(event: BattleEvent) {
    const s = useBattleStore.getState();
    if (event.kind === 'stage') {
      const isBoss = s.stages[s.stageIdx]?.bossMode;
      this.tweens.killTweensOf(this.monster);
      this.monster.setScale(isBoss ? 3.5 : 2).setAlpha(1).setPosition(MONSTER_X, GROUND_Y);
      if (isBoss) this.monster.setTint(0xff5555); else this.monster.clearTint();
      this.player.clearTint().setPosition(PLAYER_X, GROUND_Y).play('run', true);
      this.monsterHpBar.setHp(s.monsterHp, s.monsterMaxHp);
      return;
    }

    if (event.kind === 'attack') {
      this.tweens.add({
        targets: this.player, x: MONSTER_X - 70, yoyo: true, duration: 180,
        onYoyo: () => {
          const now = useBattleStore.getState();
          this.monsterHpBar.setHp(now.monsterHp, now.monsterMaxHp);
          this.showNumber(MONSTER_X, GROUND_Y - 80, `-${event.amount}`, '#ffff00');
          this.cameras.main.shake(100, 0.01);
          this.tweens.add({ targets: this.monster, alpha: 0.3, yoyo: true, duration: 80, repeat: 1 });
          if (now.monsterHp <= 0) {
            this.player.play('idle');
            this.tweens.add({ targets: this.monster, alpha: 0, y: GROUND_Y + 30, delay: 200, duration: 500 });
          }
        },
      });
      return;
    }

    // hurt
    this.showNumber(PLAYER_X, GROUND_Y - 80, `-${event.amount}`, '#ff4444');
    this.cameras.main.shake(80, 0.006);
    this.player.setTint(0xff4444);
    this.time.delayedCall(200, () => {
      if (useBattleStore.getState().phase !== 'gameOver') this.player.clearTint();
    });
  }

  private showNumber(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: '34px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }
}
