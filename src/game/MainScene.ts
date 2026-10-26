import Phaser from 'phaser';
import { Stage } from './types';
import { generateStages, unlockNextLevel } from './QuestionData';

class HealthBar {
  private bgBar: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private maxHp: number;
  constructor(scene: Phaser.Scene, private x: number, private y: number, maxHp: number) {
    this.bgBar = scene.add.graphics();
    this.bar = scene.add.graphics();
    this.maxHp = maxHp;
    this.setHp(maxHp);
  }
  setMaxHp(max: number) { this.maxHp = max; }
  setHp(hp: number) {
    this.bgBar.clear(); this.bar.clear();
    this.bgBar.fillStyle(0x000000, 0.6).fillRoundedRect(this.x - 2, this.y - 2, 104, 14, 4);
    this.bgBar.lineStyle(2, 0xffffff, 0.8).strokeRoundedRect(this.x - 2, this.y - 2, 104, 14, 4);
    const w = Math.max(0, (hp / this.maxHp) * 100);
    const color = hp <= this.maxHp * 0.3 ? 0xff4444 : 0x44ff44;
    if (w > 0) this.bar.fillStyle(color, 1).fillRoundedRect(this.x, this.y, w, 10, 2);
  }
}

export default class MainScene extends Phaser.Scene {
  private playerHp = 100;
  private monsterHp = 100;
  private stageIdx = 0;      
  private qIdx = 0;          
  private typed = "";
  private combo = 0;         
  private isLocked = false;  
  private isStageClear = false; 
  private currentStages: Stage[] = [];
  private currentLevelKey = "";
  private ui!: Record<string, any>;
  private playerHpBar!: HealthBar;
  private monsterHpBar!: HealthBar;
  private recognition: any;
  private isListening = false;
  private comboTimer?: Phaser.Time.TimerEvent;

  constructor() { super('MainScene'); }

  init(data: { levelKey: string }) {
    this.currentLevelKey = data.levelKey;
    this.currentStages = generateStages(data.levelKey);
    this.stageIdx = 0;
    this.qIdx = 0;
    this.playerHp = 100;
    this.combo = 0;
  }

  preload() {
    this.load.spritesheet('player', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('monster', 'https://labs.phaser.io/assets/sprites/space-baddie.png');
  }

  create() {
    this.add.image(400, 300, 'bg').setDisplaySize(800, 600).setAlpha(0.8);
    const fontBase = { fontFamily: '"Microsoft JhengHei", monospace', stroke: '#000', strokeThickness: 4, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true } };

    this.add.graphics().fillStyle(0x000000, 0.6).fillRoundedRect(80, 260, 640, 190, 12);

    this.ui = {
      pBox: this.add.sprite(200, 170, 'player', 4).setScale(2),
      mBox: this.add.image(600, 170, 'monster').setScale(2),
      comboTxt: this.add.text(400, 60, '', { ...fontBase, fontSize: '42px', color: '#ffaa00', fontStyle: 'italic bold' }).setOrigin(0.5),
      mName: this.add.text(600, 90, '', { ...fontBase, fontSize: '18px', color: '#ffffff' }).setOrigin(0.5),
      msg: this.add.text(400, 290, '', { ...fontBase, fontSize: '26px', color: '#ffd700' }).setOrigin(0.5),
      optLeft: this.add.text(140, 340, '', { ...fontBase, fontSize: '20px', color: '#ffffff', align: 'left', lineSpacing: 25 }).setOrigin(0, 0).setVisible(false),
      optRight: this.add.text(420, 340, '', { ...fontBase, fontSize: '20px', color: '#ffffff', align: 'left', lineSpacing: 25 }).setOrigin(0, 0).setVisible(false),
      hint: this.add.text(400, 560, '🔊 [空白鍵] 發音 | 🎤 語音關卡按 [Enter] 錄音', { ...fontBase, fontSize: '14px', color: '#aaaaaa', strokeThickness: 2 }).setOrigin(0.5),
      inputBg: this.add.graphics(),
      word: this.add.text(400, 500, '', { ...fontBase, fontSize: '36px', letterSpacing: 8 }).setOrigin(0.5)
    };

    this.drawInputBg(0x4aa8ff);
    this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 4 }], frameRate: 10 });
    this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });

    this.playerHpBar = new HealthBar(this, 150, 110, 100);
    this.add.text(200, 90, '玩家', { ...fontBase, fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    this.monsterHpBar = new HealthBar(this, 550, 110, 100);
    
    this.initSpeechRecognition();
    this.loadStage();
    this.input.keyboard?.on('keydown', this.handleInput, this);
  }

  private resetCombo() {
    this.combo = 0;
    this.ui.comboTxt.setText('').setAlpha(1);
    if (this.comboTimer) {
      this.comboTimer.remove();
      this.comboTimer = undefined;
    }
  }

  private drawInputBg(borderColor: number) {
    this.ui.inputBg.clear();
    this.ui.inputBg.fillStyle(0x111111, 0.8).fillRoundedRect(250, 470, 300, 60, 10);
    this.ui.inputBg.lineStyle(3, borderColor, 1).strokeRoundedRect(250, 470, 300, 60, 10);
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US'; 
      this.recognition.interimResults = false;
      this.recognition.onstart = () => {
        this.isListening = true;
        this.drawInputBg(0xff4a4a);
        this.ui.word.setText("🎤 聆聽中...").setColor('#ffaa00').setFontSize('24px').setLetterSpacing(2);
      };
      this.recognition.onresult = (event: any) => { this.handleVoiceInput(event.results[0][0].transcript.toUpperCase()); };
      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        this.ui.word.setText(`❌ 錯誤: ${event.error}`).setColor('#f44').setFontSize('20px');
        this.time.delayedCall(2000, () => { if (this.monsterHp > 0 && this.playerHp > 0) this.updateWordDisplay(); });
      };
      this.recognition.onend = () => { this.isListening = false; };
    }
  }

  private speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    window.speechSynthesis.speak(utterance);
  }

  private showDamage(x: number, y: number, amount: number, color: string) {
    const dmgText = this.add.text(x, y, `-${amount}`, { fontFamily: 'monospace', fontSize: '32px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
    this.tweens.add({ targets: dmgText, y: y - 60, alpha: 0, duration: 800, onComplete: () => dmgText.destroy() });
  }

  private hideOptions() {
    this.ui.optLeft.setVisible(false);
    this.ui.optRight.setVisible(false);
  }

  private loadStage() {
    if (this.stageIdx >= this.currentStages.length) {
      this.isStageClear = true;
      this.ui.pBox.play('idle');
      this.ui.msg.setText("🎉 區域完全通關！按 [ Enter ] 回到世界地圖");
      this.monsterHpBar.setHp(0);
      this.ui.mBox.setTint(0x555555).setAlpha(0.3);
      this.hideOptions();
      this.ui.word.setText("");
      this.ui.inputBg.setVisible(false);
      unlockNextLevel(this.currentLevelKey);
      return;
    }
    this.isStageClear = false;
    const stage = this.currentStages[this.stageIdx];
    const maxHp = stage.questions.length * 50; 
    
    this.monsterHp = maxHp;
    this.monsterHpBar.setMaxHp(maxHp);
    this.monsterHpBar.setHp(maxHp);
    this.ui.mName.setText(`${stage.name} (${this.stageIdx + 1}/50)`);

    if (stage.bossMode) {
      this.ui.mBox.setScale(4).setTint(0xff5555).setAlpha(1); 
    } else {
      this.ui.mBox.setScale(2).clearTint().setAlpha(1);       
    }
    this.loadQuestion();
  }

  private loadQuestion() {
    const q = this.currentStages[this.stageIdx].questions[this.qIdx];
    this.isLocked = false; 
    this.typed = "";
    this.ui.pBox.play('run', true); 
    this.ui.msg.setText(q.desc);
    
    if (q.type === 'choice' && q.options && q.options.length >= 4) {
      this.ui.optLeft.setText(`${q.options[0]}\n${q.options[2]}`).setVisible(true);
      this.ui.optRight.setText(`${q.options[1]}\n${q.options[3]}`).setVisible(true);
    } else {
      this.hideOptions();
    }
    
    this.updateWordDisplay();
    if (q.speak) this.speak(q.speak); 
  }

  private updateWordDisplay() {
    if (this.isListening) return; 
    const q = this.currentStages[this.stageIdx].questions[this.qIdx];
    let str = "";
    let isValid = true;
    
    if (q.type === 'spell') {
      isValid = q.ans.startsWith(this.typed);
      str = q.ans.split('').map((c, i) => i < this.typed.length ? this.typed[i] : (i === this.typed.length ? '_' : '·')).join(' ');
      this.ui.word.setFontSize('36px').setLetterSpacing(8);
    } else if (q.type === 'fill') {
      isValid = q.ans.startsWith(this.typed);
      str = this.typed === "" ? '_' : this.typed; 
      this.ui.word.setFontSize('36px').setLetterSpacing(8);
    } else if (q.type === 'choice') {
      str = "[ 請輸入 A, B, C 或 D ]";
      this.ui.word.setFontSize('22px').setLetterSpacing(2); 
    } else if (q.type === 'voice') {
      str = "[ 按 Enter 開始錄音 ]";
      this.ui.word.setFontSize('22px').setLetterSpacing(2); 
    }

    this.ui.word.setText(str).setColor(isValid ? '#ffffff' : '#ff4444');
    this.drawInputBg(isValid ? 0x4aa8ff : 0xff4444);
  }

  private handleVoiceInput(transcript: string) {
    const q = this.currentStages[this.stageIdx].questions[this.qIdx];
    const upperTranscript = transcript.toUpperCase();
    const validAnswers = q.accept ? [q.ans, ...q.accept] : [q.ans];
    
    if (validAnswers.some(word => upperTranscript.includes(word))) {
      this.ui.word.setText(q.ans).setColor('#44ff44'); 
      this.attackMonster();
    } else {
      this.ui.word.setText(`聽成: ${transcript}`).setColor('#ff4444');
      this.drawInputBg(0xff4444);
      this.resetCombo();
      this.damagePlayer();
      this.time.delayedCall(1500, () => { if (this.monsterHp > 0 && this.playerHp > 0) this.updateWordDisplay(); });
    }
  }

  private handleInput(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.scene.start('MapScene');
      return;
    }
    if (e.key === 'Enter') {
      if (this.isStageClear) {
        if (this.stageIdx >= this.currentStages.length) {
          this.scene.start('MapScene');
        } else {
          this.stageIdx++;
          this.qIdx = 0;
          this.loadStage();
        }
      } else {
        const q = this.currentStages[this.stageIdx].questions[this.qIdx];
        if (q.type === 'voice' && this.recognition && !this.isListening && !this.isLocked) {
          try { this.recognition.start(); } catch (err) {}
        }
      }
      return;
    }

    if (this.isLocked || this.playerHp <= 0 || this.stageIdx >= this.currentStages.length) return;
    const q = this.currentStages[this.stageIdx].questions[this.qIdx];

    if (e.key === ' ') {
      if (q.speak) this.speak(q.speak);
      return;
    }
    if (e.key === 'Backspace' && (q.type === 'spell' || q.type === 'fill')) {
      this.typed = this.typed.slice(0, -1);
      return this.updateWordDisplay();
    }
    if (e.keyCode >= 65 && e.keyCode <= 90 && q.type !== 'voice') {
      const pressedKey = e.key.toUpperCase();
      if (q.type === 'choice') {
        if (pressedKey === q.ans) {
          this.attackMonster();
        } else {
          this.resetCombo(); 
          this.damagePlayer(); 
        }
      } else if (this.typed.length < q.ans.length) {
        this.typed += pressedKey;
        this.updateWordDisplay();
        if (this.typed === q.ans) {
          this.attackMonster();
        } else if (!q.ans.startsWith(this.typed)) {
          this.resetCombo();
          this.damagePlayer();
        }
      }
    }
  }

  private attackMonster() {
    this.isLocked = true; 
    this.combo++;         
    if (this.combo > 1) {
      this.ui.comboTxt.setText(`${this.combo} COMBO!`).setAlpha(1);
      this.tweens.add({ targets: this.ui.comboTxt, scale: 1.2, yoyo: true, duration: 150 });
      if (this.comboTimer) this.comboTimer.remove();
      this.comboTimer = this.time.delayedCall(5000, () => {
        this.tweens.add({ targets: this.ui.comboTxt, alpha: 0, duration: 500, onComplete: () => this.resetCombo() });
      });
    }

    this.tweens.add({
      targets: this.ui.pBox, x: 550, yoyo: true, duration: 200, 
      onYoyo: () => {
        this.monsterHp -= 50;
        this.monsterHpBar.setHp(this.monsterHp);
        this.showDamage(600, 150, 50, '#ffff00');
        this.cameras.main.shake(100, 0.01);
        
        if (this.monsterHp <= 0) {
          this.ui.mBox.setTint(0x555555);
          this.isStageClear = true; 
          this.hideOptions();
          this.ui.pBox.play('idle'); 
          
          if (this.stageIdx + 1 >= this.currentStages.length) {
             this.ui.msg.setText("🎉 區域完全通關！按 [ Enter ] 回到世界地圖");
             unlockNextLevel(this.currentLevelKey);
          } else {
             this.ui.msg.setText("💥 擊敗怪獸！請按 [ Enter ] 前往下一區");
          }
        } else {
          this.ui.msg.setText(`💪 繼續攻擊！ (剩餘 HP: ${this.monsterHp})`);
          this.hideOptions();
          this.time.delayedCall(300, () => { this.qIdx++; this.loadQuestion(); });
        }
      }
    });
  }

  private damagePlayer() {
    this.playerHp -= 10;
    this.playerHpBar.setHp(this.playerHp);
    this.showDamage(200, 150, 10, '#ff0000');
    this.cameras.main.shake(50, 0.005);
    
    this.tweens.add({ targets: this.ui.pBox, tint: 0xff0000, yoyo: true, duration: 100, onComplete: () => this.ui.pBox.clearTint() });
    if (this.playerHp <= 0) {
      this.ui.msg.setText("💀 Game Over，按 [ ESC ] 回地圖");
      this.ui.pBox.setTint(0x555555);
      this.ui.pBox.anims.stop(); 
    }
  }
}