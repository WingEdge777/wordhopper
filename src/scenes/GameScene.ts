import Phaser from 'phaser';
import { applyRenderZoom, isMobile, isIOS } from '../config/display';
import { Difficulty, DIFFICULTY_CONFIG, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, GROUND_HEIGHT, SPRITE_KEYS } from '../config/constants';
import { COLORS, FONT_BODY, FONT_TYPING, FONT_DISPLAY } from '../config/colors';
import { getTranslation } from '../data/translations';
import { addCrispText } from '../config/text';
import { darker } from '../config/utils';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

const DEBUG_HITBOXES = false;
const TUTORIAL_KEY = 'word-hopper-tutorial-done';

function isTutorialNeeded(): boolean {
  try { return !localStorage.getItem(TUTORIAL_KEY); } catch { return true; }
}

function markTutorialDone(): void {
  try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch { /* noop */ }
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private obstacles: Obstacle[] = [];
  private typingSystem!: TypingSystem;
  private wordSpawner = new WordSpawner();
  private scoreSystem = new ScoreSystem();
  private speedManager = new SpeedManager();
  private obstacleSpawner!: ObstacleSpawner;
  private difficulty: Difficulty = 'easy';
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  private inputInputHandler: ((e: InputEvent) => void) | null = null;
  private inputBlurHandler: (() => void) | null = null;
  private typingLock = false;
  private wordReady = false;
  private tutorial = false;
  private tutorialStarted = false;
  private scoreLabel!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private speedLabel!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private hitLabel!: Phaser.GameObjects.Text;
  private typingText!: Phaser.GameObjects.Text;
  private timingLine!: Phaser.GameObjects.Graphics;
  private flashGfx!: Phaser.GameObjects.Graphics;
  private flashAlpha = 0;
  private flashX = 0;
  private visibilityHandler: (() => void) | null = null;
  private debugGfx!: Phaser.GameObjects.Graphics;
  private groundTiles: Phaser.GameObjects.TileSprite[] = [];
  private distance = 0;
  private elapsedTime = 0;
  private alive = true;
  private tickAccumulator = 0;
  private pendingClear: { obstacle: Obstacle; targetY: number } | null = null;
  private typingObstacle: Obstacle | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { difficulty: Difficulty }): void {
    this.difficulty = data.difficulty || 'easy';
    this.wordSpawner.loadWords(this.difficulty);
  }

  create(): void {
    applyRenderZoom(this);
    this.alive = true;
    this.distance = 0;
    this.elapsedTime = 0;
    this.obstacles = [];
    this.typingObstacle = null;
    this.wordReady = false;
    this.tutorial = isTutorialNeeded();
    this.tutorialStarted = false;
    this.scoreSystem.reset();
    this.speedManager.reset();
    this.speedManager.setBaseMultiplier(DIFFICULTY_CONFIG[this.difficulty].speedMultiplier);
    this.typingSystem = new TypingSystem();
    this.obstacleSpawner = new ObstacleSpawner(this.wordSpawner, this.speedManager);
    this.obstacleSpawner.setDifficulty(this.difficulty);

    this.physics.world.setBounds(0, 0, CANVAS_WIDTH, GROUND_Y);

    this.add.image(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, SPRITE_KEYS.BG_SKY)
      .setDisplaySize(CANVAS_WIDTH, CANVAS_HEIGHT).setDepth(0);

    const cloudGfx = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      const cx = 60 + i * 140;
      const cy = 30 + Math.random() * 50;
      const cw = 40 + Math.random() * 30;
      cloudGfx.fillStyle(0xFFFFFF, 0.5);
      cloudGfx.fillEllipse(cx, cy, cw, cw * 0.5);
      cloudGfx.fillEllipse(cx + cw * 0.3, cy - 5, cw * 0.7, cw * 0.4);
      cloudGfx.fillEllipse(cx - cw * 0.3, cy - 3, cw * 0.6, cw * 0.35);
    }
    cloudGfx.setDepth(1);

    this.groundTiles = [];
    for (let x = -100; x < CANVAS_WIDTH + 200; x += CANVAS_WIDTH) {
      const tile = this.add.tileSprite(x, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT, SPRITE_KEYS.BG_GROUND)
        .setOrigin(0, 0).setDepth(3);
      this.groundTiles.push(tile);
    }

    this.player = new Player(this);

    this.timingLine = this.add.graphics();
    this.timingLine.setDepth(5);

    this.flashGfx = this.add.graphics();
    this.flashGfx.setDepth(6);

    if (DEBUG_HITBOXES) {
      this.debugGfx = this.add.graphics();
      this.debugGfx.setDepth(25);
    }

    const hudX = CANVAS_WIDTH - 154;
    const hudGfx = this.add.graphics();
    hudGfx.fillStyle(COLORS.PRIMARY, 0.85);
    hudGfx.fillRoundedRect(hudX, 6, 148, 42, 16);
    hudGfx.fillStyle(darker(COLORS.PRIMARY, 0.2), 0.3);
    hudGfx.fillRoundedRect(hudX, 26, 148, 20, 10);
    hudGfx.setDepth(20);

    this.scoreLabel = addCrispText(this, hudX + 8, 12, 'SCORE', {
      fontSize: '13px',
      color: '#FFFFFF',
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setDepth(20);

    this.scoreText = addCrispText(this, hudX + 140, 12, '0', {
      fontSize: '13px',
      color: '#FFFFFF',
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(20);

    this.speedLabel = addCrispText(this, hudX + 8, 30, 'SPEED', {
      fontSize: '12px',
      color: '#D1FAE5',
      fontFamily: FONT_BODY,
      fontStyle: 'normal',
    }).setDepth(20);

    this.speedText = addCrispText(this, hudX + 140, 30, '1.0x', {
      fontSize: '12px',
      color: '#D1FAE5',
      fontFamily: FONT_BODY,
      fontStyle: 'normal',
    }).setOrigin(1, 0).setDepth(20);

    this.comboText = addCrispText(this, CANVAS_WIDTH / 2, 28, '', {
      fontSize: '28px',
      color: '#15803D',
      fontFamily: FONT_DISPLAY,
      fontStyle: 'bold',
      padding: { right: 8, left: 2, top: 2, bottom: 2 },
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.hitLabel = addCrispText(this, PLAYER_X, 0, '', {
      fontSize: '20px',
      color: '#34D399',
      fontFamily: FONT_DISPLAY,
      fontStyle: 'bold',
      padding: { right: 8, left: 2, top: 2, bottom: 2 },
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    const typingGfx = this.add.graphics();
    typingGfx.fillStyle(COLORS.PRIMARY, 0.85);
    typingGfx.fillRoundedRect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT - 22, 240, 28, 14);
    typingGfx.setDepth(20);

    this.typingText = addCrispText(this, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 14, '', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontFamily: FONT_TYPING,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20);

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (!this.alive) return;
        if (this.typingLock) return;
        if (e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (this.wordReady) { this.submitWord(); return; }
          if (this.typingSystem.getProgress().selectedWord) {
            this.handleTyping(' ');
          }
          return;
        }
        if (e.key.length !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        this.typingLock = true;
        try { this.handleTyping(e.key); } finally {
          gameInput.value = '';
          requestAnimationFrame(() => { this.typingLock = false; });
        }
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);

      this.inputInputHandler = (e: InputEvent) => {
        if (!this.alive) return;
        if (this.typingLock) return;
        const ch = e.data;
        if (!ch || ch.length !== 1) return;
        if (ch === ' ') {
          if (this.wordReady) { this.submitWord(); gameInput.value = ''; return; }
          if (this.typingSystem.getProgress().selectedWord) {
            this.handleTyping(' ');
          }
          gameInput.value = '';
          return;
        }
        this.typingLock = true;
        try { this.handleTyping(ch); } finally {
          gameInput.value = '';
          requestAnimationFrame(() => { this.typingLock = false; });
        }
      };
      gameInput.addEventListener('input', this.inputInputHandler as EventListener);

      this.inputBlurHandler = () => { if (this.alive && !isIOS()) gameInput.focus(); };
      gameInput.addEventListener('blur', this.inputBlurHandler);
    }

    this.spawnObstacle();

    this.visibilityHandler = () => {
      if (document.hidden && this.alive) {
        this.scene.pause();
      } else if (!document.hidden) {
        this.scene.resume();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    if (isMobile()) {
      (window as any).__wordhopper_jump = () => {
        if (!this.alive) return;
        if (this.wordReady) { this.submitWord(); return; }
        if (this.typingSystem.getProgress().selectedWord) {
          this.handleTyping(' ');
        }
      };
      (window as any).__wordhopper_key = (key: string) => {
        if (!this.alive) return;
        if (this.typingLock) return;
        if (key === ' ') {
          if (this.wordReady) { this.submitWord(); return; }
          if (this.typingSystem.getProgress().selectedWord) {
            this.handleTyping(' ');
          }
          return;
        }
        this.typingLock = true;
        try { this.handleTyping(key); } finally {
          requestAnimationFrame(() => { this.typingLock = false; });
        }
      };
    }
  }

  update(_time: number, delta: number): void {
    if (!this.alive) return;
    const dt = delta / 1000;
    const speed = this.tutorialShouldPause() ? 0 : this.speedManager.getSpeed();

    this.distance += speed * dt;
    if (speed > 0) this.elapsedTime += dt;
    for (const tile of this.groundTiles) {
      tile.tilePositionX += speed * dt;
    }

    this.player.update(0);

    if (speed > 0) {
      this.tickAccumulator += dt;
      if (this.tickAccumulator >= 0.1) {
        this.scoreSystem.addTick();
        this.tickAccumulator -= 0.1;
      }
    } else {
      this.tickAccumulator = 0;
    }

    for (const obstacle of this.obstacles) obstacle.update(dt, speed);
    this.checkPendingClear();
    this.checkCollisions();
    this.updateTimingLine(this.speedManager.getSpeed());
    this.cleanupObstacles();
    this.checkSpawn();
    this.updateHUD();
    if (DEBUG_HITBOXES) this.drawDebug();
    this.updateFlash(dt);
  }

  private checkCollisions(): void {
    const pr = this.player.getHitbox();
    for (const obs of this.obstacles) {
      for (const rect of obs.getRects()) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(pr, rect)) {
          this.die();
          return;
        }
      }
    }
  }

  private drawDebug(): void {
    this.debugGfx.clear();

    const pr = this.player.getHitbox();
    this.debugGfx.lineStyle(2, 0x00ff00, 0.9);
    this.debugGfx.strokeRect(pr.x, pr.y, pr.width, pr.height);

    for (const obs of this.obstacles) {
      for (const rect of obs.getRects()) {
        this.debugGfx.lineStyle(2, 0xff0000, 0.8);
        this.debugGfx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
    }
  }

  private updateFlash(dt: number): void {
    if (this.flashAlpha <= 0) return;
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);
    this.flashGfx.clear();
    if (this.flashAlpha <= 0) return;

    const halfW = 20;
    this.flashGfx.fillStyle(COLORS.PRIMARY_LIGHT, this.flashAlpha);
    this.flashGfx.fillRect(this.flashX - halfW, 0, halfW * 2, GROUND_Y);
    this.flashGfx.fillStyle(COLORS.PRIMARY_LIGHT, this.flashAlpha * 0.3);
    this.flashGfx.fillRect(this.flashX - halfW * 2, 0, halfW * 4, GROUND_Y);
  }

  private triggerFlash(idealX: number, distance: number, windowHalf: number): void {
    const maxDist = windowHalf;
    const normalized = Math.max(0, 1 - distance / maxDist);
    this.flashAlpha = 0.15 + normalized * 0.75;
    this.flashX = idealX;
  }

  private handleTyping(key: string): void {
    const result = this.typingSystem.onKeyPress(key);
    if (result.wrong) {
      this.wordReady = false;
      const obs = this.typingObstacle;
      if (obs) {
        obs.flashWrong(result.selectedWord
          ? (obs.getConfig().word1 === result.selectedWord ? 1 : 2) : 1);
        this.time.delayedCall(50, () => {
          if (!this.typingSystem.getProgress().selectedWord) obs.resetWordDisplay();
        });
      }
      this.updateTypingIndicator();
      return;
    }

    if (this.tutorial && !this.tutorialStarted) {
      this.tutorialStarted = true;
    }

    const obs = this.typingObstacle;
    if (!obs) return;

    const config = obs.getConfig();
    const wordIdx = config.word1 === result.selectedWord ? 1 : 2;
    obs.highlightWord(wordIdx, result.charIndex);
    if (result.charIndex === 1) obs.fadeUnselected(wordIdx);

    if (result.completed) {
      this.wordReady = true;
    }
    this.updateTypingIndicator();
  }

  private submitWord(): void {
    if (!this.wordReady) return;
    if (this.tutorial && this.wordReady && !this.tutorialShouldPause()) return;
    this.wordReady = false;

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) gameInput.value = '';

    const progress = this.typingSystem.getProgress();
    const obs = this.typingObstacle;
    if (!obs || !progress.selectedWord) return;

    const config = obs.getConfig();
    const wordIdx = config.word1 === progress.selectedWord ? 1 : 2;
    const targetY = wordIdx === 1 ? config.word1Y : config.word2Y;

    let perfect = false;
    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight > 0) {
      const speed = this.speedManager.getSpeed();
      const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
      const idealX = obs.getX() - speed * apexTime;
      const windowHalf = Math.max(30, speed * 0.18);
      const dist = Math.abs(PLAYER_X - idealX);
      perfect = dist < windowHalf * 0.3;
      this.triggerFlash(idealX, dist, windowHalf);
    }

    this.player.jumpToWord(targetY);
    this.scoreSystem.addWordBonus(progress.selectedWord, this.speedManager.getSpeedMultiplier(), perfect);
    this.speedManager.onObstacleCleared();
    this.pendingClear = { obstacle: obs, targetY };
    this.typingText.setText('');
    this.updateComboDisplay(perfect, targetY);
    if (this.tutorial) {
      this.tutorial = false;
      markTutorialDone();
    }
    this.spawnObstacle();
  }

  private tutorialShouldPause(): boolean {
    if (!this.tutorial) return false;
    if (!this.tutorialStarted) return true;
    if (!this.wordReady) return false;
    const obs = this.typingObstacle;
    if (!obs) return true;
    const config = obs.getConfig();
    const targetY = this.typingSystem.getProgress().selectedWord
      ? (config.word1 === this.typingSystem.getProgress().selectedWord ? config.word1Y : config.word2Y)
      : config.word1Y;
    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight <= 0) return false;
    const speed = this.speedManager.getSpeed();
    const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
    const idealX = obs.getX() - speed * apexTime;
    return Math.abs(idealX - PLAYER_X) < 3;
  }

  private updateTypingIndicator(): void {
    const progress = this.typingSystem.getProgress();
    if (!progress.selectedWord) {
      if (this.tutorial && !this.tutorialStarted) {
        this.typingText.setText('Type a word on the obstacle');
        this.typingText.setColor('#A7F3D0');
        return;
      }
      this.typingText.setText('');
      return;
    }
    const typed = progress.selectedWord.substring(0, progress.correctChars);
    const remaining = progress.selectedWord.substring(progress.correctChars);
    if (this.wordReady) {
      const zh = getTranslation(progress.selectedWord);
      const display = zh ? `${typed} ${zh}` : typed;
      this.typingText.setText(`${display} → SPACE at green line`);
      this.typingText.setColor('#FDE68A');
    } else {
      this.typingText.setText(`${typed}|${remaining}`);
      this.typingText.setColor('#FFFFFF');
    }
  }

  private spawnObstacle(): void {
    const speed = this.speedManager.getSpeed();
    const isFirstSpawn = this.tutorial && !this.tutorialStarted;
    const config = this.obstacleSpawner.generate(speed, isFirstSpawn);
    const obstacle = new Obstacle(this, config, speed);
    this.obstacles.push(obstacle);
    this.typingObstacle = obstacle;

    if (config.word2) {
      this.typingSystem.setWords(config.word1, config.word2);
    } else {
      this.typingSystem.setSingleWord(config.word1);
    }

    if (isFirstSpawn) this.updateTypingIndicator();
  }

  private getNearestObstacle(): Obstacle | null {
    const upcoming = this.obstacles.filter(o => o.isActive() && o.getX() > PLAYER_X - 10);
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => a.getX() - b.getX());
    return upcoming[0];
  }

  private die(): void {
    this.alive = false;
    this.scoreSystem.breakCombo();
    this.comboText.setText('');
    this.player.die();
    this.cleanupDOMListeners();
    this.time.delayedCall(500, () => {
      this.scene.start('DeathScene', {
        score: this.scoreSystem.getScore(),
        wordsTyped: this.scoreSystem.getWordsTyped(),
        wpm: this.scoreSystem.getWPM(this.elapsedTime),
        bestWord: this.scoreSystem.getBestWord(),
        difficulty: this.difficulty,
      });
    });
  }

  private cleanupObstacles(): void {
    this.obstacles = this.obstacles.filter(o => {
      if (!o.isActive()) { o.destroy(); return false; }
      return true;
    });
  }

  private checkSpawn(): void {
    if (this.typingSystem.hasWords()) return;
    const rightEdge = Math.max(...this.obstacles.map(o => o.getX()), 0);
    if (this.obstacleSpawner.canSpawn(rightEdge)) this.spawnObstacle();
  }

  private updateHUD(): void {
    this.scoreText.setText(this.scoreSystem.getScore().toLocaleString());
    this.speedText.setText(`${this.speedManager.getSpeedMultiplier().toFixed(1)}x`);
  }

  private updateComboDisplay(perfect: boolean, apexY: number): void {
    const combo = this.scoreSystem.getCombo();

    this.comboText.setText(`x${combo} COMBO`);
    this.comboText.setColor(combo >= 5 ? '#B45309' : '#15803D');
    this.comboText.setStroke(combo >= 5 ? '#FEF3C7' : '#FFFFFF', 4);
    this.comboText.setFontSize(combo >= 5 ? '32px' : '28px');

    this.tweens.killTweensOf(this.comboText);
    this.comboText.setScale(1.4);
    this.tweens.add({
      targets: this.comboText,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    if (combo >= 5) {
      this.cameras.main.shake(80, 0.003);
    }

    this.showHitLabel(perfect, apexY);
  }

  private showHitLabel(perfect: boolean, apexY: number): void {
    const labelY = apexY - 12;

    this.hitLabel.setText(perfect ? 'PERFECT!' : 'GOOD');
    this.hitLabel.setPosition(PLAYER_X, labelY);
    this.hitLabel.setColor(perfect ? '#FCD34D' : '#34D399');
    this.hitLabel.setAlpha(1);

    this.tweens.killTweensOf(this.hitLabel);
    this.tweens.add({
      targets: this.hitLabel,
      y: labelY - 40,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
    });
  }

  private updateTimingLine(speed: number): void {
    this.timingLine.clear();
    const obs = this.typingObstacle;
    if (!obs) return;

    const config = obs.getConfig();
    const targetY = this.typingSystem.getProgress().selectedWord
      ? (config.word1 === this.typingSystem.getProgress().selectedWord ? config.word1Y : config.word2Y)
      : config.word1Y;

    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight <= 0) return;

    const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
    const idealX = obs.getX() - speed * apexTime;
    if (idealX < PLAYER_X - 20 || idealX > CANVAS_WIDTH + 50) return;

    const windowHalf = Math.max(30, speed * 0.18);
    const left = Math.max(PLAYER_X, idealX - windowHalf);
    const right = Math.min(CANVAS_WIDTH, idealX + windowHalf);

    const green = COLORS.PRIMARY_LIGHT;
    const breath = this.wordReady
      ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((this.time.now / 800) * Math.PI))
      : 0.8;
    const lineWidth = this.wordReady ? 5 : 3;

    this.timingLine.lineStyle(1, green, 0.3);
    const dashLen = 6;
    const gapLen = 4;
    for (let y = 0; y < GROUND_Y; y += dashLen + gapLen) {
      this.timingLine.lineBetween(left, y, left, Math.min(y + dashLen, GROUND_Y));
      this.timingLine.lineBetween(right, y, right, Math.min(y + dashLen, GROUND_Y));
    }

    this.timingLine.lineStyle(lineWidth, green, breath);
    this.timingLine.lineBetween(idealX, 0, idealX, GROUND_Y);

    this.timingLine.fillStyle(green, 0.04);
    this.timingLine.fillRect(left, 0, right - left, GROUND_Y);
  }

  shutdown(): void {
    this.cleanupDOMListeners();
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private cleanupDOMListeners(): void {
    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      if (this.gameInputHandler) {
        gameInput.removeEventListener('keydown', this.gameInputHandler);
        this.gameInputHandler = null;
      }
      if (this.inputInputHandler) {
        gameInput.removeEventListener('input', this.inputInputHandler as EventListener);
        this.inputInputHandler = null;
      }
      if (this.inputBlurHandler) {
        gameInput.removeEventListener('blur', this.inputBlurHandler);
        this.inputBlurHandler = null;
      }
    }
    delete (window as any).__wordhopper_jump;
    delete (window as any).__wordhopper_key;
  }

  private checkPendingClear(): void {
    if (!this.pendingClear) return;
    const { obstacle, targetY } = this.pendingClear;
    const playerY = this.player.getHitbox().top;
    if (playerY <= targetY) {
      obstacle.clearWords();
      this.pendingClear = null;
    }
  }
}
