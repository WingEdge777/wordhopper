import Phaser from 'phaser';
import { applyRenderZoom, isMobile, isIOS } from '../config/display';
import { Difficulty, DIFFICULTY_CONFIG, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, GROUND_HEIGHT, SPRITE_KEYS } from '../config/constants';
import { COLORS, FONT_BODY, FONT_TYPING, FONT_DISPLAY } from '../config/colors';
import {
  DAILY_DIFFICULTY,
  createDailyRng,
  getUtcChallengeDate,
  type GameMode,
} from '../config/daily';
import { getDailyLocalBest } from '../config/dailyScores';
import type { Rng } from '../config/rng';
import { getTranslation } from '../data/translations';
import { addCrispText } from '../config/text';
import { getLocalBestScore } from '../config/localScores';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';
import { startRun } from '../api/runs';
import { playSfx } from '../audio/SoundManager';

export interface GameSceneData {
  difficulty?: Difficulty;
  mode?: GameMode;
  challengeDate?: string;
}

const DEBUG_HITBOXES = false;
const TUTORIAL_KEY = 'word-hopper-tutorial-done';
const BEST_APPROACH_RATIO = 0.90;
const HUD_LABEL_COLOR = '#D1FAE5';
const HUD_VALUE_COLOR = '#FFFFFF';

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
  private mode: GameMode = 'classic';
  private challengeDate = '';
  private dailyRng: Rng | null = null;
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  private inputInputHandler: ((e: InputEvent) => void) | null = null;
  private inputBlurHandler: (() => void) | null = null;
  private typingLock = false;
  private wordReady = false;
  private tutorial = false;
  private tutorialStarted = false;
  private scoreLabel!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private bestLabel!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private speedLabel!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private hitLabel!: Phaser.GameObjects.Text;
  private typedText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private timingLine!: Phaser.GameObjects.Graphics;
  private timingLineDrawKey = '';
  private lastHudScore = -1;
  private lastHudBest = -1;
  private lastHudSpeed = '';
  private flashGfx!: Phaser.GameObjects.Graphics;
  private flashAlpha = 0;
  private flashX = 0;
  private paused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private visibilityHandler: (() => void) | null = null;
  private debugGfx!: Phaser.GameObjects.Graphics;
  private groundTiles: Phaser.GameObjects.TileSprite[] = [];
  private elapsedTime = 0;
  private alive = true;
  private tickAccumulator = 0;
  private pendingClear: { obstacle: Obstacle; targetY: number } | null = null;
  private typingObstacle: Obstacle | null = null;
  private runId: string | null = null;
  private storedLocalBest = 0;
  private bestBreathingActive = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData = {}): void {
    this.mode = data.mode === 'daily' ? 'daily' : 'classic';
    this.challengeDate = this.mode === 'daily'
      ? (data.challengeDate || getUtcChallengeDate())
      : '';
    this.difficulty = this.mode === 'daily'
      ? DAILY_DIFFICULTY
      : (data.difficulty || 'easy');

    this.dailyRng = this.mode === 'daily' ? createDailyRng(this.challengeDate) : null;
    this.wordSpawner.setRng(this.dailyRng);
    this.wordSpawner.loadWords(this.difficulty);
  }

  create(): void {
    applyRenderZoom(this);
    this.alive = true;
    this.paused = false;
    this.pauseOverlay = undefined!;
    this.elapsedTime = 0;
    this.obstacles = [];
    this.typingObstacle = null;
    this.wordReady = false;
    this.timingLineDrawKey = '';
    this.lastHudScore = -1;
    this.lastHudBest = -1;
    this.lastHudSpeed = '';
    // Daily must share the same seeded sequence — skip first-run tutorial.
    this.tutorial = this.mode === 'classic' && isTutorialNeeded();
    this.tutorialStarted = false;
    this.scoreSystem.reset();
    this.speedManager.reset();
    this.speedManager.setBaseMultiplier(DIFFICULTY_CONFIG[this.difficulty].speedMultiplier);
    this.typingSystem = new TypingSystem();
    this.obstacleSpawner = new ObstacleSpawner(this.wordSpawner, this.speedManager);
    this.obstacleSpawner.setDifficulty(this.difficulty);
    this.obstacleSpawner.setRng(this.dailyRng);
    this.storedLocalBest = this.mode === 'daily'
      ? getDailyLocalBest(this.challengeDate)
      : getLocalBestScore(this.difficulty);
    this.bestBreathingActive = false;
    this.runId = null;
    void startRun({
      difficulty: this.difficulty,
      mode: this.mode,
      challengeDate: this.challengeDate,
    }).then((session) => {
      this.runId = session.run_id;
    }).catch(() => {
      this.runId = null;
    });

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
    const hudY = 6;
    const hudW = 148;
    const hudH = 60;
    const hudGfx = this.add.graphics();
    hudGfx.fillStyle(COLORS.PRIMARY, 0.85);
    hudGfx.fillRoundedRect(hudX, hudY, hudW, hudH, 16);
    hudGfx.lineStyle(1, 0xffffff, 0.12);
    hudGfx.lineBetween(hudX + 10, hudY + 20, hudX + hudW - 10, hudY + 20);
    hudGfx.lineBetween(hudX + 10, hudY + 38, hudX + hudW - 10, hudY + 38);
    hudGfx.setDepth(20);

    const rowY = [hudY + 6, hudY + 24, hudY + 42];

    this.bestLabel = addCrispText(this, hudX + 8, rowY[0], 'BEST', {
      fontSize: '12px',
      color: HUD_LABEL_COLOR,
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setDepth(20);

    this.bestText = addCrispText(this, hudX + hudW - 8, rowY[0], this.storedLocalBest.toLocaleString(), {
      fontSize: '12px',
      color: HUD_LABEL_COLOR,
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(20);

    this.scoreLabel = addCrispText(this, hudX + 8, rowY[1], 'SCORE', {
      fontSize: '12px',
      color: HUD_LABEL_COLOR,
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setDepth(20);

    this.scoreText = addCrispText(this, hudX + hudW - 8, rowY[1], '0', {
      fontSize: '13px',
      color: HUD_VALUE_COLOR,
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(20);

    this.speedLabel = addCrispText(this, hudX + 8, rowY[2], 'SPEED', {
      fontSize: '12px',
      color: HUD_LABEL_COLOR,
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setDepth(20);

    this.speedText = addCrispText(this, hudX + hudW - 8, rowY[2], '1.0x', {
      fontSize: '12px',
      color: HUD_LABEL_COLOR,
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
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

    this.typedText = addCrispText(this, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 14, '', {
      fontSize: '16px',
      color: '#4ade80',
      fontFamily: FONT_TYPING,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(20);

    this.remainingText = addCrispText(this, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 14, '', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontFamily: FONT_TYPING,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(20);

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (!this.alive) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (this.paused) {
            this.resumeGame();
          } else {
            this.pauseGame();
          }
          return;
        }
        if (this.paused) {
          gameInput.value = '';
          return;
        }
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
        if (this.paused) {
          gameInput.value = '';
          return;
        }
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
      if (document.hidden && this.alive && !this.paused) {
        this.scene.pause();
      } else if (!document.hidden && !this.paused) {
        this.scene.resume();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    if (isMobile()) {
      window.__wordhopper_togglePause = () => {
        if (!this.alive) return;
        if (this.paused) { this.resumeGame(); } else { this.pauseGame(); }
      };
      window.__wordhopper_jump = () => {
        if (!this.alive || this.paused) return;
        if (this.wordReady) { this.submitWord(); return; }
        if (this.typingSystem.getProgress().selectedWord) {
          this.handleTyping(' ');
        }
      };
      window.__wordhopper_key = (key: string) => {
        if (!this.alive || this.paused) return;
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
    if (!this.alive || this.paused) return;
    const dt = delta / 1000;
    const speed = this.tutorialShouldPause() ? 0 : this.speedManager.getSpeed();

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
    if (this.wordReady) return;
    const result = this.typingSystem.onKeyPress(key);
    if (result.wrong) {
      this.scoreSystem.breakCombo();
      this.comboText.setText('');
      playSfx('wrong', 0.45);
      const obs = this.typingObstacle;
      if (obs && result.selectedWord) {
        const wordIdx = obs.getConfig().word1 === result.selectedWord ? 1 : 2;
        obs.flashWrong(wordIdx);
        this.time.delayedCall(50, () => {
          obs.highlightWord(wordIdx, this.typingSystem.getCharIndex());
        });
      } else if (obs) {
        obs.flashWrong(1);
        this.time.delayedCall(50, () => {
          obs.resetWordDisplay();
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
      playSfx('word', 0.5);
    }
    this.updateTypingIndicator();
  }

  private submitWord(): void {
    if (!this.wordReady) return;
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
    this.wordSpawner.onObstacleCleared();
    this.pendingClear = { obstacle: obs, targetY };
    this.typedText.setText('');
    this.remainingText.setText('');
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
        this.typedText.setText('').setOrigin(1, 0.5);
        this.remainingText.setText('Type a word on the obstacle').setOrigin(0.5, 0.5).setX(CANVAS_WIDTH / 2).setColor('#A7F3D0');
        return;
      }
      this.typedText.setText('');
      this.remainingText.setText('');
      return;
    }
    const typed = progress.selectedWord.substring(0, progress.correctChars);
    const remaining = progress.selectedWord.substring(progress.correctChars);
    if (this.wordReady) {
      const zh = getTranslation(progress.selectedWord);
      const display = zh ? `${typed} ${zh}` : typed;
      this.typedText.setText(display).setOrigin(1, 0.5).setX(CANVAS_WIDTH / 2);
      this.remainingText.setText(' → SPACE at green line').setOrigin(0, 0.5).setX(CANVAS_WIDTH / 2).setColor('#FDE68A');
    } else {
      this.typedText.setText(typed).setOrigin(1, 0.5).setX(CANVAS_WIDTH / 2);
      this.remainingText.setText(`|${remaining}`).setOrigin(0, 0.5).setX(CANVAS_WIDTH / 2).setColor('#FFFFFF');
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

  private pauseGame(): void {
    if (this.paused) return;
    this.paused = true;
    this.scene.pause();
    if (!this.pauseOverlay) {
      const bg = this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.5).setOrigin(0).setDepth(100);
      const text = addCrispText(this, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'PAUSED', {
        fontSize: '24px',
        color: '#FFFFFF',
        fontFamily: FONT_DISPLAY,
        fontStyle: 'bold',
        align: 'center',
        padding: { right: 8, left: 2, top: 2, bottom: 2 },
      }).setOrigin(0.5).setDepth(101);
      this.pauseOverlay = this.add.container(0, 0, [bg, text]).setDepth(100);
    }
    this.pauseOverlay.setVisible(true);
  }

  private resumeGame(): void {
    if (!this.paused) return;
    this.paused = false;
    this.pauseOverlay.setVisible(false);
    this.scene.resume();
  }

  private die(): void {
    this.alive = false;
    this.scoreSystem.breakCombo();
    this.comboText.setText('');
    this.player.die();
    playSfx('die', 0.55);
    this.cleanupDOMListeners();
    this.time.delayedCall(500, () => {
      this.scene.start('DeathScene', {
        score: this.scoreSystem.getScore(),
        wordsTyped: this.scoreSystem.getWordsTyped(),
        wpm: this.scoreSystem.getWPM(this.elapsedTime),
        bestWord: this.scoreSystem.getBestWord(),
        maxCombo: this.scoreSystem.getMaxCombo(),
        totalChars: this.scoreSystem.getTotalChars(),
        durationSec: this.elapsedTime,
        difficulty: this.difficulty,
        runId: this.runId,
        mode: this.mode,
        challengeDate: this.challengeDate,
      });
    });
  }

  private cleanupObstacles(): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      if (o.isActive()) continue;
      if (o === this.typingObstacle) this.typingObstacle = null;
      o.destroy();
      this.obstacles.splice(i, 1);
    }
  }

  private checkSpawn(): void {
    if (this.typingSystem.hasWords()) {
      const obs = this.typingObstacle;
      if (!obs || !this.obstacles.includes(obs) || obs.getX() < PLAYER_X - 10) {
        this.typingSystem.clear();
        this.typingObstacle = null;
        this.wordReady = false;
      }
      if (this.typingSystem.hasWords()) return;
    }
    let rightEdge = 0;
    for (const o of this.obstacles) {
      const x = o.getX();
      if (x > rightEdge) rightEdge = x;
    }
    if (this.obstacleSpawner.canSpawn(rightEdge)) this.spawnObstacle();
  }

  private updateHUD(): void {
    const score = this.scoreSystem.getScore();
    if (score !== this.lastHudScore) {
      this.lastHudScore = score;
      this.scoreText.setText(score.toLocaleString());
    }

    const speedLabel = `${this.speedManager.getSpeedMultiplier().toFixed(1)}x`;
    if (speedLabel !== this.lastHudSpeed) {
      this.lastHudSpeed = speedLabel;
      this.speedText.setText(speedLabel);
    }

    const displayBest = Math.max(this.storedLocalBest, score);
    if (displayBest !== this.lastHudBest) {
      this.lastHudBest = displayBest;
      this.bestText.setText(displayBest.toLocaleString());
    }

    const approaching = this.storedLocalBest > 0
      && score >= this.storedLocalBest * BEST_APPROACH_RATIO
      && score < this.storedLocalBest;
    this.setBestBreathing(approaching);
  }

  private setBestBreathing(active: boolean): void {
    if (active === this.bestBreathingActive) return;
    this.bestBreathingActive = active;

    const targets = [this.bestLabel, this.bestText];
    this.tweens.killTweensOf(targets);

    if (active) {
      targets.forEach((target) => {
        target.setAlpha(1);
      });
      this.tweens.add({
        targets,
        alpha: 0.35,
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      targets.forEach((target) => {
        target.setAlpha(1);
      });
    }
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
    playSfx(perfect ? 'perfect' : 'good', perfect ? 0.6 : 0.5);

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
    const obs = this.typingObstacle;
    if (!obs) {
      if (this.timingLineDrawKey !== '') {
        this.timingLine.clear();
        this.timingLineDrawKey = '';
      }
      this.timingLine.setAlpha(1);
      return;
    }

    const config = obs.getConfig();
    const selected = this.typingSystem.getProgress().selectedWord;
    const targetY = selected
      ? (config.word1 === selected ? config.word1Y : config.word2Y)
      : config.word1Y;

    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight <= 0) {
      if (this.timingLineDrawKey !== '') {
        this.timingLine.clear();
        this.timingLineDrawKey = '';
      }
      return;
    }

    const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
    const idealX = obs.getX() - speed * apexTime;
    if (idealX < PLAYER_X - 20 || idealX > CANVAS_WIDTH + 50) {
      if (this.timingLineDrawKey !== '') {
        this.timingLine.clear();
        this.timingLineDrawKey = '';
      }
      return;
    }

    const windowHalf = Math.max(30, speed * 0.18);
    const left = Math.max(PLAYER_X, idealX - windowHalf);
    const right = Math.min(CANVAS_WIDTH, idealX + windowHalf);
    const lineWidth = this.wordReady ? 5 : 3;
    const drawKey = `${idealX | 0}|${left | 0}|${right | 0}|${lineWidth}`;

    // Redraw geometry only when the guide moved ~1px; breathe via alpha.
    if (drawKey !== this.timingLineDrawKey) {
      this.timingLineDrawKey = drawKey;
      this.timingLine.clear();
      const green = COLORS.PRIMARY_LIGHT;

      // Solid thin rails instead of ~80 lineBetween dashes per frame.
      this.timingLine.fillStyle(green, 0.3);
      this.timingLine.fillRect(left, 0, 1, GROUND_Y);
      this.timingLine.fillRect(right - 1, 0, 1, GROUND_Y);

      this.timingLine.fillStyle(green, 0.04);
      this.timingLine.fillRect(left, 0, Math.max(1, right - left), GROUND_Y);

      this.timingLine.lineStyle(lineWidth, green, 1);
      this.timingLine.lineBetween(idealX, 0, idealX, GROUND_Y);
    }

    const breath = this.wordReady
      ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((this.time.now / 800) * Math.PI))
      : 0.8;
    this.timingLine.setAlpha(breath);
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
    delete window.__wordhopper_jump;
    delete window.__wordhopper_key;
    delete window.__wordhopper_togglePause;
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
