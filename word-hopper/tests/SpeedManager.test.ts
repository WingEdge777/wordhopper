import { describe, it, expect } from 'vitest';
import { SpeedManager } from '../src/systems/SpeedManager';

describe('SpeedManager', () => {
  it('should return initial speed at start', () => {
    const mgr = new SpeedManager();
    expect(mgr.getSpeed()).toBe(200);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });

  it('should not increase speed before 500m', () => {
    const mgr = new SpeedManager();
    mgr.onObstacleCleared(100);
    mgr.onObstacleCleared(200);
    mgr.onObstacleCleared(300);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });

  it('should increase speed every 3 obstacles between 500-1500m', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(600);
    mgr.onObstacleCleared(600);
    mgr.onObstacleCleared(620);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
    mgr.onObstacleCleared(640);
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.01, 4);
  });

  it('should increase speed every obstacle after 1500m', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(1600);
    mgr.onObstacleCleared(1600);
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.01, 4);
    mgr.onObstacleCleared(1620);
    expect(mgr.getSpeedMultiplier()).toBeCloseTo(1.02, 4);
  });

  it('should cap speed at 2.5x', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(9999);
    for (let i = 0; i < 500; i++) {
      mgr.onObstacleCleared(9999);
    }
    expect(mgr.getSpeedMultiplier()).toBeLessThanOrEqual(2.5);
  });

  it('should compute compression factor', () => {
    const mgr = new SpeedManager();
    expect(mgr.getCompressionFactor()).toBe(1.0);
    mgr.updateDistance(9999);
    for (let i = 0; i < 300; i++) {
      mgr.onObstacleCleared(9999);
    }
    const factor = mgr.getCompressionFactor();
    expect(factor).toBeLessThan(1.0);
    expect(factor).toBeCloseTo(1.0 / Math.sqrt(mgr.getSpeedMultiplier()), 4);
  });

  it('should reset', () => {
    const mgr = new SpeedManager();
    mgr.updateDistance(9999);
    mgr.onObstacleCleared(9999);
    mgr.reset();
    expect(mgr.getSpeed()).toBe(200);
    expect(mgr.getSpeedMultiplier()).toBe(1.0);
  });
});
