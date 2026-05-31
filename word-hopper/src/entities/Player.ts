import Phaser from 'phaser';
import { PLAYER_X, PLAYER_HEIGHT, PLAYER_WIDTH, GROUND_Y, GRAVITY } from '../config/constants';

export class Player {
  private sprite: Phaser.GameObjects.Rectangle;
  private velocityY = 0;
  private isGrounded = true;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.rectangle(
      PLAYER_X,
      GROUND_Y - PLAYER_HEIGHT / 2,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      0x4ecdc4
    );
    this.sprite.setOrigin(0.5, 1);
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.sprite.y += this.velocityY * dt;

      if (this.sprite.y >= GROUND_Y) {
        this.sprite.y = GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }
  }

  jumpTo(targetY: number): void {
    const height = GROUND_Y - targetY;
    if (height <= 0) return;

    const initialVelocity = -Math.sqrt(2 * GRAVITY * height);
    this.velocityY = initialVelocity;
    this.isGrounded = false;
    this.sprite.y = GROUND_Y;
  }

  jumpToWord(wordY: number): void {
    this.jumpTo(wordY);
  }

  getY(): number {
    return this.sprite.y;
  }

  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite;
  }

  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - PLAYER_WIDTH / 2,
      this.sprite.y - PLAYER_HEIGHT,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  }

  reset(): void {
    this.sprite.y = GROUND_Y;
    this.velocityY = 0;
    this.isGrounded = true;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
