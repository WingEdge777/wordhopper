import Phaser from 'phaser';
import { PLAYER_X, PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_COLLISION_SHRINK, GROUND_Y, GRAVITY, PIXEL_SIZE } from '../config/constants';
import { COLORS } from '../config/colors';
import { drawPixelRect } from '../utils/PixelArt';

const FROG_W = 8;
const FROG_H = 10;
const ART_W = FROG_W * PIXEL_SIZE;
const ART_H = FROG_H * PIXEL_SIZE;
const OFFSET_X = -ART_W / 2;
const OFFSET_Y = -ART_H - 2;

export class Player {
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private velocityY = 0;
  private isGrounded = true;
  private x = PLAYER_X;
  private y = GROUND_Y;
  private dead = false;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(PLAYER_X, GROUND_Y);
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);
    this.container.setDepth(10);
    this.drawIdle();
  }

  private drawIdle(): void {
    const g = this.graphics;
    g.clear();
    const T = COLORS.FROG_BODY;
    const Y = COLORS.FROG_EYE;
    const P = COLORS.FROG_CHEEK;
    const D = COLORS.FROG_LEG;

    drawPixelRect(g, 2, 0, 4, 1, T);
    drawPixelRect(g, 1, 1, 1, 1, T); drawPixelRect(g, 2, 1, 1, 1, Y); drawPixelRect(g, 3, 1, 2, 1, T); drawPixelRect(g, 5, 1, 1, 1, Y); drawPixelRect(g, 6, 1, 1, 1, T);
    drawPixelRect(g, 1, 2, 6, 1, T);
    drawPixelRect(g, 1, 3, 1, 1, T); drawPixelRect(g, 2, 3, 2, 1, P); drawPixelRect(g, 4, 3, 2, 1, T); drawPixelRect(g, 6, 3, 1, 1, P);
    drawPixelRect(g, 1, 4, 6, 1, T);
    drawPixelRect(g, 0, 5, 8, 1, T);
    drawPixelRect(g, 0, 6, 1, 1, D); drawPixelRect(g, 1, 6, 6, 1, T); drawPixelRect(g, 7, 6, 1, 1, D);
    drawPixelRect(g, 1, 7, 6, 1, T);
    drawPixelRect(g, 1, 8, 2, 1, D); drawPixelRect(g, 5, 8, 2, 1, D);
    drawPixelRect(g, 0, 9, 3, 1, D); drawPixelRect(g, 5, 9, 3, 1, D);

    g.setPosition(OFFSET_X, OFFSET_Y);
  }

  private drawJump(): void {
    const g = this.graphics;
    g.clear();
    const T = COLORS.FROG_BODY;
    const Y = COLORS.FROG_EYE;
    const P = COLORS.FROG_CHEEK;
    const D = COLORS.FROG_LEG;

    drawPixelRect(g, 2, 0, 4, 1, T);
    drawPixelRect(g, 1, 1, 1, 1, T); drawPixelRect(g, 2, 1, 1, 1, Y); drawPixelRect(g, 3, 1, 2, 1, T); drawPixelRect(g, 5, 1, 1, 1, Y); drawPixelRect(g, 6, 1, 1, 1, T);
    drawPixelRect(g, 1, 2, 6, 1, T);
    drawPixelRect(g, 1, 3, 1, 1, T); drawPixelRect(g, 2, 3, 2, 1, P); drawPixelRect(g, 4, 3, 2, 1, T); drawPixelRect(g, 6, 3, 1, 1, P);
    drawPixelRect(g, 1, 4, 6, 1, T);
    drawPixelRect(g, 0, 5, 8, 1, T);
    drawPixelRect(g, 0, 6, 1, 1, T); drawPixelRect(g, 1, 6, 6, 1, T); drawPixelRect(g, 7, 6, 1, 1, T);
    drawPixelRect(g, 1, 7, 6, 1, T);
    drawPixelRect(g, 0, 8, 2, 1, D); drawPixelRect(g, 6, 8, 2, 1, D);
    drawPixelRect(g, 0, 9, 1, 1, D); drawPixelRect(g, 7, 9, 1, 1, D);

    g.setPosition(OFFSET_X, OFFSET_Y);
  }

  private drawDead(): void {
    const g = this.graphics;
    g.clear();
    const T = COLORS.FROG_DEAD;
    const W = COLORS.TEXT_PRIMARY;

    drawPixelRect(g, 2, 0, 4, 1, T);
    drawPixelRect(g, 1, 1, 1, 1, T); drawPixelRect(g, 2, 1, 1, 1, W); drawPixelRect(g, 3, 1, 2, 1, T); drawPixelRect(g, 5, 1, 1, 1, W); drawPixelRect(g, 6, 1, 1, 1, T);
    drawPixelRect(g, 1, 2, 6, 1, T);
    drawPixelRect(g, 1, 3, 6, 1, T);
    drawPixelRect(g, 1, 4, 6, 1, T);
    drawPixelRect(g, 0, 5, 8, 1, T);
    drawPixelRect(g, 0, 6, 8, 1, T);
    drawPixelRect(g, 1, 7, 6, 1, T);
    drawPixelRect(g, 0, 8, 8, 1, T);
    drawPixelRect(g, 0, 9, 8, 1, T);

    g.setPosition(OFFSET_X, OFFSET_Y);
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.y += this.velocityY * dt;

      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
        if (!this.dead) {
          this.drawIdle();
        }
      }
    }

    this.container.setPosition(this.x, this.y);
  }

  jumpTo(targetY: number): void {
    const height = GROUND_Y - targetY;
    if (height <= 0) return;

    const initialVelocity = -Math.sqrt(2 * GRAVITY * height);
    this.velocityY = initialVelocity;
    this.isGrounded = false;
    this.y = GROUND_Y;
    this.container.setPosition(this.x, this.y);
    this.drawJump();
  }

  jumpToWord(wordY: number): void {
    this.jumpTo(wordY);
  }

  getY(): number {
    return this.y;
  }

  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getBounds(): Phaser.Geom.Rectangle {
    const sw = PLAYER_WIDTH * PLAYER_COLLISION_SHRINK;
    const sh = PLAYER_HEIGHT * PLAYER_COLLISION_SHRINK;
    return new Phaser.Geom.Rectangle(
      this.x - sw / 2,
      this.y - PLAYER_HEIGHT + (PLAYER_HEIGHT - sh) / 2,
      sw,
      sh
    );
  }

  die(): void {
    this.dead = true;
    this.drawDead();
  }

  reset(): void {
    this.y = GROUND_Y;
    this.velocityY = 0;
    this.isGrounded = true;
    this.dead = false;
    this.container.setPosition(this.x, this.y);
    this.drawIdle();
  }

  destroy(): void {
    this.container.destroy();
  }
}
