import Phaser from 'phaser';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

const MAX_RENDER_RESOLUTION = 2;
const MAX_RENDER_SCALE = 2;

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function getRenderResolution(devicePixelRatio = window.devicePixelRatio || 1): number {
  return Math.min(Math.max(devicePixelRatio, 1), MAX_RENDER_RESOLUTION);
}

export function getDisplaySize(viewportWidth = window.innerWidth): { width: number; height: number } {
  const ratio = isMobile() ? 1.0 : 0.7;
  const width = Math.round(viewportWidth * ratio);
  const height = Math.round(width * (CANVAS_HEIGHT / CANVAS_WIDTH));

  return { width, height };
}

export function getRenderSize(
  displayWidth = getDisplaySize().width,
  devicePixelRatio = window.devicePixelRatio || 1
): { width: number; height: number } {
  const resolution = getRenderResolution(devicePixelRatio);
  const renderScale = Math.min((displayWidth / CANVAS_WIDTH) * resolution, MAX_RENDER_SCALE);

  return {
    width: Math.round(CANVAS_WIDTH * renderScale),
    height: Math.round(CANVAS_HEIGHT * renderScale),
  };
}

export function applyRenderZoom(scene: Phaser.Scene): number {
  const renderWidth = scene.scale.width;
  const renderHeight = scene.scale.height;
  const zoom = renderWidth / CANVAS_WIDTH;
  const camera = scene.cameras.main;

  camera.setViewport(0, 0, renderWidth, renderHeight);
  camera.setZoom(zoom);
  camera.centerOn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  return zoom;
}
