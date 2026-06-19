import {
  INITIAL_SCROLL_SPEED,
  MAX_SPEED_MULTIPLIER,
  SPEED_INCREMENT,
} from '../config/constants';

export class SpeedManager {
  private baseMultiplier = 1.0;
  private multiplier = 1.0;

  setBaseMultiplier(m: number): void {
    this.baseMultiplier = m;
  }

  getSpeed(): number {
    return INITIAL_SCROLL_SPEED * this.baseMultiplier * this.multiplier;
  }

  getSpeedMultiplier(): number {
    return this.baseMultiplier * this.multiplier;
  }

  onObstacleCleared(): void {
    if (this.multiplier >= MAX_SPEED_MULTIPLIER) return;

    this.multiplier += SPEED_INCREMENT;

    if (this.multiplier > MAX_SPEED_MULTIPLIER) {
      this.multiplier = MAX_SPEED_MULTIPLIER;
    }
  }

  reset(): void {
    this.baseMultiplier = 1.0;
    this.multiplier = 1.0;
  }
}
