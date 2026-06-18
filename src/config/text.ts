import Phaser from 'phaser';
import { getRenderScale } from './display';

export function snapPixel(value: number): number {
  return Math.round(value);
}

export function addCrispText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.GameObjects.Text {
  return scene.add.text(snapPixel(x), snapPixel(y), text, {
    resolution: getRenderScale(),
    ...style,
  });
}
