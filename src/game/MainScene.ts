import Phaser from 'phaser';
import { useBattleStore } from '../store/battleStore';
import type { BattleEvent } from '../store/battleStore';
import { LEVELS } from './QuestionData';
import { mapName, stageLabel } from './regions';
import { BASE_DAMAGE } from './battle';
import { SKILLS, comboMultiplier, skillEffect } from './progression';
import type { Member, MemberId } from './party';
import {
  ELEMENT_MONSTER_COLORS, GHOST_COLORS, heroKey, monsterKey, monsterKindFor, monsterName, registerAvatar, registerHero, registerSprites,
} from './art/sprites';
import { AVATAR_ORIGIN_X, avatarKey } from './art/avatar';
import type { AvatarFrame } from './art/avatar';
import { elementDef } from './character';
import type { Character, Element, ElementDef } from './character';
import { useSaveStore } from '../store/saveStore';
import { materialIcon } from './equipment';
import type { MonsterKind } from './art/sprites';
import { BG_LAYERS, GROUND_Y, bgKey, registerBackground, themeName } from './art/backgrounds';
import { PixelBar, afterimage, burst, gather, hitStop, labelStyle, lightning, numStyle, pillar, popText, reducedMotion, screenFlash, shake, shockwave, slashArc, slowMo, textStyle } from './fx';
import { chargeColor, comboFx, hitPitch } from './comboFx';
import { sfx } from './sfx';

// 戰鬥畫面：只負責顯示、動畫與音效。作答邏輯在 battleStore，作答介面在 React (BattleHUD)。

type State = ReturnType<typeof useBattleStore.getState>;

const PLAYER_X = 230;
const MONSTER_X = 580;
const AVATAR_SCALE = 4;

// 隊形：隊長站最前面，其餘隊員往後排、前後錯開，看起來有縱深
const FORMATION = [
  { x: PLAYER_X + 20, dy: 0 },
  { x: PLAYER_X - 55, dy: -16 },
  { x: PLAYER_X - 115, dy: 10 },
  { x: PLAYER_X - 175, dy: -8 },
];

// 畫面上的一位隊員（容器負責位置與衝刺，圖片負責呼吸／擠壓動畫）
interface Fighter {
  id: MemberId;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  idle?: Phaser.Tweens.Tween;
  scale: number;
  homeX: number;
  homeY: number;
  idleKey: string;
  attackKey: string;
  down: boolean;
  koLabel?: Phaser.GameObjects.Text; // 倒下時頭上的「💤 倒下」
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color;
// 傷害可能高達數億：加上千分位
const formatDamage = (n: number) => Math.round(n).toLocaleString('en-US');


export default class MainScene extends Phaser.Scene {
  private layers: { sprite: Phaser.GameObjects.TileSprite; speed: number }[] = [];
  private fighters: Fighter[] = [];
  private character: Character | null = null;
  private tier = 0; // 主角轉職階段（外觀）
  private bossMultText!: Phaser.GameObjects.Text;
  private monster!: Phaser.GameObjects.Container;
  private monsterSprite!: Phaser.GameObjects.Image;
  private monsterShadow!: Phaser.GameObjects.Ellipse;
  private monsterIdle?: Phaser.Tweens.Tween;
  private monsterKind: MonsterKind = 'slime';
  private monsterEl: Element = 'wood';
  private elementBadge!: Phaser.GameObjects.Container;
  private monsterScale = 6;
  private monsterShieldBubble!: Phaser.GameObjects.Arc;
  private shieldBubble!: Phaser.GameObjects.Arc;
  private helper!: Phaser.GameObjects.Text;
  private playerBar!: PixelBar;
  private monsterBar!: PixelBar;
  private playerHpText!: Phaser.GameObjects.Text;
  private monsterNameText!: Phaser.GameObjects.Text;
  private armorText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private comboNum!: Phaser.GameObjects.Text;
  private comboLabel!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private shownGold = 0;
  private region = 0;
  private busy = false; // 攻擊動畫進行中，避免下一隻怪物太早登場
  private chargeGlow?: Phaser.GameObjects.Ellipse; // 拼寫題的蓄力光
  private comboPulse?: Phaser.Tweens.Tween;
  private flameTimer?: Phaser.Time.TimerEvent;

  constructor() { super('MainScene'); }

  private fighterFor(id: MemberId | undefined): Fighter {
    return this.fighters.find(f => f.id === id) ?? this.fighters[0];
  }

  // 接下來要出手的隊員（魔王題由隊長出手）
  private striker(s: State): Fighter {
    const idx = s.isBossQuestion ? 0 : s.attackerIdx;
    return this.fighterFor(s.party[idx]?.id);
  }

  private createFighter(m: Member, slot: number): Fighter {
    const pos = FORMATION[slot] ?? FORMATION[FORMATION.length - 1];
    const isPlayer = m.id === 'player' && this.character !== null;
    if (!isPlayer) registerHero(this, m.id);
    const frame = (f: AvatarFrame) => (isPlayer ? avatarKey(this.character!, f, this.tier) : heroKey(m.id, f));
    const scale = AVATAR_SCALE;
    const homeY = GROUND_Y + pos.dy;
    // 腳下的影子與屬性光環
    this.add.ellipse(pos.x, homeY + 2, 80, 14, 0x000000, 0.3).setDepth(10 + slot);
    const aura = this.add.ellipse(pos.x, homeY + 2, 96, 20, hex(elementDef(m.element).color), 0.3).setDepth(10 + slot);
    this.tweens.add({ targets: aura, scaleX: 1.15, alpha: 0.12, yoyo: true, repeat: -1, duration: 900, delay: slot * 150, ease: 'Sine.easeInOut' });
    const sprite = this.add.image(0, 0, frame('idle')).setOrigin(AVATAR_ORIGIN_X, 1).setScale(scale);
    // 越前面（y 越大）畫在越上層
    const container = this.add.container(pos.x, homeY, [sprite]).setDepth(20 + pos.dy / 100 + (FORMATION.length - slot) * 0.01);
    const idle = this.tweens.add({ targets: sprite, scaleY: scale * 0.96, scaleX: scale * 1.02, yoyo: true, repeat: -1, duration: 600, delay: slot * 120, ease: 'Sine.easeInOut' });
    return { id: m.id, container, sprite, idle, scale, homeX: pos.x, homeY, idleKey: frame('idle'), attackKey: frame('attack'), down: false };
  }

  // 倒下的隊員躺平變灰；重新挑戰時站回來
  private setDown(f: Fighter, down: boolean) {
    if (f.down === down) return;
    f.down = down;
    if (down) {
      // HP 歸零：躺下、變灰，頭上標示「倒下」（倒下的隊員不會出手，回到地圖或重新挑戰會恢復）
      f.idle?.pause();
      this.tweens.add({ targets: f.sprite, angle: -90, y: -8, duration: 400, delay: 200, ease: 'Bounce.easeOut' });
      f.sprite.setTint(0x666677);
      f.koLabel?.destroy();
      f.koLabel = this.add.text(f.homeX, f.homeY - 60, '💤 倒下', labelStyle(16, '#c8c8d8')).setOrigin(0.5).setDepth(40).setAlpha(0);
      this.tweens.add({ targets: f.koLabel, alpha: 1, y: f.homeY - 70, duration: 400, delay: 500 });
    } else {
      f.sprite.setAngle(0).setY(0).clearTint().setTexture(f.idleKey);
      f.idle?.resume();
      f.koLabel?.destroy();
      f.koLabel = undefined;
    }
  }

  create() {
    const s = useBattleStore.getState();
    // 場景重開時物件已被銷毀，特效狀態歸零
    this.chargeGlow = undefined;
    this.comboPulse = undefined;
    this.flameTimer = undefined;
    this.flameLevel = 0;
    // 黃金之路固定用王城的背景
    this.region = s.mode !== 'normal' ? LEVELS.length - 1 : Math.max(0, LEVELS.indexOf(s.levelKey));
    registerSprites(this);
    this.character = useSaveStore.getState().character;
    this.tier = useSaveStore.getState().player.classPath.length;
    if (this.character) registerAvatar(this, this.character, this.tier);
    registerBackground(this, this.region);
    this.tweens.timeScale = 1;
    this.busy = false;
    this.shownGold = s.runGold;

    const { width } = this.scale;
    this.layers = BG_LAYERS.map(({ layer, speed }) => ({
      sprite: this.add.tileSprite(0, 0, 800, 480, bgKey(this.region, layer)).setOrigin(0),
      speed,
    }));

    // 隊伍全員：隊長在最前面
    this.fighters = s.party.map((m, i) => this.createFighter(m, i));
    this.shieldBubble = this.add.circle(PLAYER_X - 40, GROUND_Y - 48, 110).setStrokeStyle(4, 0x7fffd4, 0.9).setFillStyle(0x7fffd4, 0.12).setDepth(21).setVisible(false);
    this.tweens.add({ targets: this.shieldBubble, scale: 1.06, yoyo: true, repeat: -1, duration: 500 });

    this.monsterShadow = this.add.ellipse(MONSTER_X, GROUND_Y + 2, 110, 18, 0x000000, 0.3);
    this.monsterSprite = this.add.image(0, 0, monsterKey('slime', s.monsterElement)).setOrigin(0.5, 1);
    this.monster = this.add.container(MONSTER_X, GROUND_Y, [this.monsterSprite]).setDepth(19);
    // 菁英怪的護盾
    this.monsterShieldBubble = this.add.circle(0, -70, 95).setStrokeStyle(5, 0xffcd4b, 0.9).setFillStyle(0xffcd4b, 0.12).setVisible(false);
    this.monster.add(this.monsterShieldBubble);
    this.tweens.add({ targets: this.monsterShieldBubble, scale: 1.05, yoyo: true, repeat: -1, duration: 450 });

    this.helper = this.add.text(PLAYER_X - 80, GROUND_Y - 110, '🧚', { fontSize: '40px' }).setOrigin(0.5).setDepth(22).setVisible(false);
    this.tweens.add({ targets: this.helper, y: GROUND_Y - 124, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });

    // ---------- 畫面上方 HUD（格鬥遊戲式） ----------
    this.add.image(28, 30, 'heart').setScale(4).setDepth(80);
    // 上方血條是全隊 HP 合計；每位隊員的血量在下方隊伍列
    this.add.text(52, 12, s.party.length > 1 ? `隊伍總 HP（${s.party.length} 人）` : (s.party[0]?.name ?? ''), textStyle(20)).setDepth(80);
    this.playerBar = new PixelBar(this, 24, 54, 250, 16);
    this.playerHpText = this.add.text(274, 32, '', numStyle(12)).setOrigin(1, 0).setDepth(81);
    this.add.image(32, 96, 'coin').setScale(4).setDepth(80);
    this.goldText = this.add.text(54, 84, `${s.runGold}`, numStyle(18, '#ffcd4b')).setDepth(80);

    this.monsterNameText = this.add.text(width - 24, 12, '', textStyle(22)).setOrigin(1, 0).setDepth(80);
    this.elementBadge = this.add.container(0, 0).setDepth(81);
    this.monsterBar = new PixelBar(this, width - 274, 54, 250, 16, true);
    // 首領戰的破甲進度／一般關的第幾隻怪物
    this.armorText = this.add.text(width - 24, 76, '', textStyle(16, '#ffcd4b', 4)).setOrigin(1, 0).setDepth(80);
    this.stageText = this.add.text(width / 2, 88, '', labelStyle(20)).setOrigin(0.5, 0).setDepth(80);

    this.comboNum = this.add.text(36, 150, '', numStyle(40)).setOrigin(0, 0.5).setDepth(85);
    this.comboLabel = this.add.text(40, 190, '', textStyle(18, '#ffcd4b')).setOrigin(0, 0.5).setDepth(85);
    this.bossMultText = this.add.text(40, 222, '', textStyle(18, '#ff5af0')).setOrigin(0, 0.5).setDepth(85);

    const unsubscribe = useBattleStore.subscribe((state, prev) => this.sync(state, prev));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();
      this.tweens.timeScale = 1;
    });
    this.sync(useBattleStore.getState(), null);
  }

  update(_time: number, delta: number) {
    // 雲朵緩慢飄動
    const clouds = this.layers[1];
    if (clouds) clouds.sprite.tilePositionX += delta * 0.006;
  }

  private sync(s: State, prev: State | null) {
    if (!s.active) {
      this.scene.start('MapScene');
      return;
    }
    const stage = s.stages[s.stageIdx];
    if (stage) this.stageText.setText(s.mode === 'skill' ? `魔王挑戰  ${stage.name}`
      : s.mode === 'golden'
      ? `黃金之路  第 ${s.stageIdx + 1} / ${s.stages.length} 關`
      : `${themeName(this.region)}・${mapName(s.levelKey, s.stageIdx)}  ${stageLabel(s.stageIdx)}`);
    this.playerHpText.setText(`${s.playerHp}/${s.playerMaxHp}`);
    if (!prev || s.playerHp !== prev.playerHp) this.playerBar.set(s.playerHp / Math.max(1, s.playerMaxHp), !prev);
    this.shieldBubble.setVisible(s.shield);
    this.monsterShieldBubble.setVisible(s.monsterShield > 0 && s.phase !== 'monsterDown');
    s.party.forEach(m => { const f = this.fighters.find(x => x.id === m.id); if (f) this.setDown(f, m.hp <= 0); });
    this.helper.setVisible(s.assistSource === 'helper' || (s.shield && s.assist !== null));

    this.armorText.setText(this.armorLabel(s)).setColor(s.bossGate > 0 && s.combo < s.bossGate ? '#ff8a8a' : '#ffcd4b');
    if (!prev || s.bossMult !== prev.bossMult) this.bossMultText.setText(s.bossMult > 1 ? `魔王倍率 ×${formatDamage(s.bossMult)}` : '');
    if (prev && s.combo !== prev.combo) this.showCombo(s, prev.combo);
    if (!prev) this.showCombo(s, 0);

    // 打對每個字母：劍上閃光＋音高漸升的提示音，營造「蓄力」感
    if (prev && s.phase === 'answering' && s.question === prev.question && s.typed.length > prev.typed.length && s.question) {
      const progress = s.typed.length / s.question.ans.length;
      sfx.key(progress);
      const f = this.striker(s);
      const color = chargeColor(progress);
      const spark = this.add.image(f.homeX + 40, f.homeY - 70, 'spark').setScale(3 + progress * 3).setTint(color).setDepth(30);
      this.tweens.add({ targets: spark, scale: 0, angle: 90, duration: 220, onComplete: () => spark.destroy() });
      this.tweens.add({ targets: f.sprite, scaleX: f.scale * 1.08, duration: 50, yoyo: true });
      // 蓄力：光圈隨進度變大、換色，光點往角色身上收聚
      gather(this, f.homeX + 10, f.homeY - 50, color, 3 + Math.round(progress * 6));
      this.setCharge(f, progress, color);
    }
    // 換題或打錯字被清掉：蓄力散掉
    if (prev && (s.question !== prev.question || s.typed.length < prev.typed.length)) this.setCharge(null, 0, 0);

    if (s.event && s.event !== prev?.event) this.playEvent(s.event, s);

    if (s.phase === 'gameOver' && prev?.phase !== 'gameOver') this.playDefeat();
    if (s.phase === 'levelClear' && prev?.phase !== 'levelClear') {
      this.time.delayedCall(900, () => this.playVictory());
    }
  }

  private showCombo(s: State, prevCombo: number) {
    if (s.combo < 2) {
      this.setFlames(0);
      if (prevCombo >= 2) {
        // Combo 中斷：數字碎裂往下掉
        this.tweens.add({ targets: [this.comboNum, this.comboLabel], alpha: 0, y: '+=20', duration: 250, onComplete: () => {
          this.comboNum.setText('').setAlpha(1).setY(150);
          this.comboLabel.setText('').setAlpha(1).setY(190);
        } });
      }
      return;
    }
    const tier = comboFx(s.combo);
    const mult = comboMultiplier(s.combo, s.stats.comboStep).toFixed(1);
    this.comboNum.setText(`${s.combo}`).setColor(tier.color).setAlpha(1).setY(150);
    this.comboLabel.setText(`COMBO  x${mult}${tier.label ? `  ${tier.label}` : ''}`).setColor(tier.color).setAlpha(1).setY(190);
    // 等級越高，數字的光暈越強、彈出越大
    this.comboNum.setShadow(0, 0, tier.color, tier.tier * 4, true, true);
    this.comboNum.setScale(1.6 + tier.tier * 0.1);
    this.tweens.add({ targets: this.comboNum, scale: 1, duration: 180, ease: 'Back.easeOut' });
    if (comboFx(prevCombo).tier !== tier.tier && tier.label) {
      sfx.combo(s.combo);
      this.announceTier(tier.label, tier.color, tier.tier);
    }
    this.setFlames(tier.flames ? tier.tier : 0);
  }

  private playEvent(event: BattleEvent, s: State) {
    switch (event.kind) {
      case 'stage': return this.enterStage(s);
      case 'attack': return this.playAttack(event, s);
      case 'hurt': return this.playHurt(event, s);
      case 'skill': return this.playSkill(event);
      case 'shieldHit': return this.playAttack(event, s);
      case 'overtime':
        sfx.wrong();
        popText(this, 400, 230, '超過 20 秒：Combo 中斷', 26, '#ff8a8a', { rise: 20, dur: 1100 });
        return;
      case 'escape':
        sfx.wrong();
        popText(this, MONSTER_X, GROUND_Y - 160, '寶箱逃走了…', 28, '#ffcd4b', { rise: 30, dur: 1200 });
        this.tweens.killTweensOf([this.monster, this.monsterSprite]);
        this.monsterIdle?.stop();
        this.tweens.add({ targets: this.monster, x: MONSTER_X + 420, duration: 700, ease: 'Quad.easeIn' });
        this.tweens.add({ targets: this.monsterSprite, y: -30, duration: 90, yoyo: true, repeat: 3 });
        return;
      case 'shield': return this.playBlocked();
      case 'heal':
        sfx.heal();
        burst(this, PLAYER_X, GROUND_Y - 40, [0x5fd36b, 0xb6f5a8, 0xffffff], 14, { up: true, gravity: -60, speed: 120 });
        popText(this, PLAYER_X, GROUND_Y - 120, `+${event.amount} HP`, 30, '#6ee7a8');
        return;
      case 'guard':
        sfx.shield();
        this.shieldBubble.setScale(0.2);
        this.tweens.add({ targets: this.shieldBubble, scale: 1, duration: 250, ease: 'Back.easeOut' });
        popText(this, PLAYER_X, GROUND_Y - 130, 'SHIELD', 26, '#7fffd4');
        return;
      case 'assist':
        sfx.heal();
        burst(this, PLAYER_X - 80, GROUND_Y - 110, [0x7fffd4, 0xffffff, 0xffcd4b], 16, { speed: 140, gravity: 40 });
        popText(this, PLAYER_X, GROUND_Y - 150, '援軍登場！', 30, '#7fffd4');
        return;
    }
  }

  // ---------- 怪物登場 ----------
  private enterStage(s: State) {
    const stage = s.stages[s.stageIdx];
    if (!stage) return;
    const isBoss = stage.bossMode;
    const isRevenge = !!stage.revenge;
    const isElite = stage.kind === 'elite';
    this.monsterKind = monsterKindFor(s.stageIdx, isBoss, isRevenge, stage.kind === 'treasure', stage.kind === 'final');
    this.monsterScale = this.monsterKind === 'demon' ? 9 : isRevenge ? 10 : isBoss ? 11 : isElite ? 9 : this.monsterKind === 'bat' ? 7 : 7.5;
    const el = elementDef(s.monsterElement);
    this.monsterEl = isRevenge ? 'dark' : s.monsterElement;
    const name = s.mode === 'skill' ? `👑 ${stage.name}` : `${isBoss ? '👑 ' : isElite ? '⭐ 菁英' : ''}${monsterName(this.monsterKind, this.monsterEl)}`;
    this.monsterNameText.setText(name).setColor(isRevenge ? '#c9a8ff' : isBoss ? '#ff8a8a' : isElite || this.monsterKind === 'chest' ? '#ffcd4b' : '#ffffff');
    // 寶箱怪沒有屬性相剋，不顯示徽章
    if (this.monsterKind === 'chest') this.elementBadge.removeAll(true);
    else this.showElementBadge(el.id === this.monsterEl ? el : elementDef(this.monsterEl));
    this.monsterBar.set(1, true);

    const appear = () => {
      // 停掉上一隻怪物還沒播完的擊倒動畫，避免它把新怪物藏起來
      this.tweens.killTweensOf([this.monsterSprite, this.monster]);
      this.monsterIdle?.stop();
      this.monsterSprite.setTexture(monsterKey(this.monsterKind, this.monsterEl)).setScale(this.monsterScale).setAngle(0).setAlpha(1).setY(0);
      this.monsterSprite.setVisible(true);
      this.monsterShadow.setVisible(true).setScale(isBoss ? 1.6 : 1);
      // 從右邊跳進場
      this.monster.setPosition(MONSTER_X + 260, GROUND_Y);
      this.tweens.add({ targets: this.monster, x: MONSTER_X, duration: 380, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: this.monsterSprite, y: -60, duration: 190, yoyo: true, ease: 'Quad.easeOut', onComplete: () => this.startMonsterIdle() });
      if (isBoss) this.bossIntro(isRevenge);
    };

    if (s.stageIdx === 0) {
      appear();
      return;
    }
    // 換關：英雄往前跑，背景視差捲動，再讓下一隻怪物登場
    const wait = this.busy ? 700 : 0;
    this.time.delayedCall(wait, () => {
      const runners = this.fighters.filter(f => !f.down);
      runners.forEach(f => f.sprite.setTexture(f.idleKey).clearTint());
      const run = this.tweens.add({ targets: runners.map(f => f.sprite), y: -10, duration: 90, yoyo: true, repeat: 5 });
      const scroll = { v: 0 };
      this.tweens.add({
        targets: scroll, v: 1, duration: 700, ease: 'Sine.easeInOut',
        onUpdate: (_tw, target: { v: number }) => {
          this.layers.forEach(l => { l.sprite.tilePositionX = l.sprite.getData('base') + target.v * 360 * l.speed; });
        },
        onStart: () => this.layers.forEach(l => l.sprite.setData('base', l.sprite.tilePositionX)),
        onComplete: () => { run.stop(); runners.forEach(f => f.sprite.setY(0)); appear(); },
      });
    });
  }

  // 怪物名字左邊的屬性徽章：屬性色的寶石＋屬性字，登場時彈出
  private showElementBadge(el: ElementDef) {
    this.elementBadge.removeAll(true);
    const x = this.scale.width - 24 - this.monsterNameText.width - 26;
    const gem = this.add.rectangle(0, 0, 30, 30, hex(el.color)).setAngle(45).setStrokeStyle(3, 0x1a1226);
    const shine = this.add.rectangle(-5, -5, 8, 8, hex(el.light)).setAngle(45);
    const label = this.add.text(0, 1, el.name, textStyle(16, '#1a1226', 0)).setOrigin(0.5);
    this.elementBadge.add([gem, shine, label]).setPosition(x, 27).setScale(0);
    this.tweens.add({ targets: this.elementBadge, scale: 1, duration: 300, ease: 'Back.easeOut' });
  }

  private startMonsterIdle() {
    const sc = this.monsterScale;
    const sp = this.monsterSprite;
    this.monsterIdle?.stop();
    if (this.monsterKind === 'bat' || this.monsterKind === 'ghost') {
      this.monsterIdle = this.tweens.add({ targets: sp, y: -26, yoyo: true, repeat: -1, duration: this.monsterKind === 'bat' ? 320 : 900, ease: 'Sine.easeInOut' });
    } else if (this.monsterKind === 'mushroom') {
      this.monsterIdle = this.tweens.add({ targets: sp, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });
    } else {
      this.monsterIdle = this.tweens.add({ targets: sp, scaleX: sc * 1.08, scaleY: sc * 0.9, yoyo: true, repeat: -1, duration: this.monsterKind === 'king' ? 700 : 450, ease: 'Sine.easeInOut' });
    }
  }

  private bossIntro(isRevenge: boolean) {
    sfx.boss();
    shake(this, 600, 0.008);
    screenFlash(this, isRevenge ? 0x5e3aa8 : 0x8f2a3a, 0.45, 900);
    const { width } = this.scale;
    const band = this.add.rectangle(width / 2, 200, width, 70, 0x1a1226, 0.85).setDepth(88).setScale(1, 0);
    const label = this.add.text(width / 2, 200, isRevenge ? '⚠ 復仇魔王來襲 ⚠' : '⚠ WARNING  BOSS ⚠', textStyle(34, isRevenge ? '#c9a8ff' : '#ff5a6e', 7)).setOrigin(0.5).setDepth(89).setAlpha(0);
    this.tweens.add({ targets: band, scaleY: 1, duration: 160 });
    this.tweens.add({ targets: label, alpha: 1, duration: 120, yoyo: true, repeat: 3, hold: 120 });
    this.time.delayedCall(1300, () => {
      this.tweens.add({ targets: [band, label], alpha: 0, duration: 250, onComplete: () => { band.destroy(); label.destroy(); } });
    });
  }

  // ---------- 攻擊 ----------
  private playAttack(event: BattleEvent, s: State) {
    const damage = event.amount ?? 0;
    const killed = s.monsterHp <= 0 || !!event.waveKill;
    const crit = event.crit ?? false;
    const member = s.party.find(m => m.id === event.member);
    const f = this.fighterFor(event.member);
    if (member && s.party.length > 1) popText(this, f.homeX, f.homeY - 140, member.name, 20, elementDef(member.element).light, { rise: 24, dur: 600 });
    if (event.bossQuestion) this.bossQuestionHit(s.bossMult);
    if (event.levelUp) this.time.delayedCall(250, () => {
      sfx.victory();
      burst(this, f.homeX, f.homeY - 60, [0xffcd4b, 0xffffff, 0x4cc9f0], 24, { up: true, gravity: -80, speed: 180 });
      popText(this, f.homeX, f.homeY - 200, `LEVEL UP!  Lv ${event.levelUp}`, 30, '#ffcd4b', { rise: 40, dur: 1400 });
    });
    if (event.guardGained) this.time.delayedCall(350, () => popText(this, PLAYER_X, GROUND_Y - 220, '🛡️ 守護觸發', 22, '#7fffd4', { rise: 20, dur: 900 }));
    if (event.drops && Object.keys(event.drops).length) {
      const text = Object.entries(event.drops).map(([k, v]) => `${materialIcon(k)}+${v}`).join(' ');
      this.time.delayedCall(500, () => popText(this, MONSTER_X, GROUND_Y - 200, text, 22, '#e8e6ff', { rise: 30, dur: 1200 }));
    }
    if (event.fast) popText(this, f.homeX + 40, f.homeY - 175, event.fast >= 1.5 ? 'FAST! ×1.5' : 'QUICK ×1.2', 22, '#7fffd4', { rise: 30, dur: 700 });
    // 職業合作：吃到上一位隊員的接力加成、全員連攜
    if (event.relay) popText(this, f.homeX, f.homeY - 205, event.relay, 20, '#ffe27a', { rise: 24, dur: 900 });
    if (event.chain) this.playChain(event.member);
    this.busy = true;
    f.idle?.pause();
    this.tweens.killTweensOf(f.container);
    const fx = comboFx(s.combo);
    const glow = fx.tier ? hex(fx.color) : chargeColor(1);

    // 蓄力：短暫蹲低、光點收聚、閃一下（0.1 秒，不拖慢答題節奏）
    this.setCharge(null, 0, 0);
    f.sprite.setScale(f.scale * 1.14, f.scale * 0.84);
    gather(this, f.homeX + 10, f.homeY - 50, glow, 8 + fx.tier * 3, 90);
    sfx.release(fx.tier);
    const flash = this.add.image(f.homeX + 10, f.homeY - 50, 'spark').setScale(6 + fx.tier * 2).setTint(glow).setDepth(30).setAlpha(0.9);
    this.tweens.add({ targets: flash, scale: 0, angle: 180, duration: 160, onComplete: () => flash.destroy() });

    const dashDur = Math.max(60, 90 + (PLAYER_X - f.homeX) * 0.4 - fx.tier * 8);
    // 各職業的攻擊方式不同：劍士衝刺斬擊、戰士跳起重擊、弓箭手原地射箭、魔法師施放元素法球
    const classId = member?.classId ?? 'swordsman';
    if (classId !== 'swordsman') {
      this.time.delayedCall(100, () => {
        f.sprite.setScale(f.scale).setTexture(f.attackKey);
        if (classId === 'warrior') this.leap(f, event, s, damage, crit, killed);
        else this.shoot(f, event, s, damage, crit, killed, classId === 'archer' ? 'arrow' : 'orb', member ? hex(elementDef(member.element).light) : glow);
      });
      return;
    }
    this.time.delayedCall(100, () => {
      // 釋放：彈回原形往前衝，combo 越高背後殘影越多
      f.sprite.setScale(f.scale).setTexture(f.attackKey);
      f.container.setDepth(25); // 衝刺時畫在其他隊員前面
      sfx.slash();
      const fromX = f.container.x;
      const fromY = f.container.y;
      for (let i = 0; i < fx.afterimages; i++) {
        const t = (i + 1) / (fx.afterimages + 1);
        afterimage(this, f.sprite, fromX + (MONSTER_X - 150 - fromX) * t, fromY + (GROUND_Y - fromY) * t, fx.slashColor, dashDur * t);
      }
      this.dash(f, event, s, damage, crit, killed, dashDur);
    });
  }

  private dash(f: Fighter, event: BattleEvent, s: State, damage: number, crit: boolean, killed: boolean, dashDur: number) {
    this.tweens.add({
      targets: f.container, x: MONSTER_X - 150, y: GROUND_Y, duration: dashDur, ease: 'Quad.easeIn',
      onComplete: () => {
        if (event.kind === 'shieldHit') this.shieldImpact(damage);
        else this.impact(damage, crit, killed, s);
        this.tweens.add({
          targets: f.container, x: f.homeX, y: f.homeY, duration: 220, delay: 90, ease: 'Quad.easeOut',
          onComplete: () => {
            f.sprite.setTexture(f.idleKey);
            f.container.setDepth(20 + (f.homeY - GROUND_Y) / 100);
            if (!f.down) f.idle?.resume();
            if (!killed) this.busy = false;
          },
        });
      },
    });
  }

  // 攻擊結束：回到待機姿勢；最後一擊時保持 busy，讓擊倒動畫播完
  private settle(f: Fighter, killed: boolean) {
    f.sprite.setTexture(f.idleKey);
    f.container.setDepth(20 + (f.homeY - GROUND_Y) / 100);
    if (!f.down) f.idle?.resume();
    if (!killed) this.busy = false;
  }

  private hitTarget(event: BattleEvent, s: State, damage: number, crit: boolean, killed: boolean) {
    if (event.kind === 'shieldHit') this.shieldImpact(damage);
    else this.impact(damage, crit, killed, s);
  }

  // 戰士：高高跳起、落在怪物面前重擊地面，震波擴散
  private leap(f: Fighter, event: BattleEvent, s: State, damage: number, crit: boolean, killed: boolean) {
    sfx.slash();
    f.container.setDepth(25);
    const landX = MONSTER_X - 140;
    const peakY = GROUND_Y - 150;
    this.tweens.add({ targets: f.container, x: (f.container.x + landX) / 2, y: peakY, duration: 150, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: f.sprite, angle: 360, duration: 300, ease: 'Linear', onComplete: () => f.sprite.setAngle(0) });
    this.time.delayedCall(150, () => {
      this.tweens.add({
        targets: f.container, x: landX, y: GROUND_Y, duration: 130, ease: 'Quad.easeIn',
        onComplete: () => {
          // 落地震波
          const ring = this.add.ellipse(landX + 40, GROUND_Y + 4, 40, 12).setStrokeStyle(4, 0xffcd4b, 0.9).setDepth(24);
          this.tweens.add({ targets: ring, scaleX: 6, scaleY: 3, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
          if (!reducedMotion()) this.cameras.main.shake(140, 0.008);
          burst(this, landX + 30, GROUND_Y, [0xc8a25a, 0xffffff], 10, { speed: 140 });
          this.hitTarget(event, s, damage, crit, killed);
          this.tweens.add({
            targets: f.container, x: f.homeX, y: f.homeY, duration: 240, delay: 120, ease: 'Quad.easeOut',
            onComplete: () => this.settle(f, killed),
          });
        },
      });
    });
  }

  // 弓箭手射箭／魔法師的元素法球：站在原地出手，飛行物命中才算傷害
  private shoot(f: Fighter, event: BattleEvent, s: State, damage: number, crit: boolean, killed: boolean, kind: 'arrow' | 'orb', color: number) {
    const startX = f.homeX + 40;
    const startY = f.homeY - 55;
    const endX = MONSTER_X - 30;
    const endY = GROUND_Y - this.monsterSprite.displayHeight * 0.5;
    const dur = kind === 'arrow' ? 170 : 260;
    // 出手時往後退一點的後座力
    this.tweens.add({ targets: f.container, x: f.homeX - 12, duration: 80, yoyo: true, ease: 'Quad.easeOut' });
    let shot: Phaser.GameObjects.Shape;
    if (kind === 'arrow') {
      sfx.slash();
      shot = this.add.rectangle(startX, startY, 46, 5, 0xfff1c1).setDepth(30);
      shot.setRotation(Math.atan2(endY - startY, endX - startX));
    } else {
      sfx.release(2);
      shot = this.add.circle(startX, startY, 14, color, 0.95).setStrokeStyle(3, 0xffffff, 0.8).setDepth(30);
      this.tweens.add({ targets: shot, scale: 1.3, duration: 90, yoyo: true, repeat: -1 });
    }
    // 拖尾
    const trail = this.time.addEvent({
      delay: 30, loop: true,
      callback: () => {
        const dot = this.add.circle(shot.x, shot.y, kind === 'arrow' ? 3 : 8, kind === 'arrow' ? 0xffffff : color, 0.6).setDepth(29);
        this.tweens.add({ targets: dot, alpha: 0, scale: 0.2, duration: 220, onComplete: () => dot.destroy() });
      },
    });
    this.tweens.add({
      targets: shot, x: endX, y: endY, duration: dur, ease: kind === 'arrow' ? 'Linear' : 'Sine.easeIn',
      onComplete: () => {
        trail.remove();
        shot.destroy();
        if (kind === 'orb') burst(this, endX, endY, [color, 0xffffff], 16, { speed: 200 });
        this.hitTarget(event, s, damage, crit, killed);
        this.time.delayedCall(160, () => this.settle(f, killed));
      },
    });
  }

  private impact(damage: number, crit: boolean, killed: boolean, s: State) {
    // 玩家很快按下一關時，新怪物已經登場，舊攻擊的血條與擊倒動畫就不要再套用
    const sameStage = () => useBattleStore.getState().stageIdx === s.stageIdx;
    const hitX = MONSTER_X - 20;
    const hitY = GROUND_Y - (this.monsterSprite.displayHeight * 0.5);
    const fx = comboFx(s.combo);
    const calm = reducedMotion();
    const pitch = hitPitch(s.combo);
    // 斬擊：combo 越高道數越多（弧 → 十字 → 交錯），顏色跟著等級
    const angles = [-15, 75, 30, -60];
    for (let i = 0; i < fx.slashes; i++) {
      this.time.delayedCall(i * 40, () => slashArc(this, hitX, hitY, crit || i > 0, fx.slashColor, angles[i]));
    }
    if (crit) sfx.crit(pitch); else sfx.hit(Math.min(1.5, damage / BASE_DAMAGE), pitch);
    sfx.comboChord(fx.tier, pitch);
    hitStop(this, (crit ? 120 : 70) + fx.tier * 12);
    if (!calm) shake(this, (crit ? 220 : 120) + fx.tier * 30, (crit ? 0.016 : 0.008) + fx.tier * 0.002);
    if (fx.shockwave) shockwave(this, hitX, hitY, fx.slashColor, 90 + fx.tier * 25, 4 + fx.tier * 2);
    if (fx.lightning) { lightning(this, hitX + 20, hitY, hex(fx.color)); sfx.thunder(); }
    if (fx.pillar) pillar(this, MONSTER_X, GROUND_Y, hex(fx.color));
    if (fx.tier >= 3 && !calm) screenFlash(this, hex(fx.color), 0.12 + (fx.tier - 3) * 0.04, 220);

    // 怪物閃白＋被擊退
    this.monsterSprite.setTexture(`${monsterKey(this.monsterKind, this.monsterEl)}_flash`);
    this.time.delayedCall(80, () => this.monsterSprite.setTexture(monsterKey(this.monsterKind, this.monsterEl)));
    this.tweens.add({ targets: this.monster, x: MONSTER_X + (crit ? 46 : 26), duration: 70, yoyo: true, ease: 'Quad.easeOut' });

    const spark = this.add.image(hitX, hitY, 'spark').setScale(crit ? 14 : 9).setDepth(56).setAngle(Phaser.Math.Between(0, 45));
    this.tweens.add({ targets: spark, scale: 0, angle: '+=90', duration: 220, onComplete: () => spark.destroy() });
    const colors = this.monsterColors();
    burst(this, hitX, hitY, [...colors, 0xffffff, fx.slashColor], Math.round((crit ? 22 : 12) * fx.particles), { speed: (crit ? 260 : 180) + fx.tier * 25 });

    // 傷害數字：combo 等級越高字越大，顏色跟著等級
    const dmgColor = crit ? '#ffcd4b' : fx.tier ? fx.color : '#ffffff';
    popText(this, MONSTER_X + Phaser.Math.Between(-20, 20), hitY - 60, formatDamage(damage), (crit ? 56 : 40) + fx.tier * 5, dmgColor, { numeric: true });
    if (crit) {
      popText(this, MONSTER_X, hitY - 120, 'CRITICAL!', 30, '#ff7a3d', { rise: 40 });
      this.cameras.main.zoomTo(1.06, 80, 'Quad.easeOut', true);
      this.time.delayedCall(160, () => this.cameras.main.zoomTo(1, 200, 'Quad.easeOut', true));
    }

    const waveKill = !!s.event?.waveKill;
    if (sameStage()) this.monsterBar.set(waveKill ? 0 : s.monsterHp / Math.max(1, s.monsterMaxHp));
    if (s.event?.gold) this.flyCoins(s.event.gold, hitX, hitY, s.runGold);
    if (s.event?.armorBroken) this.armorBreak();
    if (killed && sameStage()) this.time.delayedCall(140, () => { this.playKill(s); if (waveKill) this.time.delayedCall(420, () => this.nextWave(s)); });
    else if (killed) this.busy = false;
  }

  // 連攜攻擊：其他站著的隊員一起衝上去補一刀
  private playChain(attackerId: MemberId | undefined) {
    popText(this, 400, 200, `連攜攻擊！×${this.fighters.filter(x => !x.down).length}`, 40, '#7fe8ff', { rise: 30, dur: 1200 });
    sfx.combo(15);
    this.fighters.filter(x => !x.down && x.id !== attackerId).forEach((x, i) => {
      this.time.delayedCall(80 + i * 110, () => {
        afterimage(this, x.sprite, x.container.x, x.container.y, 0x7fe8ff);
        this.tweens.add({
          targets: x.container, x: MONSTER_X - 190 - i * 18, duration: 110, yoyo: true, hold: 60, ease: 'Quad.easeIn',
          onYoyo: () => {
            slashArc(this, MONSTER_X - 20, GROUND_Y - this.monsterSprite.displayHeight * 0.5, false, 0x7fe8ff, 30 - i * 40);
            sfx.slash();
          },
        });
      });
    });
  }

  // 拼寫題蓄力光：跟著出手的隊員，進度越高越大越亮；f 為 null 時散掉
  private setCharge(f: Fighter | null, progress: number, color: number) {
    if (!f || progress <= 0) {
      if (this.chargeGlow) {
        const g = this.chargeGlow;
        this.chargeGlow = undefined;
        this.tweens.killTweensOf(g);
        this.tweens.add({ targets: g, alpha: 0, scale: g.scale * 1.4, duration: 150, onComplete: () => g.destroy() });
      }
      return;
    }
    if (!this.chargeGlow) {
      this.chargeGlow = this.add.ellipse(0, 0, 70, 100, color, 0.25).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    }
    const size = 0.8 + progress * 0.6;
    this.chargeGlow.setPosition(f.homeX + 10, f.homeY - 45).setFillStyle(color, 0.18 + progress * 0.3).setScale(size);
    this.tweens.killTweensOf(this.chargeGlow);
    this.tweens.add({ targets: this.chargeGlow, scale: size * 1.08, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // 達到新的 combo 等級：大字稱號＋震波＋光點
  private announceTier(label: string, color: string, tier: number) {
    const c = hex(color);
    popText(this, 420, 140, label, 44 + tier * 2, color, { rise: 30, dur: 1000 + tier * 100 });
    shockwave(this, 400, 150, c, 160 + tier * 30, 6);
    burst(this, 400, 150, [c, 0xffffff], 10 + tier * 6, { speed: 220, gravity: 120 });
    if (tier >= 3 && !reducedMotion()) screenFlash(this, c, 0.18, 300);
    // 高等級時 combo 數字持續搖擺
    this.comboPulse?.stop();
    this.comboNum.setAngle(0);
    this.comboPulse = tier >= 3
      ? this.tweens.add({ targets: this.comboNum, angle: { from: -3, to: 3 }, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      : undefined;
  }

  // 鬥氣：combo 夠高時，隊伍身上持續冒出往上飄的火光；level 0 代表關閉
  private flameLevel = 0;
  private setFlames(level: number) {
    if (level === this.flameLevel) return;
    this.flameLevel = level;
    this.flameTimer?.remove();
    this.flameTimer = undefined;
    if (level <= 0) {
      this.comboPulse?.stop();
      this.comboPulse = undefined;
      this.comboNum?.setAngle(0);
      return;
    }
    const colors = level >= 5 ? [0xfff36b, 0xffffff, 0xff5af0, 0x7fe8ff] : level >= 4 ? [0x7fe8ff, 0xffffff, 0x4fb3e8]
      : level >= 3 ? [0xff5af0, 0xffa0f8, 0xffffff] : [0xff7a3d, 0xffcd4b, 0xff5a3d];
    this.flameTimer = this.time.addEvent({
      delay: Math.max(50, 130 - level * 15), loop: true, callback: () => {
        const alive = this.fighters.filter(x => !x.down);
        if (!alive.length) return;
        const f = alive[Phaser.Math.Between(0, alive.length - 1)];
        const p = this.add.rectangle(f.container.x + Phaser.Math.Between(-22, 22), f.container.y - Phaser.Math.Between(0, 30), 6, 6, colors[Phaser.Math.Between(0, colors.length - 1)])
          .setDepth(19).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(50, 90), x: p.x + Phaser.Math.Between(-10, 10), scale: 0.3, alpha: 0, duration: 600, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
      },
    });
  }

  // 菁英怪的護盾被削掉一層；剩 0 就碎掉
  private shieldImpact(remaining: number) {
    const hitY = GROUND_Y - this.monsterSprite.displayHeight * 0.5;
    hitStop(this, 60);
    shake(this, 100, 0.006);
    burst(this, MONSTER_X - 60, hitY, [0xffcd4b, 0xffffff], 12, { speed: 200 });
    if (remaining > 0) {
      sfx.shield();
      popText(this, MONSTER_X, hitY - 80, `護盾 ${remaining}`, 30, '#ffcd4b', { rise: 30 });
    } else {
      sfx.crit();
      screenFlash(this, 0xffcd4b, 0.3, 300);
      popText(this, MONSTER_X, hitY - 80, 'BREAK!', 44, '#ffcd4b', { rise: 40 });
    }
    this.busy = false;
  }

  // 魔王題答對：大字顯示累積倍率
  private bossQuestionHit(mult: number) {
    sfx.combo(20);
    screenFlash(this, 0xff5af0, 0.35, 400);
    popText(this, 400, 200, `魔王題 ×${formatDamage(mult)}!`, 44, '#ff5af0', { rise: 30, dur: 1000 });
  }

  private playSkill(event: BattleEvent) {
    if (!event.skill) return;
    const skill = SKILLS[event.skill];
    sfx.heal();
    screenFlash(this, 0x7fffd4, 0.25, 350);
    burst(this, PLAYER_X, GROUND_Y - 60, [0x7fffd4, 0xffffff, 0xffcd4b], 20, { up: true, gravity: -40, speed: 160 });
    this.banner(`${skill.icon} ${skill.name}`, '#7fffd4');
    if (skillEffect(event.skill, 1).shield) {
      this.shieldBubble.setScale(0.2);
      this.tweens.add({ targets: this.shieldBubble, scale: 1, duration: 250, ease: 'Back.easeOut' });
    }
  }

  // 畫面中央的橫幅提示（敵人回合、技能名稱）
  private banner(text: string, color: string) {
    const { width } = this.scale;
    const band = this.add.rectangle(width / 2, 250, width, 54, 0x1a1226, 0.8).setDepth(88).setScale(1, 0);
    const label = this.add.text(width / 2, 250, text, textStyle(28, color, 6)).setOrigin(0.5).setDepth(89);
    this.tweens.add({ targets: band, scaleY: 1, duration: 120 });
    this.time.delayedCall(650, () => {
      this.tweens.add({ targets: [band, label], alpha: 0, duration: 200, onComplete: () => { band.destroy(); label.destroy(); } });
    });
  }

  private armorLabel(s: State): string {
    if (s.bossGate > 0) return s.combo >= s.bossGate ? `💥 已破甲  combo ${s.combo}` : `🛡 連擊破甲 ${s.combo}/${s.bossGate}`;
    if (s.waves > 1) return `第 ${s.wave}/${s.waves} 隻${s.blessed ? '  ✨ 祝福中' : ''}`;
    return s.blessed ? '✨ 祝福中' : '';
  }

  // 首領戰：combo 剛好達到門檻，盔甲碎裂
  private armorBreak() {
    sfx.crit(1.5);
    screenFlash(this, 0xffcd4b, 0.35, 300);
    shockwave(this, MONSTER_X, GROUND_Y - this.monsterSprite.displayHeight / 2, 0xffcd4b, 220, 8);
    popText(this, 400, 170, '💥 破甲！傷害全開', 44, '#ffcd4b', { rise: 30, dur: 1400 });
  }

  // 一般關的下一隻怪物：從右邊跳進場（同一關，不換背景）
  private nextWave(s: State) {
    const now = useBattleStore.getState();
    if (now.stageIdx !== s.stageIdx || !now.active) return;
    this.tweens.killTweensOf([this.monsterSprite, this.monster]);
    this.monsterIdle?.stop();
    this.monsterSprite.setTexture(monsterKey(this.monsterKind, this.monsterEl)).setScale(this.monsterScale).setAngle(0).setAlpha(1).setY(0).setVisible(true);
    this.monsterShadow.setVisible(true).setScale(1);
    this.monsterBar.set(1, true);
    this.monster.setPosition(MONSTER_X + 260, GROUND_Y);
    this.tweens.add({ targets: this.monster, x: MONSTER_X, duration: 260, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.monsterSprite, y: -50, duration: 150, yoyo: true, ease: 'Quad.easeOut', onComplete: () => this.startMonsterIdle() });
  }

  private playKill(s: State) {
    const stage = s.stages[s.stageIdx];
    const isBoss = !!stage?.bossMode;
    slowMo(this, isBoss ? 700 : 380, 0.3);
    sfx.kill();
    this.monsterIdle?.stop();
    const cx = MONSTER_X;
    const cy = GROUND_Y - this.monsterSprite.displayHeight / 2;
    this.monsterSprite.setTexture(`${monsterKey(this.monsterKind, this.monsterEl)}_flash`);
    this.tweens.add({
      targets: this.monsterSprite, scaleX: this.monsterScale * 1.3, scaleY: this.monsterScale * 0.2, alpha: 0, duration: 260, ease: 'Quad.easeIn',
      onComplete: () => {
        this.busy = false;
        if (useBattleStore.getState().stageIdx !== s.stageIdx) return;
        this.monsterSprite.setVisible(false);
        this.monsterShadow.setVisible(false);
      },
    });
    burst(this, cx, cy, [...this.monsterColors(), 0xffffff, 0x1a1226], isBoss ? 60 : 30, { speed: isBoss ? 340 : 240, size: isBoss ? 14 : 10 });
    screenFlash(this, 0xffffff, isBoss ? 0.6 : 0.35, isBoss ? 400 : 200);
    if (isBoss) {
      shake(this, 500, 0.02);
      const ko = this.add.text(400, 210, 'K.O.!', textStyle(96, '#ffcd4b', 10)).setOrigin(0.5).setDepth(95).setScale(3).setAlpha(0);
      this.tweens.add({ targets: ko, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      this.tweens.add({ targets: ko, alpha: 0, delay: 1300, duration: 400, onComplete: () => ko.destroy() });
      sfx.victory();
    } else {
      popText(this, cx, cy - 80, 'DEFEATED', 28, '#ffffff', { rise: 40 });
    }
  }

  private flyCoins(gold: number, x: number, y: number, total: number) {
    const n = Math.min(8, Math.max(1, Math.ceil(gold / 4)));
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x, y, 'coin').setScale(4).setDepth(75);
      const midX = x + Phaser.Math.Between(-80, 80);
      const midY = y - Phaser.Math.Between(40, 120);
      this.tweens.add({
        targets: c, x: midX, y: midY, duration: 220, ease: 'Quad.easeOut', delay: i * 30,
        onComplete: () => this.tweens.add({
          targets: c, x: 32, y: 96, scale: 2, duration: 380, ease: 'Quad.easeIn',
          onComplete: () => {
            c.destroy();
            if (i === 0) sfx.coin();
            if (i === n - 1) this.bumpGold(total);
          },
        }),
      });
    }
  }

  private bumpGold(total: number) {
    const obj = { v: this.shownGold };
    this.shownGold = total;
    this.tweens.add({ targets: obj, v: total, duration: 300, onUpdate: () => this.goldText.setText(`${Math.round(obj.v)}`) });
    this.goldText.setScale(1.3);
    this.tweens.add({ targets: this.goldText, scale: 1, duration: 200 });
  }

  // ---------- 受傷 ----------
  private monsterLunge(onContact: () => void) {
    this.tweens.add({
      targets: this.monster, x: PLAYER_X + 150, duration: 120, ease: 'Quad.easeIn',
      onComplete: () => {
        onContact();
        this.tweens.add({ targets: this.monster, x: MONSTER_X, duration: 260, ease: 'Quad.easeOut' });
      },
    });
  }

  private playHurt(event: BattleEvent, s: State) {
    sfx.wrong();
    const target = s.party.find(m => m.id === event.member);
    this.monsterLunge(() => {
      sfx.hurt();
      hitStop(this, 60);
      shake(this, 180, 0.014);
      screenFlash(this, 0xff2a4a, 0.3, 300);
      const f = this.fighterFor(event.member);
      const knockedOut = (target?.hp ?? 1) <= 0;
      f.sprite.setTexture(`${f.idleKey}_flash`).setTint(0xff5a6e);
      this.time.delayedCall(120, () => { if (!f.down) f.sprite.setTexture(f.idleKey).clearTint(); else f.sprite.setTexture(f.idleKey).setTint(0x666677); });
      this.tweens.add({ targets: f.container, x: f.homeX - 30, duration: 80, yoyo: true });
      burst(this, f.homeX + 20, f.homeY - 50, [0xff5a6e, 0xffffff], 10, { speed: 160 });
      popText(this, f.homeX, f.homeY - 120, `-${event.amount}`, 38, '#ff5a6e', { numeric: true });
      if (event.taunt) popText(this, f.homeX, f.homeY - 200, '🛡️ 挑釁！替隊友擋下', 20, '#ffcd4b', { rise: 20, dur: 1000 });
      if (target && s.party.length > 1) popText(this, f.homeX, f.homeY - 165, knockedOut ? `${target.name} 倒下了` : target.name, 20, '#ffb0b8', { rise: 20, dur: 800 });
    });
  }

  private playBlocked() {
    sfx.wrong();
    this.monsterLunge(() => {
      sfx.shield();
      hitStop(this, 50);
      shake(this, 100, 0.006);
      burst(this, PLAYER_X + 50, GROUND_Y - 50, [0x7fffd4, 0xffffff], 14, { speed: 200 });
      popText(this, PLAYER_X, GROUND_Y - 130, 'BLOCK!', 34, '#7fffd4');
    });
  }

  private playDefeat() {
    this.time.delayedCall(450, () => {
      this.fighters.forEach(f => this.setDown(f, true));
      screenFlash(this, 0x000000, 0.5, 1200);
    });
  }

  private playVictory() {
    this.fighters.filter(f => !f.down).forEach((f, i) => this.tweens.add({ targets: f.sprite, y: -50, duration: 220, delay: i * 80, yoyo: true, repeat: 2, ease: 'Quad.easeOut' }));
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 180, () => burst(this, Phaser.Math.Between(150, 650), 120, [0xffcd4b, 0x5fd36b, 0x4fb3e8, 0xff5af0, 0xffffff], 24, { speed: 260, gravity: 300 }));
    }
  }

  private monsterColors(): number[] {
    const c = this.monsterKind === 'ghost' ? GHOST_COLORS : ELEMENT_MONSTER_COLORS[this.monsterEl];
    return [hex(c.M), hex(c.L), hex(c.m)];
  }
}
