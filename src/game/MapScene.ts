import Phaser from 'phaser';
import { LEVELS, globalUnlockedIndex } from './QuestionData';

export default class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }
  
  preload() { 
    this.load.image('bg', 'https://labs.phaser.io/assets/skies/space3.png'); 
  }
  
  create() {
    this.add.image(400, 300, 'bg').setDisplaySize(800, 600).setAlpha(0.8);
    const fontBase = { fontFamily: '"Microsoft JhengHei", monospace', stroke: '#000', strokeThickness: 4, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true } };
    this.add.text(400, 60, '選擇探索區域', { ...fontBase, fontSize: '36px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
    
    const mapNodes = [
      { x: 150, y: 450 }, { x: 350, y: 350 }, { x: 550, y: 450 }, 
      { x: 650, y: 250 }, { x: 400, y: 150 } 
    ];

    const graphics = this.add.graphics();
    for (let i = 0; i < mapNodes.length - 1; i++) {
      graphics.lineStyle(4, globalUnlockedIndex >= i + 1 ? 0x4aa8ff : 0x444444, globalUnlockedIndex >= i + 1 ? 1 : 0.5);
      graphics.strokeLineShape(new Phaser.Geom.Line(mapNodes[i].x, mapNodes[i].y, mapNodes[i + 1].x, mapNodes[i + 1].y));
    }

    LEVELS.forEach((levelKey, index) => {
      const pos = mapNodes[index];
      const isUnlocked = index <= globalUnlockedIndex;
      const circle = this.add.circle(pos.x, pos.y, 25, isUnlocked ? 0x4aa8ff : 0x333333).setStrokeStyle(3, 0xffffff);
      const label = this.add.text(pos.x, pos.y + 45, isUnlocked ? levelKey : `🔒 ${levelKey}`, { ...fontBase, fontSize: '18px', color: isUnlocked ? '#ffffff' : '#888888' }).setOrigin(0.5);

      if (isUnlocked) {
        if (index === globalUnlockedIndex) {
          this.tweens.add({ targets: circle, scale: 1.2, alpha: 0.8, yoyo: true, repeat: -1, duration: 800 });
          label.setColor('#ffaa00');
        }
        circle.setInteractive({ useHandCursor: true })
          .on('pointerover', () => circle.setScale(1.2))
          .on('pointerout', () => circle.setScale(1))
          .on('pointerdown', () => {
            this.scene.start('MainScene', { levelKey: levelKey });
          });
      }
    });
  }
}