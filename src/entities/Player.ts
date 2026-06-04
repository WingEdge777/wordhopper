import Phaser from 'phaser';
import { PLAYER_X, PLAYER_HEIGHT, PLAYER_WIDTH, GROUND_Y, GRAVITY, SPRITE_KEYS } from '../config/constants';

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private dead = false;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.physics.add.sprite(PLAYER_X, GROUND_Y, SPRITE_KEYS.PLAYER_IDLE);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.sprite.setDepth(10);
    this.sprite.body!.setSize(PLAYER_WIDTH * 0.6, PLAYER_HEIGHT * 0.6);
    this.sprite.body!.setOffset(PLAYER_WIDTH * 0.2, PLAYER_HEIGHT * 0.2);
    this.sprite.setGravityY(GRAVITY);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
  }

  update(_deltaMs: number): void {
    if (this.sprite.body!.blocked.down && !this.dead) {
      this.sprite.setTexture(SPRITE_KEYS.PLAYER_IDLE);
    }
  }

  jumpTo(targetY: number): void {
    const height = GROUND_Y - targetY;
    if (height <= 0) return;
    const vy = -Math.sqrt(2 * GRAVITY * height);
    this.sprite.setVelocityY(vy);
    this.sprite.setTexture(SPRITE_KEYS.PLAYER_JUMP);
  }

  jumpToWord(wordY: number): void {
    this.jumpTo(wordY);
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  die(): void {
    this.dead = true;
    this.sprite.setTexture(SPRITE_KEYS.PLAYER_DEAD);
    this.sprite.setVelocityY(0);
    this.sprite.setVelocityX(0);
  }

  reset(): void {
    this.dead = false;
    this.sprite.setPosition(PLAYER_X, GROUND_Y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setTexture(SPRITE_KEYS.PLAYER_IDLE);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}