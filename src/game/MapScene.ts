import Phaser from 'phaser';
import { LEVELS } from './QuestionData';
import { useSaveStore } from '../store/saveStore';
import { useBattleStore } from '../store/battleStore';
import { isSpeechRecognitionSupported } from './speech';
import { voiceFallback } from './battle';

export default class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  preload() {
    this.load.image('bg', 'https://labs.phaser.io/assets/skies/space3.png');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height).setAlpha(0.8);
    const fontBase = { fontFamily: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", monospace', stroke: '#000', strokeThickness: 4, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true } };
    this.add.text(width / 2, 44, '選擇探索區域', { ...fontBase, fontSize: '36px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);

    const unlockedIndex = useSaveStore.getState().unlockedIndex;
    const mapNodes = [
      { x: 130, y: 360 }, { x: 320, y: 280 }, { x: 520, y: 360 },
      { x: 660, y: 220 }, { x: 420, y: 130 }
    ];

    const graphics = this.add.graphics();
    for (let i = 0; i < mapNodes.length - 1; i++) {
      graphics.lineStyle(4, unlockedIndex >= i + 1 ? 0x4aa8ff : 0x444444, unlockedIndex >= i + 1 ? 1 : 0.5);
      graphics.strokeLineShape(new Phaser.Geom.Line(mapNodes[i].x, mapNodes[i].y, mapNodes[i + 1].x, mapNodes[i + 1].y));
    }

    LEVELS.forEach((levelKey, index) => {
      const pos = mapNodes[index];
      const isUnlocked = index <= unlockedIndex;
      // 圓點加大，手機上比較好點
      const circle = this.add.circle(pos.x, pos.y, 30, isUnlocked ? 0x4aa8ff : 0x333333).setStrokeStyle(3, 0xffffff);
      const label = this.add.text(pos.x, pos.y + 50, isUnlocked ? levelKey : `🔒 ${levelKey}`, { ...fontBase, fontSize: '18px', color: isUnlocked ? '#ffffff' : '#888888' }).setOrigin(0.5);

      if (isUnlocked) {
        if (index === unlockedIndex) {
          this.tweens.add({ targets: circle, scale: 1.2, alpha: 0.8, yoyo: true, repeat: -1, duration: 800 });
          label.setColor('#ffaa00');
        }
        circle.setInteractive({ useHandCursor: true })
          .on('pointerover', () => circle.setScale(1.2))
          .on('pointerout', () => circle.setScale(1))
          .on('pointerdown', () => {
            useBattleStore.getState().startLevel(levelKey, isSpeechRecognitionSupported() ? undefined : voiceFallback);
            this.scene.start('MainScene');
          });
      }
    });
  }
}
