import Phaser from 'phaser';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

const MAX_RENDER_RESOLUTION = 2;
const DISPLAY_WIDTH_RATIO = 0.7;

export function getRenderResolution(devicePixelRatio = window.devicePixelRatio || 1): number {
  return Math.min(Math.max(devicePixelRatio, 1), MAX_RENDER_RESOLUTION);
}

export function getDisplaySize(viewportWidth = window.innerWidth): { width: number; height: number } {
  const width = Math.round(viewportWidth * DISPLAY_WIDTH_RATIO);
  const height = Math.round(width * (CANVAS_HEIGHT / CANVAS_WIDTH));

  return { width, height };
}

export function getRenderSize(
  displayWidth = getDisplaySize().width,
  devicePixelRatio = window.devicePixelRatio || 1
): { width: number; height: number } {
  const resolution = getRenderResolution(devicePixelRatio);
  const renderScale = (displayWidth / CANVAS_WIDTH) * resolution;

  return {
    width: Math.round(CANVAS_WIDTH * renderScale),
    height: Math.round(CANVAS_HEIGHT * renderScale),
  };
}

export function applyRenderZoom(scene: Phaser.Scene): number {
  const zoom = scene.cameras.main.width / CANVAS_WIDTH;

  scene.cameras.main.setZoom(zoom);

  return zoom;
}
