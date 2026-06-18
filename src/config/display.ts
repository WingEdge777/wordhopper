import Phaser from 'phaser';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

const MAX_RENDER_RESOLUTION = 2;
const MAX_RENDER_SCALE = 2;
const MOBILE_HEIGHT_RATIO = 0.45;

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function isIOS(): boolean {
  if (typeof location !== 'undefined' && typeof URLSearchParams !== 'undefined' && new URLSearchParams(location.search).has('ios')) return true;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function getMobileScreenHeight(): number {
  return screen.height || window.innerHeight;
}

export function getRenderResolution(devicePixelRatio = window.devicePixelRatio || 1): number {
  return Math.min(Math.max(devicePixelRatio, 1), MAX_RENDER_RESOLUTION);
}

function snapRenderScale(scale: number): number {
  return Math.min(Math.max(Math.round(scale), 1), MAX_RENDER_SCALE);
}

export function getDisplaySize(viewportWidth = window.innerWidth, _viewportHeight = window.innerHeight): { width: number; height: number } {
  if (isMobile()) {
    const width = viewportWidth;
    const height = Math.round(getMobileScreenHeight() * MOBILE_HEIGHT_RATIO);
    return { width, height };
  }
  const width = Math.round(viewportWidth * 0.7);
  const height = Math.round(width * (CANVAS_HEIGHT / CANVAS_WIDTH));

  return { width, height };
}

/** Effective camera zoom; matches text rasterization scale. */
export function getRenderScale(
  displayWidth = getDisplaySize().width,
  _displayHeight = getDisplaySize().height,
  devicePixelRatio = window.devicePixelRatio || 1
): number {
  const resolution = getRenderResolution(devicePixelRatio);
  const rawScale = Math.min((displayWidth / CANVAS_WIDTH) * resolution, MAX_RENDER_SCALE);
  return snapRenderScale(rawScale);
}

export function getRenderSize(
  displayWidth = getDisplaySize().width,
  displayHeight = getDisplaySize().height,
  devicePixelRatio = window.devicePixelRatio || 1
): { width: number; height: number } {
  const resolution = getRenderResolution(devicePixelRatio);

  if (isMobile()) {
    const renderScaleX = snapRenderScale(Math.min((displayWidth / CANVAS_WIDTH) * resolution, MAX_RENDER_SCALE));
    const renderScaleY = snapRenderScale(Math.min((displayHeight / CANVAS_HEIGHT) * resolution, MAX_RENDER_SCALE));
    return {
      width: Math.round(CANVAS_WIDTH * renderScaleX),
      height: Math.round(CANVAS_HEIGHT * renderScaleY),
    };
  }

  const renderScale = getRenderScale(displayWidth, displayHeight, devicePixelRatio);
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

  const visibleHeight = renderHeight / zoom;
  if (isMobile() && visibleHeight > CANVAS_HEIGHT) {
    camera.centerOn(CANVAS_WIDTH / 2, CANVAS_HEIGHT - visibleHeight / 2);
  } else {
    camera.centerOn(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  return zoom;
}
