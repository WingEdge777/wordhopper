import { describe, it, expect } from 'vitest';
import { SpeedManager } from '../src/systems/SpeedManager';

describe('SpeedManager', () => {
  it('should return initial speed at start', () => {
    const mgr = new SpeedManager();
    expect(mgr.getSpeed()).toBe(200);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });

  it('should increase speed every obstacle', () => {
    const mgr = new SpeedManager();
    mgr.onObstacleCleared();
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.01, 4);
    mgr.onObstacleCleared();
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.02, 4);
  });

  it('should cap speed at 2.5x', () => {
    const mgr = new SpeedManager();
    for (let i = 0; i < 500; i++) {
      mgr.onObstacleCleared();
    }
    expect(mgr.getSpeedMultiplier()).toBeLessThanOrEqual(2.5);
  });

  it('should compute compression factor', () => {
    const mgr = new SpeedManager();
    expect(mgr.getCompressionFactor()).toBe(1.0);
    for (let i = 0; i < 100; i++) {
      mgr.onObstacleCleared();
    }
    const factor = mgr.getCompressionFactor();
    expect(factor).toBeLessThan(1.0);
    expect(factor).toBeCloseTo(1.0 / Math.sqrt(mgr.getSpeedMultiplier()), 4);
  });

  it('should reset', () => {
    const mgr = new SpeedManager();
    mgr.onObstacleCleared();
    mgr.reset();
    expect(mgr.getSpeed()).toBe(200);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });
});
