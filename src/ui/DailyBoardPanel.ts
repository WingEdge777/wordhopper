import Phaser from 'phaser';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../config/colors';
import { formatDailyTitle, getUtcChallengeDate } from '../config/daily';
import { getNickname } from '../config/nickname';
import { addCrispText } from '../config/text';
import { hex } from '../config/utils';
import { fetchDailyLeaderboard } from '../api/daily';
import type { LeaderboardEntry } from '../api/leaderboard';
import { playSfx } from '../audio/SoundManager';

const PANEL_W = 168;
const PANEL_H = 320;
const ROW_H = 22;
const MAX_ROWS = 8;

export interface DailyBoardPanelOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  onPlayDaily: () => void;
}

/**
 * Right-side daily leaderboard overlay for the menu canvas.
 * Independent of the centered classic difficulty column.
 */
export class DailyBoardPanel {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly listTexts: Phaser.GameObjects.Text[] = [];
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly selfText: Phaser.GameObjects.Text;
  private readonly challengeDate: string;
  private destroyed = false;

  constructor(options: DailyBoardPanelOptions) {
    this.scene = options.scene;
    this.challengeDate = getUtcChallengeDate();

    const { x, y } = options;
    this.root = this.scene.add.container(x, y).setDepth(20);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.SURFACE, 0.92);
    bg.fillRoundedRect(0, 0, PANEL_W, PANEL_H, 14);
    bg.lineStyle(1.5, COLORS.PRIMARY, 0.25);
    bg.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 14);
    this.root.add(bg);

    const title = addCrispText(this.scene, PANEL_W / 2, 16, formatDailyTitle(this.challengeDate), {
      fontSize: '14px',
      fontFamily: FONT_DISPLAY,
      color: hex(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.root.add(title);

    const subtitle = addCrispText(this.scene, PANEL_W / 2, 34, 'EASY · same words today', {
      fontSize: '9px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.root.add(subtitle);

    for (let i = 0; i < MAX_ROWS; i++) {
      const row = addCrispText(this.scene, 10, 52 + i * ROW_H, '', {
        fontSize: '11px',
        fontFamily: FONT_BODY,
        color: hex(COLORS.TEXT_ON_LIGHT),
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.listTexts.push(row);
      this.root.add(row);
    }

    this.statusText = addCrispText(this.scene, PANEL_W / 2, 52 + MAX_ROWS * ROW_H + 4, 'Loading…', {
      fontSize: '10px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.TEXT_MUTED),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.root.add(this.statusText);

    this.selfText = addCrispText(this.scene, PANEL_W / 2, PANEL_H - 52, '', {
      fontSize: '10px',
      fontFamily: FONT_BODY,
      color: hex(COLORS.PRIMARY),
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.root.add(this.selfText);

    const playBg = this.scene.add.graphics();
    playBg.fillStyle(COLORS.PRIMARY, 1);
    playBg.fillRoundedRect(14, PANEL_H - 36, PANEL_W - 28, 26, 10);
    this.root.add(playBg);

    const playLabel = addCrispText(this.scene, PANEL_W / 2, PANEL_H - 23, 'PLAY DAILY', {
      fontSize: '12px',
      fontFamily: FONT_BODY,
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.root.add(playLabel);

    const hit = this.scene.add.rectangle(
      PANEL_W / 2,
      PANEL_H - 23,
      PANEL_W - 28,
      26,
      0x000000,
      0,
    ).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { this.scene.input.setDefaultCursor('pointer'); });
    hit.on('pointerout', () => { this.scene.input.setDefaultCursor('default'); });
    hit.on('pointerdown', () => {
      playSfx('ui', 0.35);
      options.onPlayDaily();
    });
    this.root.add(hit);

    void this.load();
  }

  destroy(): void {
    this.destroyed = true;
    this.root.destroy(true);
  }

  private async load(): Promise<void> {
    try {
      const data = await fetchDailyLeaderboard(this.challengeDate, MAX_ROWS, { refresh: true });
      if (this.destroyed) return;
      this.render(data.entries);
    } catch {
      if (this.destroyed) return;
      this.statusText.setText('Board offline');
      for (const row of this.listTexts) row.setText('');
      this.selfText.setText('');
    }
  }

  private render(entries: LeaderboardEntry[]): void {
    const nickname = getNickname();
    for (let i = 0; i < MAX_ROWS; i++) {
      const entry = entries[i];
      const row = this.listTexts[i];
      if (!entry) {
        row.setText('');
        continue;
      }
      const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
      const name = entry.nickname.length > 9
        ? `${entry.nickname.slice(0, 8)}…`
        : entry.nickname;
      row.setText(`${medal} ${name}  ${entry.score}`);
      row.setColor(entry.nickname === nickname ? hex(COLORS.PRIMARY) : hex(COLORS.TEXT_ON_LIGHT));
    }

    this.statusText.setText(
      entries.length === 0
        ? 'Be the first today!'
        : `${entries.length} player${entries.length === 1 ? '' : 's'}`,
    );

    const mine = entries.find((entry) => entry.nickname === nickname);
    this.selfText.setText(mine ? `You · #${mine.rank}` : 'You · —');
  }
}
