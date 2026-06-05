import Phaser from 'phaser';

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
    resolution: 2,
    ...style,
  });
}
