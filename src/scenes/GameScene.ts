import Phaser from 'phaser';
import { Difficulty, DIFFICULTY_CONFIG, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, GROUND_HEIGHT, SPRITE_KEYS } from '../config/constants';
import { COLORS, FONT_BODY, FONT_WORD } from '../config/colors';
import { darker } from '../config/utils';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

const DEBUG_HITBOXES = false;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private obstacles: Obstacle[] = [];
  private typingSystem = new TypingSystem();
  private wordSpawner = new WordSpawner();
  private scoreSystem = new ScoreSystem();
  private speedManager = new SpeedManager();
  private obstacleSpawner!: ObstacleSpawner;
  private difficulty: Difficulty = 'easy';
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  private inputBlurHandler: (() => void) | null = null;
  private typingLock = false;
  private wordReady = false;
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private typingText!: Phaser.GameObjects.Text;
  private timingLine!: Phaser.GameObjects.Graphics;
  private flashGfx!: Phaser.GameObjects.Graphics;
  private flashAlpha = 0;
  private flashX = 0;
  private debugGfx!: Phaser.GameObjects.Graphics;
  private groundTiles: Phaser.GameObjects.TileSprite[] = [];
  private distance = 0;
  private elapsedTime = 0;
  private alive = true;
  private tickAccumulator = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { difficulty: Difficulty }): void {
    this.difficulty = data.difficulty || 'easy';
    this.wordSpawner.loadWords(this.difficulty);
  }

  create(): void {
    this.alive = true;
    this.distance = 0;
    this.elapsedTime = 0;
    this.obstacles = [];
    this.wordReady = false;
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

    this.scoreText = this.add.text(hudX + 8, 12, 'SCORE 0', {
      fontSize: '13px',
      color: '#FFFFFF',
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setDepth(20);

    this.speedText = this.add.text(hudX + 8, 30, 'SPEED 1.0x', {
      fontSize: '12px',
      color: '#D1FAE5',
      fontFamily: FONT_BODY,
      fontStyle: 'normal',
    }).setDepth(20);

    const typingGfx = this.add.graphics();
    typingGfx.fillStyle(COLORS.PRIMARY, 0.85);
    typingGfx.fillRoundedRect(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 22, 160, 28, 14);
    typingGfx.setDepth(20);

    this.typingText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 14, '', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: FONT_WORD,
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
        this.handleTyping(e.key);
        gameInput.value = '';
        requestAnimationFrame(() => { this.typingLock = false; });
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);
      this.inputBlurHandler = () => { if (this.alive) gameInput.focus(); };
      gameInput.addEventListener('blur', this.inputBlurHandler);
    }

    this.spawnObstacle();
  }

  update(_time: number, delta: number): void {
    if (!this.alive) return;
    const dt = delta / 1000;
    const speed = this.speedManager.getSpeed();

    this.distance += speed * dt;
    this.elapsedTime += dt;
    for (const tile of this.groundTiles) {
      tile.tilePositionX += speed * dt;
    }

    this.player.update(0);

    this.tickAccumulator += dt;
    if (this.tickAccumulator >= 0.1) {
      this.scoreSystem.addTick();
      this.tickAccumulator -= 0.1;
    }

    for (const obstacle of this.obstacles) obstacle.update(dt, speed);
    this.checkCollisions();
    this.updateTimingLine(speed);
    this.cleanupObstacles();
    if (this.typingSystem.hasWords() && !this.getNearestObstacle()) this.typingSystem.clear();
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
      const nearest = this.getNearestObstacle();
      if (nearest) {
        nearest.flashWrong(result.selectedWord
          ? (nearest.getConfig().word1 === result.selectedWord ? 1 : 2) : 1);
        this.time.delayedCall(50, () => {
          if (!this.typingSystem.getProgress().selectedWord) nearest.resetWordDisplay();
        });
      }
      this.updateTypingIndicator();
      return;
    }

    const nearest = this.getNearestObstacle();
    if (!nearest) return;

    const config = nearest.getConfig();
    const wordIdx = config.word1 === result.selectedWord ? 1 : 2;
    nearest.highlightWord(wordIdx, result.charIndex);
    if (result.charIndex === 1) nearest.fadeUnselected(wordIdx);

    if (result.completed) {
      this.wordReady = true;
    }
    this.updateTypingIndicator();
  }

  private submitWord(): void {
    if (!this.wordReady) return;
    this.wordReady = false;

    const progress = this.typingSystem.getProgress();
    const nearest = this.getNearestObstacle();
    if (!nearest || !progress.selectedWord) return;

    const config = nearest.getConfig();
    const wordIdx = config.word1 === progress.selectedWord ? 1 : 2;
    const targetY = wordIdx === 1 ? config.word1Y : config.word2Y;

    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight > 0) {
      const speed = this.speedManager.getSpeed();
      const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
      const idealX = nearest.getX() - speed * apexTime;
      const windowHalf = Math.max(30, speed * 0.18);
      const dist = Math.abs(PLAYER_X - idealX);
      this.triggerFlash(idealX, dist, windowHalf);
    }

    this.player.jumpToWord(targetY);
    this.scoreSystem.addWordBonus(progress.selectedWord, this.speedManager.getSpeedMultiplier());
    this.speedManager.onObstacleCleared();
    nearest.clearWords();
    this.typingText.setText('');
    this.spawnObstacle();
  }

  private updateTypingIndicator(): void {
    const progress = this.typingSystem.getProgress();
    if (!progress.selectedWord) { this.typingText.setText(''); return; }
    const typed = progress.selectedWord.substring(0, progress.correctChars);
    const remaining = progress.selectedWord.substring(progress.correctChars);
    if (this.wordReady) {
      this.typingText.setText(`${typed} → SPACE at green line`);
      this.typingText.setColor('#FDE68A');
    } else {
      this.typingText.setText(`${typed}|${remaining}`);
      this.typingText.setColor('#FFFFFF');
    }
  }

  private spawnObstacle(): void {
    const speed = this.speedManager.getSpeed();
    const config = this.obstacleSpawner.generate(speed);
    const obstacle = new Obstacle(this, config, speed);
    this.obstacles.push(obstacle);

    if (config.word2) {
      this.typingSystem.setWords(config.word1, config.word2);
    } else {
      this.typingSystem.setSingleWord(config.word1);
    }
  }

  private getNearestObstacle(): Obstacle | null {
    const upcoming = this.obstacles.filter(o => o.isActive() && o.getX() > PLAYER_X - 10);
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => a.getX() - b.getX());
    return upcoming[0];
  }

  private die(): void {
    this.alive = false;
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
    this.scoreText.setText(`SCORE ${this.scoreSystem.getScore().toLocaleString()}`);
    this.speedText.setText(`SPEED ${this.speedManager.getSpeedMultiplier().toFixed(1)}x`);
  }

  private updateTimingLine(speed: number): void {
    this.timingLine.clear();
    const nearest = this.getNearestObstacle();
    if (!nearest) return;

    const config = nearest.getConfig();
    const targetY = this.typingSystem.getProgress().selectedWord
      ? (config.word1 === this.typingSystem.getProgress().selectedWord ? config.word1Y : config.word2Y)
      : config.word1Y;

    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight <= 0) return;

    const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
    const idealX = nearest.getX() - speed * apexTime;
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
  }

  private cleanupDOMListeners(): void {
    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      if (this.gameInputHandler) {
        gameInput.removeEventListener('keydown', this.gameInputHandler);
        this.gameInputHandler = null;
      }
      if (this.inputBlurHandler) {
        gameInput.removeEventListener('blur', this.inputBlurHandler);
        this.inputBlurHandler = null;
      }
    }
  }
}