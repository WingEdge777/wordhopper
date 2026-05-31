import {
  INITIAL_SCROLL_SPEED,
  MAX_SPEED_MULTIPLIER,
  SPEED_INCREMENT,
  SPEED_PHASE1_END,
  SPEED_PHASE2_END,
  SPEED_PHASE2_INTERVAL,
} from '../config/constants';

export class SpeedManager {
  private multiplier = 1.0;
  private distance = 0;
  private obstaclesSinceLastIncrement = 0;

  getSpeed(): number {
    return INITIAL_SCROLL_SPEED * this.multiplier;
  }

  getSpeedMultiplier(): number {
    return this.multiplier;
  }

  getCompressionFactor(): number {
    return 1.0 / Math.sqrt(this.multiplier);
  }

  updateDistance(distance: number): void {
    this.distance = distance;
  }

  onObstacleCleared(distance: number): void {
    this.distance = distance;
    this.obstaclesSinceLastIncrement++;

    if (this.multiplier >= MAX_SPEED_MULTIPLIER) return;

    if (this.distance >= SPEED_PHASE2_END) {
      this.multiplier += SPEED_INCREMENT;
    } else if (this.distance >= SPEED_PHASE1_END) {
      if (this.obstaclesSinceLastIncrement >= SPEED_PHASE2_INTERVAL) {
        this.multiplier += SPEED_INCREMENT;
        this.obstaclesSinceLastIncrement = 0;
      }
    }

    if (this.multiplier > MAX_SPEED_MULTIPLIER) {
      this.multiplier = MAX_SPEED_MULTIPLIER;
    }
  }

  reset(): void {
    this.multiplier = 1.0;
    this.distance = 0;
    this.obstaclesSinceLastIncrement = 0;
  }
}
