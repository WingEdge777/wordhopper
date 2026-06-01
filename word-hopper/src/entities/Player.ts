import Phaser from 'phaser';
import { PLAYER_X, PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_COLLISION_SHRINK, GROUND_Y, GRAVITY } from '../config/constants';

export class Player {
  private container: Phaser.GameObjects.Container;
  private velocityY = 0;
  private isGrounded = true;
  private x = PLAYER_X;
  private y = GROUND_Y;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(PLAYER_X, GROUND_Y);
    this.container.setScale(1, 1);

    const s = 3;

    const head = scene.add.circle(0, -PLAYER_HEIGHT + 4, 5, 0xf5d6a8);
    const body = scene.add.rectangle(0, -PLAYER_HEIGHT + 14, 6, 12, 0x4ecdc4);
    const legL = scene.add.rectangle(-3, -3, 3, 6, 0x2d3436);
    const legR = scene.add.rectangle(3, -3, 3, 6, 0x2d3436);
    const armL = scene.add.rectangle(-6, -PLAYER_HEIGHT + 16, 3, 8, 0x4ecdc4);
    armL.angle = -20;
    const armR = scene.add.rectangle(6, -PLAYER_HEIGHT + 16, 3, 8, 0x4ecdc4);
    armR.angle = 20;
    const eye = scene.add.circle(2, -PLAYER_HEIGHT + 3, 1.5, 0x1a1a2e);

    this.container.add([legL, legR, body, armL, armR, head, eye]);
    this.container.setDepth(10);
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

  reset(): void {
    this.y = GROUND_Y;
    this.velocityY = 0;
    this.isGrounded = true;
    this.container.setPosition(this.x, this.y);
  }

  destroy(): void {
    this.container.destroy();
  }
}
