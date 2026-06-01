import Phaser from 'phaser';
import { Difficulty, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from '../config/constants';
import { Player } from '../entities/Player';
import { Obstacle, ObstacleConfig } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

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
  private ground!: Phaser.GameObjects.Rectangle;
  private timingLine!: Phaser.GameObjects.Graphics;
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

    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x1a1a2e).setOrigin(0);

    this.ground = this.add.rectangle(
      CANVAS_WIDTH / 2,
      GROUND_Y + 17,
      CANVAS_WIDTH,
      35,
      0x2d3436
    );
    this.add.rectangle(CANVAS_WIDTH / 2, GROUND_Y + 1, CANVAS_WIDTH, 2, 0x636e72);

    this.player = new Player(this);

    this.timingLine = this.add.graphics();
    this.timingLine.setDepth(5);

    const hudBg = this.add.rectangle(CANVAS_WIDTH - 80, 30, 150, 45, 0x000000, 0.6);
    hudBg.setOrigin(0.5);
    this.scoreText = this.add.text(CANVAS_WIDTH - 140, 18, 'Score: 0', {
      fontSize: '16px',
      color: '#4ecdc4',
      fontFamily: 'monospace',
    });
    this.speedText = this.add.text(CANVAS_WIDTH - 140, 36, 'Speed: 1.0x', {
      fontSize: '16px',
      color: '#ffd93d',
      fontFamily: 'monospace',
    });

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

      this.spawnObstacle();
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
    this.scoreText.setText(`Score: ${this.scoreSystem.getScore().toLocaleString()}`);
    this.speedText.setText(`Speed: ${this.speedManager.getSpeedMultiplier().toFixed(1)}x`);
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
    const alpha = proximity < 200 ? 0.8 : 0.35;

    this.timingLine.lineStyle(2, 0x4ecdc4, alpha);
    this.timingLine.lineBetween(timingX, 30, timingX, GROUND_Y);

    this.timingLine.fillStyle(0x4ecdc4, alpha);
    this.timingLine.fillTriangle(timingX - 5, 30, timingX + 5, 30, timingX, 38);
  }
}
