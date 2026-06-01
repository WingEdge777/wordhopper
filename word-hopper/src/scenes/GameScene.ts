import Phaser from 'phaser';
import { Difficulty, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, PIXEL_SIZE, GROUND_HEIGHT } from '../config/constants';
import { COLORS, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

interface StarPos { x: number; y: number; }
interface HillPos { x: number; radius: number; y: number; }
interface GrassPos { x: number; y: number; w: number; h: number; }

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
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private typingText!: Phaser.GameObjects.Text;
  private groundGfx!: Phaser.GameObjects.Graphics;
  private timingLine!: Phaser.GameObjects.Graphics;
  private starGfx!: Phaser.GameObjects.Graphics;
  private hillGfx!: Phaser.GameObjects.Graphics;
  private grassGfx!: Phaser.GameObjects.Graphics;
  private stars: StarPos[] = [];
  private hills: HillPos[] = [];
  private grassTufts: GrassPos[] = [];
  private starOffset = 0;
  private hillOffset = 0;
  private grassOffset = 0;
  private distance = 0;
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
    this.obstacles = [];
    this.scoreSystem.reset();
    this.speedManager.reset();
    this.typingSystem = new TypingSystem();
    this.obstacleSpawner = new ObstacleSpawner(this.wordSpawner, this.speedManager);
    this.obstacleSpawner.setDifficulty(this.difficulty);
    this.starOffset = 0;
    this.hillOffset = 0;
    this.grassOffset = 0;

    const skyGfx = this.add.graphics();
    for (let y = 0; y < GROUND_Y; y++) {
      const t = y / GROUND_Y;
      const r = Math.round(0x0f + (0x1e - 0x0f) * t);
      const g = Math.round(0x17 + (0x29 - 0x17) * t);
      const b = Math.round(0x2a + (0x3b - 0x2a) * t);
      skyGfx.fillStyle((r << 16) | (g << 8) | b);
      skyGfx.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    this.stars = [];
    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (GROUND_Y * 0.6),
      });
    }
    this.starGfx = this.add.graphics();
    this.drawStars();

    const moonGfx = this.add.graphics();
    moonGfx.fillStyle(COLORS.MOON, 0.15);
    moonGfx.fillCircle(CANVAS_WIDTH - 80, 60, 20);
    moonGfx.fillStyle(COLORS.MOON, 0.3);
    moonGfx.fillCircle(CANVAS_WIDTH - 80, 60, 12);
    moonGfx.fillStyle(COLORS.MOON, 0.8);
    moonGfx.fillCircle(CANVAS_WIDTH - 80, 60, 6);

    this.hills = [];
    for (let i = 0; i < 6; i++) {
      this.hills.push({
        x: i * 160 + Math.random() * 60,
        radius: 60 + Math.random() * 80,
        y: GROUND_Y + 10,
      });
    }
    this.hillGfx = this.add.graphics();
    this.drawHills();

    this.groundGfx = this.add.graphics();
    this.drawGround();

    this.grassTufts = [];
    for (let i = 0; i < 40; i++) {
      const isTall = Math.random() > 0.5;
      this.grassTufts.push({
        x: Math.random() * CANVAS_WIDTH,
        y: GROUND_Y - (isTall ? 3 : 2),
        w: 2,
        h: isTall ? 3 : 2,
      });
    }
    this.grassGfx = this.add.graphics();
    this.drawGrass();

    this.player = new Player(this);

    this.timingLine = this.add.graphics();
    this.timingLine.setDepth(5);

    const hudBg = this.add.rectangle(70, 25, 130, 34, COLORS.SKY_TOP, 0.8);
    hudBg.setStrokeStyle(1, COLORS.BORDER_ACCENT, 0.5);
    hudBg.setDepth(20);

    this.scoreText = this.add.text(12, 12, 'SCORE 0', {
      fontSize: '14px',
      color: colorToHex(COLORS.PRIMARY),
      fontFamily: FONT_BODY,
    });
    this.scoreText.setDepth(20);

    this.speedText = this.add.text(12, 28, 'SPEED 1.0x', {
      fontSize: '14px',
      color: colorToHex(COLORS.SECONDARY),
      fontFamily: FONT_BODY,
    });
    this.speedText.setDepth(20);

    const typingBg = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12, 120, 20, COLORS.SKY_TOP, 0.8);
    typingBg.setStrokeStyle(1, COLORS.BORDER_ACCENT, 0.5);
    typingBg.setDepth(20);

    this.typingText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12, '', {
      fontSize: '14px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_BODY,
    });
    this.typingText.setOrigin(0.5);
    this.typingText.setDepth(20);

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (!this.alive) return;
        if (this.typingLock) return;
        if (e.key.length !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        this.typingLock = true;
        this.handleTyping(e.key);
        gameInput.value = '';
        requestAnimationFrame(() => { this.typingLock = false; });
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);
      this.inputBlurHandler = () => {
        if (this.alive) gameInput.focus();
      };
      gameInput.addEventListener('blur', this.inputBlurHandler);
    }

    this.spawnObstacle();
  }

  update(_time: number, delta: number): void {
    if (!this.alive) return;

    const dt = delta / 1000;
    const speed = this.speedManager.getSpeed();

    this.distance += speed * dt;
    this.speedManager.updateDistance(this.distance);

    this.starOffset += speed * dt * 0.05;
    this.hillOffset += speed * dt * 0.2;
    this.grassOffset += speed * dt * 1.0;

    this.drawStars();
    this.drawHills();
    this.drawGrass();

    this.player.update(delta);

    this.tickAccumulator += dt;
    if (this.tickAccumulator >= 0.1) {
      this.scoreSystem.addTick();
      this.tickAccumulator -= 0.1;
    }

    for (const obstacle of this.obstacles) {
      obstacle.update(dt);
    }

    this.updateTimingLine(speed);

    this.checkCollisions();
    this.cleanupObstacles();
    this.checkSpawn();
    this.updateHUD();
  }

  private drawStars(): void {
    this.starGfx.clear();
    for (const star of this.stars) {
      const sx = ((star.x - this.starOffset) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      this.starGfx.fillStyle(COLORS.STAR);
      this.starGfx.fillRect(sx, star.y, 2, 2);
    }
  }

  private drawHills(): void {
    this.hillGfx.clear();
    const wrap = CANVAS_WIDTH + 200;
    for (const hill of this.hills) {
      const hx = ((hill.x - this.hillOffset) % wrap + wrap) % wrap - 100;
      this.hillGfx.fillStyle(COLORS.HILLS);
      this.hillGfx.fillCircle(hx, hill.y, hill.radius);
    }
  }

  private drawGround(): void {
    this.groundGfx.clear();
    this.groundGfx.fillStyle(COLORS.GROUND);
    this.groundGfx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);
    this.groundGfx.fillStyle(COLORS.GROUND_EDGE);
    this.groundGfx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2);
    this.groundGfx.fillStyle(COLORS.GRASS, 0.4);
    this.groundGfx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 1);
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      this.groundGfx.fillStyle(COLORS.GROUND_EDGE, 0.15);
      this.groundGfx.fillRect(x, GROUND_Y, 1, GROUND_HEIGHT);
    }
  }

  private drawGrass(): void {
    this.grassGfx.clear();
    for (const tuft of this.grassTufts) {
      const gx = ((tuft.x - this.grassOffset) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      this.grassGfx.fillStyle(COLORS.GRASS, 0.6);
      this.grassGfx.fillRect(gx, tuft.y, tuft.w, tuft.h);
    }
  }

  private handleTyping(key: string): void {
    const result = this.typingSystem.onKeyPress(key);

    if (result.wrong) {
      const nearest = this.getNearestObstacle();
      if (nearest) {
        const wordIdx = this.typingSystem.getProgress().selectedWord
          ? (nearest.getConfig().word1 === this.typingSystem.getProgress().selectedWord ? 1 : 2)
          : 1;
        nearest.flashWrong(wordIdx);
      }
      this.updateTypingIndicator();
      return;
    }

    const nearest = this.getNearestObstacle();
    if (!nearest) return;

    const config = nearest.getConfig();
    const wordIdx = config.word1 === result.selectedWord ? 1 : 2;
    nearest.highlightWord(wordIdx, result.charIndex);

    if (result.charIndex === 1) {
      nearest.fadeUnselected(wordIdx);
    }

    if (result.completed) {
      const targetY = wordIdx === 1 ? config.word1Y : config.word2Y;
      this.player.jumpToWord(targetY);
      this.scoreSystem.addWordBonus(result.selectedWord, this.speedManager.getSpeedMultiplier());
      nearest.clearWords();
      this.typingText.setText('');
      this.spawnObstacle();
    } else {
      this.updateTypingIndicator();
    }
  }

  private updateTypingIndicator(): void {
    const progress = this.typingSystem.getProgress();
    if (!progress.selectedWord) {
      this.typingText.setText('');
      return;
    }
    const typed = progress.selectedWord.substring(0, progress.correctChars);
    const remaining = progress.selectedWord.substring(progress.correctChars);
    this.typingText.setText(`${typed}|${remaining}`);
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
    const upcoming = this.obstacles.filter(
      (o) => o.isActive() && o.getX() > PLAYER_X - 10
    );
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => a.getX() - b.getX());
    return upcoming[0];
  }

  private checkCollisions(): void {
    const playerBounds = this.player.getBounds();

    for (const obstacle of this.obstacles) {
      if (!obstacle.isActive()) continue;
      if (obstacle.getX() < PLAYER_X - 30 || obstacle.getX() > PLAYER_X + 30) continue;

      const upper = obstacle.getUpperBounds();
      const lower = obstacle.getLowerBounds();

      if (upper && Phaser.Geom.Rectangle.Overlaps(playerBounds, upper)) {
        this.die();
        return;
      }
      if (lower && Phaser.Geom.Rectangle.Overlaps(playerBounds, lower)) {
        this.die();
        return;
      }
    }
  }

  private die(): void {
    this.alive = false;
    this.player.die();
    this.time.delayedCall(500, () => {
      this.scene.start('DeathScene', {
        score: this.scoreSystem.getScore(),
        wordsTyped: this.scoreSystem.getWordsTyped(),
        wpm: this.scoreSystem.getWPM(this.distance / this.speedManager.getSpeed()),
        bestWord: this.scoreSystem.getBestWord(),
        difficulty: this.difficulty,
      });
    });
  }

  private cleanupObstacles(): void {
    this.obstacles = this.obstacles.filter((o) => {
      if (!o.isActive()) {
        o.destroy();
        return false;
      }
      return true;
    });
  }

  private checkSpawn(): void {
    if (this.typingSystem.hasWords()) return;
    const rightEdge = Math.max(...this.obstacles.map((o) => o.getX()), 0);
    if (this.obstacleSpawner.canSpawn(rightEdge)) {
      this.spawnObstacle();
    }
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
    const distToTravel = nearest.getX() - PLAYER_X;
    const timeToArrive = distToTravel / speed;

    const timingX = PLAYER_X + speed * (timeToArrive - apexTime);

    if (timingX < PLAYER_X - 20 || timingX > CANVAS_WIDTH + 50) return;

    const proximity = Math.abs(nearest.getX() - PLAYER_X);
    const alpha = proximity < 200 ? 0.7 : 0.3;

    const dashLen = 3;
    const gapLen = 3;
    for (let y = 30; y < GROUND_Y; y += dashLen + gapLen) {
      const endY = Math.min(y + dashLen, GROUND_Y);
      this.timingLine.fillStyle(COLORS.PRIMARY, alpha);
      this.timingLine.fillRect(timingX, y, 2, endY - y);
    }

    this.timingLine.fillStyle(COLORS.PRIMARY, alpha);
    this.timingLine.fillRect(timingX - 3, 28, 8, 2);
    this.timingLine.fillRect(timingX - 1, 26, 4, 2);
  }
}
