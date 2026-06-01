import { PIXEL_SIZE } from '../config/constants';
import Phaser from 'phaser';

export function drawPixel(g: Phaser.GameObjects.Graphics, gx: number, gy: number, color: number): void {
  g.fillStyle(color);
  g.fillRect(gx * PIXEL_SIZE, gy * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
}

export function drawPixelRow(g: Phaser.GameObjects.Graphics, gx: number, gy: number, count: number, color: number): void {
  g.fillStyle(color);
  g.fillRect(gx * PIXEL_SIZE, gy * PIXEL_SIZE, count * PIXEL_SIZE, PIXEL_SIZE);
}

export function drawPixelRect(g: Phaser.GameObjects.Graphics, gx: number, gy: number, w: number, h: number, color: number): void {
  g.fillStyle(color);
  g.fillRect(gx * PIXEL_SIZE, gy * PIXEL_SIZE, w * PIXEL_SIZE, h * PIXEL_SIZE);
}

export function colorToHex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}
