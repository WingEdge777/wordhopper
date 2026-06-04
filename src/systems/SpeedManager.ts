import {
  INITIAL_SCROLL_SPEED,
  MAX_SPEED_MULTIPLIER,
  SPEED_INCREMENT,
} from '../config/constants';

export class SpeedManager {
  private multiplier = 1.0;

  getSpeed(): number {
    return INITIAL_SCROLL_SPEED * this.multiplier;
  }

  getSpeedMultiplier(): number {
    return this.multiplier;
  }

  getCompressionFactor(): number {
    return 1.0 / Math.sqrt(this.multiplier);
  }

  onObstacleCleared(): void {
    if (this.multiplier >= MAX_SPEED_MULTIPLIER) return;

    this.multiplier += SPEED_INCREMENT;

    if (this.multiplier > MAX_SPEED_MULTIPLIER) {
      this.multiplier = MAX_SPEED_MULTIPLIER;
    }
  }

  reset(): void {
    this.multiplier = 1.0;
  }
}
