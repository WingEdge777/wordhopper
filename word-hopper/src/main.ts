import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: 800,
  height: 450,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  scene: {
    create() {
      const text = this.add.text(400, 225, 'Word Hopper', {
        fontSize: '32px',
        color: '#4ecdc4',
        fontFamily: 'monospace',
      });
      text.setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
