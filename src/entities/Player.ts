import Phaser from 'phaser';
import {
  PLAYER_X,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_COLLISION_SHRINK,
  GROUND_Y,
  GRAVITY,
  SPRITE_KEYS,
} from '../config/constants';

const BW = Math.round(PLAYER_WIDTH * PLAYER_COLLISION_SHRINK);
const BH = Math.round(PLAYER_HEIGHT * PLAYER_COLLISION_SHRINK);

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private dead = false;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.physics.add.sprite(PLAYER_X, GROUND_Y, SPRITE_KEYS.PLAYER_RUN);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.sprite.setDepth(10);
    this.sprite.setGravityY(GRAVITY);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.play(SPRITE_KEYS.PLAYER_RUN_ANIM);
  }

  update(_deltaMs: number): void {
    if (this.sprite.body!.blocked.down && !this.dead) {
      if (!this.sprite.anims.isPlaying || this.sprite.texture.key !== SPRITE_KEYS.PLAYER_RUN) {
        this.sprite.setTexture(SPRITE_KEYS.PLAYER_RUN);
        this.sprite.play(SPRITE_KEYS.PLAYER_RUN_ANIM, true);
      }
    }
  }

  getHitbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - BW / 2,
      this.sprite.y - BH,
      BW,
      BH
    );
  }

  jumpTo(targetY: number): void {
    const height = GROUND_Y - targetY;
    if (height <= 0) return;
    const vy = -Math.sqrt(2 * GRAVITY * height);
    this.sprite.setVelocityY(vy);
    this.sprite.stop();
    this.sprite.setTexture(SPRITE_KEYS.PLAYER_JUMP);
  }

  jumpToWord(wordY: number): void {
    this.jumpTo(wordY);
  }

  die(): void {
    this.dead = true;
    this.sprite.stop();
    this.sprite.setTexture(SPRITE_KEYS.PLAYER_DEAD);
    this.sprite.setVelocityY(0);
    this.sprite.setVelocityX(0);
  }

  reset(): void {
    this.dead = false;
    this.sprite.setPosition(PLAYER_X, GROUND_Y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setTexture(SPRITE_KEYS.PLAYER_RUN);
    this.sprite.play(SPRITE_KEYS.PLAYER_RUN_ANIM);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}