# Word Hopper Pixel Nature Night UI Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all flat rectangles and default monospace text with a cohesive Pixel Nature Night aesthetic across all 4 scenes.

**Architecture:** Add a shared `colors.ts` palette and `PixelArt.ts` drawing helper. Replace Player's shape-based body with pixel frog art via Phaser Graphics. Replace Obstacle's plain rectangles with plant-specific pixel art shapes. Add parallax background layers to GameScene. Redesign MenuScene and DeathScene with new colors, fonts, and layout. Load Google Fonts (Press Start 2P, VT323) via index.html.

**Tech Stack:** Phaser 3 (CANVAS renderer), TypeScript, existing Vite build

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `index.html` | Add Google Fonts, update body bg |
| Create | `src/config/colors.ts` | All color constants in one place |
| Create | `src/utils/PixelArt.ts` | Helper for drawing pixel art via Graphics |
| Modify | `src/config/constants.ts` | Add PIXEL_SIZE, font name constants |
| Modify | `src/main.ts` | Update backgroundColor |
| Modify | `src/scenes/BootScene.ts` | New gradient bg, styled progress bar, mini frog, fonts |
| Modify | `src/scenes/MenuScene.ts` | New colors, pixel fonts, frog icon, new button styles |
| Rewrite | `src/scenes/GameScene.ts` | Parallax layers, new HUD, typing indicator, new ground, fonts |
| Rewrite | `src/entities/Player.ts` | Pixel frog drawn via Graphics with idle/jump/death poses |
| Rewrite | `src/entities/Obstacle.ts` | Plant pixel art shapes drawn via Graphics instead of Rectangles |
| Rewrite | `src/scenes/DeathScene.ts` | Score-vs-Best layout, progress bar, RETRY/MENU buttons, best score in localStorage |

---

### Task 1: Color Palette & Constants

**Files:**
- Create: `src/config/colors.ts`
- Modify: `src/config/constants.ts`

- [ ] **Step 1: Create `src/config/colors.ts`**

```ts
export const COLORS = {
  SKY_TOP: 0x0f172a,
  SKY_MID: 0x1e293b,
  HORIZON: 0x334155,
  HILLS: 0x1b4332,
  GROUND: 0x2d6a4f,
  GROUND_EDGE: 0x40916c,
  GRASS: 0x52b788,

  PRIMARY: 0x4ecdc4,
  SECONDARY: 0xfbbf24,
  SUCCESS: 0x4ade80,
  DANGER: 0xef4444,
  MOON: 0xfde68a,

  TEXT_PRIMARY: 0xf9fafb,
  TEXT_SECONDARY: 0x64748b,
  TEXT_MUTED: 0x475569,
  PANEL_DARK: 0x1e293b,
  BORDER: 0x334155,
  BORDER_ACCENT: 0x2d6a4f,

  FROG_BODY: 0x4ecdc4,
  FROG_EYE: 0xffd93d,
  FROG_CHEEK: 0xf472b6,
  FROG_LEG: 0x2d6a4f,
  FROG_DEAD: 0x64748b,

  PLANT_CACTUS: 0x22c55e,
  PLANT_CACTUS_LIGHT: 0x4ade80,
  PLANT_CACTUS_DARK: 0x166534,
  PLANT_MUSHROOM_CAP: 0xe17055,
  PLANT_MUSHROOM_SPOT: 0xfde68a,
  PLANT_MUSHROOM_STEM: 0xfbbf24,
  PLANT_VINES: 0x6ab04c,
  PLANT_VINES_LEAF: 0x52b788,
  PLANT_FLYTRAP: 0x27ae60,
  PLANT_FLYTRAP_MOUTH: 0xef4444,
  PLANT_FLYTRAP_STEM: 0x166534,
  PLANT_STUMP: 0x8b4513,
  PLANT_STUMP_RING: 0x6b7280,
  PLANT_STUMP_HIGHLIGHT: 0xa0522d,
  PLANT_BRAMBLE: 0x2d5016,
  PLANT_BRAMBLE_THORN: 0x1e293b,
  PLANT_BRAMBLE_LIGHT: 0x3d6b1e,

  STAR: 0x475569,
} as const;

export const FONT_DISPLAY = '"Press Start 2P"';
export const FONT_BODY = 'VT323';
```

- [ ] **Step 2: Add to `src/config/constants.ts`**

Add these lines at the end of the file:

```ts
export const PIXEL_SIZE = 2;

export const GROUND_HEIGHT = 35;
export const GROUND_Y_UPDATED = CANVAS_HEIGHT - GROUND_HEIGHT;
```

Also update `GROUND_Y` to use the new constant (it's already `CANVAS_HEIGHT - 35`, just make it reference `GROUND_HEIGHT`):

Change line 7 from:
```ts
export const GROUND_Y = CANVAS_HEIGHT - 35;
```
to:
```ts
export const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/config/colors.ts src/config/constants.ts
git commit -m "feat: add color palette and pixel art constants"
```

---

### Task 2: Pixel Art Drawing Helper

**Files:**
- Create: `src/utils/PixelArt.ts`

- [ ] **Step 1: Create `src/utils/PixelArt.ts`**

```ts
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
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/PixelArt.ts
git commit -m "feat: add pixel art drawing helpers"
```

---

### Task 3: Load Google Fonts & Update index.html

**Files:**
- Modify: `index.html`
- Modify: `src/main.ts`

- [ ] **Step 1: Update `index.html`**

Replace the entire file content with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Word Hopper</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
    canvas { image-rendering: pixelated; outline: none; }
    #game-input { position: fixed; top: -100px; left: -100px; width: 1px; height: 1px; opacity: 0; }
  </style>
</head>
<body tabindex="0">
  <input id="game-input" type="text" autocomplete="off" autofocus>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Update `src/main.ts` backgroundColor**

Change `backgroundColor: '#1a1a2e'` to `backgroundColor: '#0f172a'`

- [ ] **Step 3: Verify dev server loads fonts**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add index.html src/main.ts
git commit -m "feat: add Google Fonts and update body background"
```

---

### Task 4: Pixel Frog Player

**Files:**
- Rewrite: `src/entities/Player.ts`

This task replaces the circle/rectangle stick figure with a pixel frog drawn via Phaser Graphics. The frog has idle, jump, and death poses.

- [ ] **Step 1: Rewrite `src/entities/Player.ts`**

```ts
import Phaser from 'phaser';
import { PLAYER_X, PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_COLLISION_SHRINK, GROUND_Y, GRAVITY, PIXEL_SIZE } from '../config/constants';
import { COLORS } from '../config/colors';
import { drawPixelRect } from '../utils/PixelArt';

const FROG_W = 8;
const FROG_H = 10;
const ART_W = FROG_W * PIXEL_SIZE;
const ART_H = FROG_H * PIXEL_SIZE;
const OFFSET_X = -ART_W / 2;
const OFFSET_Y = -ART_H - 2;

export class Player {
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private velocityY = 0;
  private isGrounded = true;
  private x = PLAYER_X;
  private y = GROUND_Y;
  private dead = false;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(PLAYER_X, GROUND_Y);
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);
    this.container.setDepth(10);
    this.drawIdle();
  }

  private drawIdle(): void {
    const g = this.graphics;
    g.clear();
    const T = COLORS.FROG_BODY;
    const Y = COLORS.FROG_EYE;
    const P = COLORS.FROG_CHEEK;
    const D = COLORS.FROG_LEG;

    // Row 0: head top
    drawPixelRect(g, 2, 0, 4, 1, T);
    // Row 1: eyes
    drawPixelRect(g, 1, 1, 1, 1, T);
    drawPixelRect(g, 2, 1, 1, 1, Y);
    drawPixelRect(g, 3, 1, 2, 1, T);
    drawPixelRect(g, 5, 1, 1, 1, Y);
    drawPixelRect(g, 6, 1, 1, 1, T);
    // Row 2: head
    drawPixelRect(g, 1, 2, 6, 1, T);
    // Row 3: cheeks
    drawPixelRect(g, 1, 3, 1, 1, T);
    drawPixelRect(g, 2, 3, 2, 1, P);
    drawPixelRect(g, 4, 3, 2, 1, T);
    drawPixelRect(g, 6, 3, 1, 1, P);
    // Row 4: head bottom
    drawPixelRect(g, 1, 4, 6, 1, T);
    // Row 5: body (wider)
    drawPixelRect(g, 0, 5, 8, 1, T);
    // Row 6: legs start
    drawPixelRect(g, 0, 6, 1, 1, D);
    drawPixelRect(g, 1, 6, 6, 1, T);
    drawPixelRect(g, 7, 6, 1, 1, D);
    // Row 7: body bottom
    drawPixelRect(g, 1, 7, 6, 1, T);
    // Row 8: feet
    drawPixelRect(g, 1, 8, 2, 1, D);
    drawPixelRect(g, 5, 8, 2, 1, D);
    // Row 9: feet tips
    drawPixelRect(g, 0, 9, 3, 1, D);
    drawPixelRect(g, 5, 9, 3, 1, D);

    g.setPosition(OFFSET_X, OFFSET_Y);
  }

  private drawJump(): void {
    const g = this.graphics;
    g.clear();
    const T = COLORS.FROG_BODY;
    const Y = COLORS.FROG_EYE;
    const P = COLORS.FROG_CHEEK;
    const D = COLORS.FROG_LEG;

    // Row 0: head top
    drawPixelRect(g, 2, 0, 4, 1, T);
    // Row 1: eyes (shifted up look)
    drawPixelRect(g, 1, 1, 1, 1, T);
    drawPixelRect(g, 2, 1, 1, 1, Y);
    drawPixelRect(g, 3, 1, 2, 1, T);
    drawPixelRect(g, 5, 1, 1, 1, Y);
    drawPixelRect(g, 6, 1, 1, 1, T);
    // Row 2: head
    drawPixelRect(g, 1, 2, 6, 1, T);
    // Row 3: cheeks
    drawPixelRect(g, 1, 3, 1, 1, T);
    drawPixelRect(g, 2, 3, 2, 1, P);
    drawPixelRect(g, 4, 3, 2, 1, T);
    drawPixelRect(g, 6, 3, 1, 1, P);
    // Row 4: head bottom
    drawPixelRect(g, 1, 4, 6, 1, T);
    // Row 5: body
    drawPixelRect(g, 0, 5, 8, 1, T);
    // Row 6: arms out
    drawPixelRect(g, 0, 6, 1, 1, T);
    drawPixelRect(g, 1, 6, 6, 1, T);
    drawPixelRect(g, 7, 6, 1, 1, T);
    // Row 7: body bottom
    drawPixelRect(g, 1, 7, 6, 1, T);
    // Row 8-9: legs extended
    drawPixelRect(g, 0, 8, 2, 1, D);
    drawPixelRect(g, 6, 8, 2, 1, D);
    drawPixelRect(g, 0, 9, 1, 1, D);
    drawPixelRect(g, 7, 9, 1, 1, D);

    g.setPosition(OFFSET_X, OFFSET_Y);
  }

  private drawDead(): void {
    const g = this.graphics;
    g.clear();
    const T = COLORS.FROG_DEAD;
    const W = COLORS.TEXT_PRIMARY;

    // Same shape as idle but grayed out with X eyes
    drawPixelRect(g, 2, 0, 4, 1, T);
    drawPixelRect(g, 1, 1, 1, 1, T);
    drawPixelRect(g, 2, 1, 1, 1, W);
    drawPixelRect(g, 3, 1, 2, 1, T);
    drawPixelRect(g, 5, 1, 1, 1, W);
    drawPixelRect(g, 6, 1, 1, 1, T);
    drawPixelRect(g, 1, 2, 6, 1, T);
    drawPixelRect(g, 1, 3, 6, 1, T);
    drawPixelRect(g, 1, 4, 6, 1, T);
    drawPixelRect(g, 0, 5, 8, 1, T);
    drawPixelRect(g, 0, 6, 8, 1, T);
    drawPixelRect(g, 1, 7, 6, 1, T);
    drawPixelRect(g, 0, 8, 8, 1, T);
    drawPixelRect(g, 0, 9, 8, 1, T);

    g.setPosition(OFFSET_X, OFFSET_Y);
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;

    if (!this.isGrounded) {
      this.velocityY += GRAVITY * dt;
      this.y += this.velocityY * dt;

      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isGrounded = true;
        if (!this.dead) this.drawIdle();
      }
    }

    this.container.setPosition(this.x, this.y);
  }

  jumpTo(targetY: number): void {
    const height = GROUND_Y - targetY;
    if (height <= 0) return;

    const initialVelocity = -Math.sqrt(2 * GRAVITY * height);
    this.velocityY = initialVelocity;
    this.isGrounded = false;
    this.y = GROUND_Y;
    this.container.setPosition(this.x, this.y);
    this.drawJump();
  }

  jumpToWord(wordY: number): void {
    this.jumpTo(wordY);
  }

  die(): void {
    this.dead = true;
    this.drawDead();
  }

  getY(): number {
    return this.y;
  }

  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getBounds(): Phaser.Geom.Rectangle {
    const sw = PLAYER_WIDTH * PLAYER_COLLISION_SHRINK;
    const sh = PLAYER_HEIGHT * PLAYER_COLLISION_SHRINK;
    return new Phaser.Geom.Rectangle(
      this.x - sw / 2,
      this.y - PLAYER_HEIGHT + (PLAYER_HEIGHT - sh) / 2,
      sw,
      sh
    );
  }

  reset(): void {
    this.y = GROUND_Y;
    this.velocityY = 0;
    this.isGrounded = true;
    this.dead = false;
    this.container.setPosition(this.x, this.y);
    this.drawIdle();
  }

  destroy(): void {
    this.container.destroy();
  }
}
```

- [ ] **Step 2: Update GameScene `die()` to call `player.die()`**

In `src/scenes/GameScene.ts`, change the `die()` method from:

```ts
private die(): void {
    this.alive = false;
    this.player.destroy();
```

to:

```ts
private die(): void {
    this.alive = false;
    this.player.die();
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Visual check — run dev server**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vite`
Expected: Frog character visible, changes pose when jumping

- [ ] **Step 5: Commit**

```bash
git add src/entities/Player.ts src/scenes/GameScene.ts
git commit -m "feat: replace stick figure with pixel frog character"
```

---

### Task 5: Pixel Plant Obstacles

**Files:**
- Rewrite: `src/entities/Obstacle.ts`

This task replaces plain Rectangle obstacles with pixel art plant shapes drawn via Phaser Graphics. The obstacle stores Graphics objects instead of Rectangles, and each plant type has its own draw function.

- [ ] **Step 1: Rewrite `src/entities/Obstacle.ts`**

```ts
import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  PlantType,
  ObstacleLayout,
  PIXEL_SIZE,
} from '../config/constants';
import { COLORS } from '../config/colors';
import { drawPixelRect, drawPixel } from '../utils/PixelArt';

export interface ObstacleConfig {
  layout: ObstacleLayout;
  plantType: PlantType;
  gapY: number;
  gapHeight: number;
  x: number;
  word1: string;
  word1Y: number;
  word2: string;
  word2Y: number;
}

export class Obstacle {
  private upperGfx: Phaser.GameObjects.Graphics | null = null;
  private lowerGfx: Phaser.GameObjects.Graphics | null = null;
  private word1Text: Phaser.GameObjects.Text;
  private word2Text: Phaser.GameObjects.Text | null = null;
  private config: ObstacleConfig;
  private scrollSpeed: number;
  private active = true;

  constructor(scene: Phaser.Scene, config: ObstacleConfig, scrollSpeed: number) {
    this.config = config;
    this.scrollSpeed = scrollSpeed;

    if (config.layout !== ObstacleLayout.LowerOnly) {
      this.upperGfx = scene.add.graphics();
      this.drawPlant(this.upperGfx, config.plantType, config.x, 0, true, config.gapY - config.gapHeight / 2);
    }

    if (config.layout !== ObstacleLayout.UpperOnly) {
      this.lowerGfx = scene.add.graphics();
      const lowerTop = config.gapY + config.gapHeight / 2;
      this.drawPlant(this.lowerGfx, config.plantType, config.x, lowerTop, false, CANVAS_HEIGHT - 35 - lowerTop);
    }

    this.word1Text = scene.add.text(config.x, config.word1Y, config.word1, {
      fontSize: '16px',
      color: colorToHexRef(COLORS.PRIMARY),
      fontFamily: FONT_BODY_REF,
      fontStyle: 'bold',
    });
    this.word1Text.setOrigin(0.5);

    if (config.word2) {
      this.word2Text = scene.add.text(config.x, config.word2Y, config.word2, {
        fontSize: '16px',
        color: colorToHexRef(COLORS.SECONDARY),
        fontFamily: FONT_BODY_REF,
        fontStyle: 'bold',
      });
      this.word2Text.setOrigin(0.5);
    }
  }

  update(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.config.x -= dx;

    if (this.upperGfx) this.upperGfx.x -= dx;
    if (this.lowerGfx) this.lowerGfx.x -= dx;
    this.word1Text.x -= dx;
    if (this.word2Text) this.word2Text.x -= dx;

    if (this.config.x < -50) {
      this.active = false;
    }
  }

  getX(): number {
    return this.config.x;
  }

  isActive(): boolean {
    return this.active;
  }

  getConfig(): ObstacleConfig {
    return this.config;
  }

  highlightWord(wordIndex: 1 | 2, charIndex: number): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;

    const word = wordIndex === 1 ? this.config.word1 : this.config.word2;
    const green = word.slice(0, charIndex);
    const rest = word.slice(charIndex);
    text.setText(`${green}|${rest}`);
    text.setColor(colorToHexRef(COLORS.SUCCESS));
  }

  flashWrong(wordIndex: 1 | 2): void {
    const text = wordIndex === 1 ? this.word1Text : this.word2Text;
    if (!text) return;
    text.setColor(colorToHexRef(COLORS.DANGER));
  }

  fadeUnselected(keepWordIndex: 1 | 2): void {
    const fadeText = keepWordIndex === 1 ? this.word2Text : this.word1Text;
    if (fadeText) fadeText.setAlpha(0.2);
  }

  clearWords(): void {
    this.word1Text.destroy();
    if (this.word2Text) this.word2Text.destroy();
  }

  destroy(): void {
    if (this.upperGfx) this.upperGfx.destroy();
    if (this.lowerGfx) this.lowerGfx.destroy();
    if (this.word1Text && this.word1Text.active) this.word1Text.destroy();
    if (this.word2Text && this.word2Text.active) this.word2Text.destroy();
  }

  getUpperBounds(): Phaser.Geom.Rectangle | null {
    if (!this.upperGfx) return null;
    const w = 30, h = this.config.gapY - this.config.gapHeight / 2;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, 0, w, h);
  }

  getLowerBounds(): Phaser.Geom.Rectangle | null {
    if (!this.lowerGfx) return null;
    const lowerTop = this.config.gapY + this.config.gapHeight / 2;
    const w = 30;
    const h = CANVAS_HEIGHT - lowerTop;
    return new Phaser.Geom.Rectangle(this.config.x - w / 2, lowerTop, w, h);
  }

  private drawPlant(g: Phaser.GameObjects.Graphics, type: PlantType, worldX: number, startY: number, isUpper: boolean, height: number): void {
    switch (type) {
      case PlantType.Cactus: this.drawCactus(g, startY, isUpper, height); break;
      case PlantType.Bramble: this.drawBramble(g, startY, isUpper, height); break;
      case PlantType.Mushroom: this.drawMushroom(g, startY, isUpper, height); break;
      case PlantType.VenusFlytrap: this.drawVenusFlytrap(g, startY, isUpper, height); break;
      case PlantType.TreeStump: this.drawTreeStump(g, startY, isUpper, height); break;
      case PlantType.HangingVines: this.drawHangingVines(g, startY, isUpper, height); break;
    }
  }

  private drawCactus(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const px = PIXEL_SIZE;
    const stemW = 3;
    const rows = Math.floor(height / px);

    for (let i = 0; i < rows; i++) {
      const y = startY + i * px;
      g.fillStyle(COLORS.PLANT_CACTUS);
      g.fillRect(-stemW * px / 2, y, stemW * px, px);

      if (i % 4 === 0) {
        g.fillStyle(COLORS.PLANT_CACTUS_DARK);
        g.fillRect(-stemW * px / 2 - px, y, px, px);
        g.fillRect(stemW * px / 2, y, px, px);
      }
    }

    if (rows > 6) {
      const armY1 = startY + Math.floor(rows * 0.3) * px;
      const armY2 = startY + Math.floor(rows * 0.6) * px;
      g.fillStyle(COLORS.PLANT_CACTUS_LIGHT);
      g.fillRect(-stemW * px / 2 - 3 * px, armY1, 3 * px, px);
      g.fillRect(-stemW * px / 2 - 3 * px, armY1 - px, px, px);
      g.fillRect(stemW * px / 2, armY2, 3 * px, px);
      g.fillRect(stemW * px / 2 + 2 * px, armY2 - px, px, px);
    }

    if (isUpper) {
      g.fillStyle(COLORS.PLANT_CACTUS_LIGHT);
      g.fillRect(-stemW * px / 2, startY, stemW * px, px);
    } else {
      g.fillStyle(COLORS.PLANT_CACTUS_LIGHT);
      g.fillRect(-stemW * px / 2, startY + (rows - 1) * px, stemW * px, px);
    }
  }

  private drawBramble(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const px = PIXEL_SIZE;
    const rows = Math.floor(height / px);

    for (let i = 0; i < rows; i++) {
      const y = startY + i * px;
      const zigzag = (i % 4 < 2) ? 0 : px;
      g.fillStyle(COLORS.PLANT_BRAMBLE);
      g.fillRect(-6 * px + zigzag, y, 12 * px, px);

      if (i % 3 === 0) {
        g.fillStyle(COLORS.PLANT_BRAMBLE_THORN);
        g.fillRect(-6 * px + zigzag - px, y, px, px);
        g.fillRect(6 * px + zigzag, y, px, px);
      }
    }
  }

  private drawMushroom(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const px = PIXEL_SIZE;
    const rows = Math.floor(height / px);
    const capRows = Math.min(4, Math.floor(rows * 0.3));

    if (!isUpper) {
      // Cap at top of obstacle (growing up from ground → cap at top)
      // Stem from bottom
      for (let i = capRows; i < rows; i++) {
        const y = startY + i * px;
        g.fillStyle(COLORS.PLANT_MUSHROOM_STEM);
        g.fillRect(-2 * px, y, 4 * px, px);
      }
      // Cap at row 0 to capRows
      for (let i = 0; i < capRows; i++) {
        const y = startY + i * px;
        const capW = i === 0 ? 5 : (i === capRows - 1 ? 6 : 7);
        const offset = i === 0 ? -1 : (i === capRows - 1 ? -2 : -3);
        g.fillStyle(COLORS.PLANT_MUSHROOM_CAP);
        g.fillRect(offset * px, y, capW * px, px);
      }
      // Spots on cap
      if (capRows >= 2) {
        g.fillStyle(COLORS.PLANT_MUSHROOM_SPOT);
        g.fillRect(-2 * px, startY + px, px, px);
        g.fillRect(1 * px, startY + 2 * px, px, px);
        g.fillRect(-1 * px, startY + px, px, px);
      }
    } else {
      // Upper: cap at bottom, stem goes up
      for (let i = 0; i < rows - capRows; i++) {
        const y = startY + i * px;
        g.fillStyle(COLORS.PLANT_MUSHROOM_STEM);
        g.fillRect(-2 * px, y, 4 * px, px);
      }
      for (let i = 0; i < capRows; i++) {
        const rowIdx = rows - capRows + i;
        const y = startY + rowIdx * px;
        const capW = i === capRows - 1 ? 5 : (i === 0 ? 6 : 7);
        const offset = i === capRows - 1 ? -1 : (i === 0 ? -2 : -3);
        g.fillStyle(COLORS.PLANT_MUSHROOM_CAP);
        g.fillRect(offset * px, y, capW * px, px);
      }
      if (capRows >= 2) {
        g.fillStyle(COLORS.PLANT_MUSHROOM_SPOT);
        g.fillRect(-2 * px, startY + (rows - capRows + 1) * px, px, px);
        g.fillRect(1 * px, startY + (rows - capRows + 2) * px, px, px);
      }
    }
  }

  private drawVenusFlytrap(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const px = PIXEL_SIZE;
    const rows = Math.floor(height / px);
    const jawRows = Math.min(4, Math.floor(rows * 0.25));

    if (!isUpper) {
      // Stem
      for (let i = jawRows; i < rows; i++) {
        const y = startY + i * px;
        g.fillStyle(COLORS.PLANT_FLYTRAP_STEM);
        g.fillRect(-2 * px, y, 4 * px, px);
      }
      // Top jaw
      g.fillStyle(COLORS.PLANT_FLYTRAP);
      g.fillRect(-4 * px, startY, 8 * px, px);
      g.fillRect(-3 * px, startY + px, 6 * px, px);
      // Red interior
      g.fillStyle(COLORS.PLANT_FLYTRAP_MOUTH);
      g.fillRect(-2 * px, startY + 2 * px, 4 * px, px);
      // Bottom jaw
      g.fillStyle(COLORS.PLANT_FLYTRAP);
      g.fillRect(-3 * px, startY + (jawRows - 1) * px, 6 * px, px);
      g.fillRect(-4 * px, startY + (jawRows - 2) * px, 8 * px, px);
      // Teeth
      g.fillStyle(COLORS.TEXT_PRIMARY);
      g.fillRect(-3 * px, startY + px, px, px);
      g.fillRect(2 * px, startY + px, px, px);
    } else {
      // Stem
      for (let i = 0; i < rows - jawRows; i++) {
        const y = startY + i * px;
        g.fillStyle(COLORS.PLANT_FLYTRAP_STEM);
        g.fillRect(-2 * px, y, 4 * px, px);
      }
      // Bottom jaw (at bottom of upper obstacle)
      const jStart = rows - jawRows;
      g.fillStyle(COLORS.PLANT_FLYTRAP);
      g.fillRect(-4 * px, startY + (jStart + jawRows - 1) * px, 8 * px, px);
      g.fillRect(-3 * px, startY + (jStart + jawRows - 2) * px, 6 * px, px);
      // Red interior
      g.fillStyle(COLORS.PLANT_FLYTRAP_MOUTH);
      g.fillRect(-2 * px, startY + (jStart + jawRows - 3) * px, 4 * px, px);
      // Top jaw
      g.fillStyle(COLORS.PLANT_FLYTRAP);
      g.fillRect(-3 * px, startY + jStart * px, 6 * px, px);
      g.fillRect(-4 * px, startY + (jStart + 1) * px, 8 * px, px);
      // Teeth
      g.fillStyle(COLORS.TEXT_PRIMARY);
      g.fillRect(-3 * px, startY + (jStart + jawRows - 2) * px, px, px);
      g.fillRect(2 * px, startY + (jStart + jawRows - 2) * px, px, px);
    }
  }

  private drawTreeStump(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const px = PIXEL_SIZE;
    const rows = Math.floor(height / px);

    for (let i = 0; i < rows; i++) {
      const y = startY + i * px;
      g.fillStyle(COLORS.PLANT_STUMP);
      g.fillRect(-5 * px, y, 10 * px, px);
    }

    // Top ring (cross-section)
    if (!isUpper) {
      g.fillStyle(COLORS.PLANT_STUMP_RING);
      g.fillRect(-4 * px, startY, 8 * px, px);
      g.fillRect(-2 * px, startY + px, 4 * px, px);
      // Highlight
      g.fillStyle(COLORS.PLANT_STUMP_HIGHLIGHT);
      g.fillRect(-4 * px, startY + rows * px - px, 10 * px, px);
    } else {
      g.fillStyle(COLORS.PLANT_STUMP_RING);
      g.fillRect(-4 * px, startY + (rows - 1) * px, 8 * px, px);
      g.fillRect(-2 * px, startY + (rows - 2) * px, 4 * px, px);
    }
  }

  private drawHangingVines(g: Phaser.GameObjects.Graphics, startY: number, isUpper: boolean, height: number): void {
    const px = PIXEL_SIZE;
    const rows = Math.floor(height / px);

    if (isUpper) {
      // Mount bar at top
      g.fillStyle(COLORS.PLANT_VINES);
      g.fillRect(-5 * px, startY, 10 * px, px);
      g.fillRect(-5 * px, startY + px, 10 * px, px);

      // 3 vine strands
      const vineXs = [-3, 0, 3];
      for (const vx of vineXs) {
        const vineLen = Math.floor((rows - 2) * (0.5 + Math.abs(vx) * 0.15));
        for (let i = 0; i < vineLen; i++) {
          const y = startY + (2 + i) * px;
          g.fillStyle(COLORS.PLANT_VINES);
          g.fillRect(vx * px, y, px, px);
        }
        // Leaf at tip
        const tipY = startY + (2 + vineLen - 1) * px;
        g.fillStyle(COLORS.PLANT_VINES_LEAF);
        g.fillRect((vx - 1) * px, tipY, 3 * px, px);
      }
    } else {
      // Lower vines: grow up from bottom
      const bottomY = startY + (rows - 1) * px;
      const vineXs = [-3, 0, 3];
      for (const vx of vineXs) {
        const vineLen = Math.floor((rows - 2) * (0.5 + Math.abs(vx) * 0.15));
        for (let i = 0; i < vineLen; i++) {
          const y = bottomY - i * px;
          g.fillStyle(COLORS.PLANT_VINES);
          g.fillRect(vx * px, y, px, px);
        }
        // Leaf at tip
        const tipY = bottomY - (vineLen - 1) * px;
        g.fillStyle(COLORS.PLANT_VINES_LEAF);
        g.fillRect((vx - 1) * px, tipY, 3 * px, px);
      }
    }
  }
}

function colorToHexRef(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

const FONT_BODY_REF = 'VT323';
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Visual check — run dev server, play game**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vite`
Expected: Plant obstacles appear with pixel art shapes instead of flat rectangles

- [ ] **Step 4: Commit**

```bash
git add src/entities/Obstacle.ts
git commit -m "feat: replace rectangle obstacles with pixel art plants"
```

---

### Task 6: GameScene Background & Parallax

**Files:**
- Rewrite: `src/scenes/GameScene.ts`

This task adds the full background system (sky gradient, stars, moon, hills, ground, grass) and updates the HUD and typing indicator to use new fonts and colors. It also changes the timing line to dashed style.

- [ ] **Step 1: Add parallax background and update HUD in `src/scenes/GameScene.ts`**

This is a large rewrite. Key changes:
- Add `ParallaxLayer` class at the top of the file for managing scrolling background elements
- Replace the single background rectangle with: sky gradient → stars → moon → hills → ground → grass tufts
- Move HUD to top-left with new colors and VT323 font
- Add bottom-center typing progress indicator
- Update timing line to dashed style
- Update ground to use new colors

The full rewrite of GameScene.ts is below. All game logic (typing, collision, spawning, scoring, speed) remains identical — only visual elements change.

```ts
import Phaser from 'phaser';
import { Difficulty, PLAYER_X, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, GROUND_HEIGHT } from '../config/constants';
import { COLORS } from '../config/colors';
import { FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';
import { Player } from '../entities/Player';
import { Obstacle, ObstacleConfig } from '../entities/Obstacle';
import { TypingSystem } from '../systems/TypingSystem';
import { WordSpawner } from '../systems/WordSpawner';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpeedManager } from '../systems/SpeedManager';
import { ObstacleSpawner } from '../systems/ObstacleSpawner';

interface StarData { x: number; y: number; }

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private obstacles: Obstacle[] = [];
  private typingSystem = new TypingSystem();
  private wordSpawner = new WordSpawner();
  private scoreSystem = new ScoreSystem();
  private speedManager = new SpeedManager();
  private obstacleSpawner!: ObstacleSpawner;
  private difficulty: Difficulty = 'easy';
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  private inputBlurHandler: (() => void) | null = null;
  private typingLock = false;
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private typingText!: Phaser.GameObjects.Text;
  private timingLine!: Phaser.GameObjects.Graphics;
  private distance = 0;
  private alive = true;
  private tickAccumulator = 0;

  private skyGfx!: Phaser.GameObjects.Graphics;
  private stars: StarData[] = [];
  private starGfx!: Phaser.GameObjects.Graphics;
  private moonGfx!: Phaser.GameObjects.Graphics;
  private hillGfx!: Phaser.GameObjects.Graphics;
  private groundGfx!: Phaser.GameObjects.Graphics;
  private grassGfx!: Phaser.GameObjects.Graphics;

  private starOffset = 0;
  private hillOffset = 0;
  private grassOffset = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { difficulty: Difficulty }): void {
    this.difficulty = data.difficulty || 'easy';
    this.wordSpawner.loadWords(this.difficulty);
  }

  create(): void {
    this.alive = true;
    this.distance = 0;
    this.obstacles = [];
    this.scoreSystem.reset();
    this.speedManager.reset();
    this.typingSystem = new TypingSystem();
    this.obstacleSpawner = new ObstacleSpawner(this.wordSpawner, this.speedManager);
    this.obstacleSpawner.setDifficulty(this.difficulty);
    this.starOffset = 0;
    this.hillOffset = 0;
    this.grassOffset = 0;

    this.createBackground();
    this.player = new Player(this);

    this.timingLine = this.add.graphics();
    this.timingLine.setDepth(5);

    this.createHUD();
    this.createTypingIndicator();

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (!this.alive) return;
        if (this.typingLock) return;
        if (e.key.length !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        this.typingLock = true;
        this.handleTyping(e.key);
        gameInput.value = '';
        requestAnimationFrame(() => { this.typingLock = false; });
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);
      this.inputBlurHandler = () => {
        if (this.alive) gameInput.focus();
      };
      gameInput.addEventListener('blur', this.inputBlurHandler);
    }

    this.spawnObstacle();
  }

  private createBackground(): void {
    // Sky gradient
    this.skyGfx = this.add.graphics();
    this.skyGfx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    for (let y = 0; y < GROUND_Y; y++) {
      const t = y / GROUND_Y;
      const r = Math.round(0x0f * (1 - t) + 0x33 * t);
      const g = Math.round(0x17 * (1 - t) + 0x41 * t);
      const b = Math.round(0x2a * (1 - t) + 0x55 * t);
      this.skyGfx.fillStyle((r << 16) | (g << 8) | b);
      this.skyGfx.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    // Stars
    this.stars = [];
    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (GROUND_Y * 0.6),
      });
    }
    this.starGfx = this.add.graphics();
    this.drawStars();

    // Moon
    this.moonGfx = this.add.graphics();
    this.moonGfx.fillStyle(COLORS.MOON);
    this.moonGfx.fillCircle(CANVAS_WIDTH - 80, 40, 10);
    this.moonGfx.fillStyle(COLORS.MOON, 0.15);
    this.moonGfx.fillCircle(CANVAS_WIDTH - 80, 40, 25);

    // Hills
    this.hillGfx = this.add.graphics();
    this.drawHills(0);

    // Ground
    this.groundGfx = this.add.graphics();
    this.groundGfx.fillStyle(COLORS.GROUND);
    this.groundGfx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);
    this.groundGfx.fillStyle(COLORS.GROUND_EDGE);
    this.groundGfx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2);
    this.groundGfx.fillStyle(COLORS.GRASS, 0.4);
    this.groundGfx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 1);
    // Vertical line texture
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      this.groundGfx.fillStyle(COLORS.GROUND_EDGE, 0.15);
      this.groundGfx.fillRect(x, GROUND_Y, 1, GROUND_HEIGHT);
    }

    // Grass tufts
    this.grassGfx = this.add.graphics();
    this.drawGrass(0);
  }

  private drawStars(): void {
    this.starGfx.clear();
    this.starGfx.fillStyle(COLORS.STAR);
    for (const star of this.stars) {
      const x = ((star.x - this.starOffset) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      this.starGfx.fillRect(x, star.y, 2, 2);
    }
  }

  private drawHills(offset: number): void {
    this.hillGfx.clear();
    this.hillGfx.fillStyle(COLORS.HILLS, 0.6);
    this.hillGfx.fillRect(0, GROUND_Y - 20, CANVAS_WIDTH, 25);
    // Simple hill silhouettes
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 200 + 100 - offset * 0.2) % (CANVAS_WIDTH + 200) + CANVAS_WIDTH + 200) % (CANVAS_WIDTH + 200) - 100;
      this.hillGfx.fillCircle(cx, GROUND_Y - 5, 50);
    }
  }

  private drawGrass(offset: number): void {
    this.grassGfx.clear();
    this.grassGfx.fillStyle(COLORS.GRASS);
    for (let i = 0; i < 30; i++) {
      const x = ((i * 35 + 10 - offset) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      this.grassGfx.fillRect(x, GROUND_Y - 3, 2, 3);
      this.grassGfx.fillRect(x + 2, GROUND_Y - 2, 2, 2);
    }
  }

  private createHUD(): void {
    const hudBg = this.add.rectangle(70, 25, 130, 34, COLORS.SKY_TOP, 0.8);
    hudBg.setStrokeStyle(1, COLORS.BORDER_ACCENT, 0.5);
    hudBg.setOrigin(0.5);
    hudBg.setDepth(20);

    this.scoreText = this.add.text(12, 12, 'SCORE 0', {
      fontSize: '14px',
      color: colorToHex(COLORS.PRIMARY),
      fontFamily: FONT_BODY,
    });
    this.scoreText.setDepth(20);

    this.speedText = this.add.text(12, 28, 'SPEED 1.0x', {
      fontSize: '14px',
      color: colorToHex(COLORS.SECONDARY),
      fontFamily: FONT_BODY,
    });
    this.speedText.setDepth(20);
  }

  private createTypingIndicator(): void {
    const bg = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12, 120, 20, COLORS.SKY_TOP, 0.8);
    bg.setStrokeStyle(1, COLORS.BORDER_ACCENT, 0.5);
    bg.setOrigin(0.5);
    bg.setDepth(20);

    this.typingText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12, '', {
      fontSize: '14px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_BODY,
    });
    this.typingText.setOrigin(0.5);
    this.typingText.setDepth(20);
  }

  update(_time: number, delta: number): void {
    if (!this.alive) return;

    const dt = delta / 1000;
    const speed = this.speedManager.getSpeed();

    this.distance += speed * dt;
    this.speedManager.updateDistance(this.distance);

    // Parallax
    this.starOffset += speed * dt * 0.05;
    this.hillOffset += speed * dt * 0.2;
    this.grassOffset += speed * dt;
    this.drawStars();
    this.drawHills(this.hillOffset);
    this.drawGrass(this.grassOffset);

    this.player.update(delta);

    this.tickAccumulator += dt;
    if (this.tickAccumulator >= 0.1) {
      this.scoreSystem.addTick();
      this.tickAccumulator -= 0.1;
    }

    for (const obstacle of this.obstacles) {
      obstacle.update(dt);
    }

    this.updateTimingLine(speed);
    this.checkCollisions();
    this.cleanupObstacles();
    this.checkSpawn();
    this.updateHUD();
  }

  private handleTyping(key: string): void {
    const result = this.typingSystem.onKeyPress(key);

    if (result.wrong) {
      const nearest = this.getNearestObstacle();
      if (nearest) {
        const wordIdx = this.typingSystem.getProgress().selectedWord
          ? (nearest.getConfig().word1 === this.typingSystem.getProgress().selectedWord ? 1 : 2)
          : 1;
        nearest.flashWrong(wordIdx);
      }
      return;
    }

    const nearest = this.getNearestObstacle();
    if (!nearest) return;

    const config = nearest.getConfig();
    const wordIdx = config.word1 === result.selectedWord ? 1 : 2;
    nearest.highlightWord(wordIdx, result.charIndex);

    if (result.charIndex === 1) {
      nearest.fadeUnselected(wordIdx);
    }

    this.updateTypingIndicator(result.selectedWord, result.charIndex);

    if (result.completed) {
      const targetY = wordIdx === 1 ? config.word1Y : config.word2Y;
      this.player.jumpToWord(targetY);
      this.scoreSystem.addWordBonus(result.selectedWord, this.speedManager.getSpeedMultiplier());
      nearest.clearWords();
      this.typingText.setText('');

      this.spawnObstacle();
    }
  }

  private updateTypingIndicator(word: string, charIndex: number): void {
    const typed = word.slice(0, charIndex);
    const remaining = word.slice(charIndex);
    this.typingText.setText(`${typed}|${remaining}`);
  }

  private spawnObstacle(): void {
    const speed = this.speedManager.getSpeed();
    const config = this.obstacleSpawner.generate(speed);
    const obstacle = new Obstacle(this, config, speed);
    this.obstacles.push(obstacle);

    if (config.word2) {
      this.typingSystem.setWords(config.word1, config.word2);
    } else {
      this.typingSystem.setSingleWord(config.word1);
    }
  }

  private getNearestObstacle(): Obstacle | null {
    const upcoming = this.obstacles.filter(
      (o) => o.isActive() && o.getX() > PLAYER_X - 10
    );
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => a.getX() - b.getX());
    return upcoming[0];
  }

  private checkCollisions(): void {
    const playerBounds = this.player.getBounds();

    for (const obstacle of this.obstacles) {
      if (!obstacle.isActive()) continue;
      if (obstacle.getX() < PLAYER_X - 30 || obstacle.getX() > PLAYER_X + 30) continue;

      const upper = obstacle.getUpperBounds();
      const lower = obstacle.getLowerBounds();

      if (upper && Phaser.Geom.Rectangle.Overlaps(playerBounds, upper)) {
        this.die();
        return;
      }
      if (lower && Phaser.Geom.Rectangle.Overlaps(playerBounds, lower)) {
        this.die();
        return;
      }
    }
  }

  private die(): void {
    this.alive = false;
    this.player.die();
    this.time.delayedCall(500, () => {
      this.scene.start('DeathScene', {
        score: this.scoreSystem.getScore(),
        wordsTyped: this.scoreSystem.getWordsTyped(),
        wpm: this.scoreSystem.getWPM(this.distance / this.speedManager.getSpeed()),
        bestWord: this.scoreSystem.getBestWord(),
        difficulty: this.difficulty,
      });
    });
  }

  private cleanupObstacles(): void {
    this.obstacles = this.obstacles.filter((o) => {
      if (!o.isActive()) {
        o.destroy();
        return false;
      }
      return true;
    });
  }

  private checkSpawn(): void {
    if (this.typingSystem.hasWords()) return;
    const rightEdge = Math.max(...this.obstacles.map((o) => o.getX()), 0);
    if (this.obstacleSpawner.canSpawn(rightEdge)) {
      this.spawnObstacle();
    }
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE ${this.scoreSystem.getScore().toLocaleString()}`);
    this.speedText.setText(`SPEED ${this.speedManager.getSpeedMultiplier().toFixed(1)}x`);
  }

  private updateTimingLine(speed: number): void {
    this.timingLine.clear();

    const nearest = this.getNearestObstacle();
    if (!nearest) return;

    const config = nearest.getConfig();
    const targetY = this.typingSystem.getProgress().selectedWord
      ? (config.word1 === this.typingSystem.getProgress().selectedWord ? config.word1Y : config.word2Y)
      : config.word1Y;

    const jumpHeight = GROUND_Y - targetY;
    if (jumpHeight <= 0) return;

    const apexTime = Math.sqrt(2 * jumpHeight / GRAVITY);
    const distToTravel = nearest.getX() - PLAYER_X;
    const timeToArrive = distToTravel / speed;

    const timingX = PLAYER_X + speed * (timeToArrive - apexTime);

    if (timingX < PLAYER_X - 20 || timingX > CANVAS_WIDTH + 50) return;

    const proximity = Math.abs(nearest.getX() - PLAYER_X);
    const alpha = proximity < 200 ? 0.7 : 0.3;

    // Dashed line
    const dashLen = 3;
    const gapLen = 3;
    for (let y = 30; y < GROUND_Y; y += dashLen + gapLen) {
      const endY = Math.min(y + dashLen, GROUND_Y);
      this.timingLine.fillStyle(COLORS.PRIMARY, alpha);
      this.timingLine.fillRect(timingX, y, 2, endY - y);
    }

    // Arrow
    this.timingLine.fillStyle(COLORS.PRIMARY, alpha);
    this.timingLine.fillRect(timingX - 3, 28, 8, 2);
    this.timingLine.fillRect(timingX - 1, 26, 4, 2);
  }
}
```

Note: The `colorToHex` function from `colors.ts` should be imported. But we defined it in `PixelArt.ts`. Let's import from there instead. Also, `FONT_DISPLAY` and `FONT_BODY` are in `colors.ts` — we need to import them correctly.

Actually, looking at the imports: `FONT_DISPLAY` and `FONT_BODY` are exported from `src/config/colors.ts` and `colorToHex` from `src/utils/PixelArt.ts`. The GameScene import line should be:

```ts
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
```

and remove the duplicate import line for colors. Fix this in the actual file.

- [ ] **Step 2: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Visual check — full game should work with new background**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vite`
Expected: Gradient sky, stars, moon, hills, green ground, grass tufts scrolling at different speeds

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add parallax background, new HUD, typing indicator to GameScene"
```

---

### Task 7: BootScene & MenuScene Redesign

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/scenes/MenuScene.ts`

- [ ] **Step 1: Rewrite `src/scenes/BootScene.ts`**

```ts
import Phaser from 'phaser';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { colorToHex } from '../utils/PixelArt';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.cameras.main;
    const barWidth = width * 0.6;
    const barHeight = 12;
    const x = (width - barWidth) / 2;
    const y = height / 2 + 20;

    // Sky gradient background
    const bg = this.add.graphics();
    for (let iy = 0; iy < height; iy++) {
      const t = iy / height;
      const r = Math.round(0x0f * (1 - t) + 0x33 * t);
      const g = Math.round(0x17 * (1 - t) + 0x41 * t);
      const b = Math.round(0x2a * (1 - t) + 0x55 * t);
      bg.fillStyle((r << 16) | (g << 8) | b);
      bg.fillRect(0, iy, width, 1);
    }

    // Title
    this.add.text(width / 2, height * 0.3, 'WORD HOPPER', {
      fontSize: '22px',
      color: colorToHex(COLORS.PRIMARY),
      fontFamily: FONT_DISPLAY,
    }).setOrigin(0.5);

    // Decorative pixel line
    const lineGfx = this.add.graphics();
    lineGfx.fillStyle(COLORS.GROUND, 1);
    lineGfx.fillRect(width / 2 - 60, height * 0.3 + 20, 120, 4);

    // Mini pixel frog
    const frogGfx = this.add.graphics();
    const T = COLORS.FROG_BODY;
    const Y2 = COLORS.FROG_EYE;
    const D = COLORS.FROG_LEG;
    const P2 = COLORS.FROG_CHEEK;
    const ps = 2;
    frogGfx.fillStyle(T); frogGfx.fillRect(width / 2 - 4, height * 0.3 + 30, 8, 2);
    frogGfx.fillStyle(T); frogGfx.fillRect(width / 2 - 6, height * 0.3 + 32, 12, 2);
    frogGfx.fillStyle(Y2); frogGfx.fillRect(width / 2 - 4, height * 0.3 + 32, 2, 2);
    frogGfx.fillStyle(Y2); frogGfx.fillRect(width / 2 + 2, height * 0.3 + 32, 2, 2);
    frogGfx.fillStyle(T); frogGfx.fillRect(width / 2 - 6, height * 0.3 + 34, 12, 2);
    frogGfx.fillStyle(P2); frogGfx.fillRect(width / 2 - 6, height * 0.3 + 34, 2, 2);
    frogGfx.fillStyle(P2); frogGfx.fillRect(width / 2 + 4, height * 0.3 + 34, 2, 2);
    frogGfx.fillStyle(T); frogGfx.fillRect(width / 2 - 8, height * 0.3 + 36, 16, 2);
    frogGfx.fillStyle(D); frogGfx.fillRect(width / 2 - 8, height * 0.3 + 38, 4, 2);
    frogGfx.fillStyle(D); frogGfx.fillRect(width / 2 + 4, height * 0.3 + 38, 4, 2);

    // Bounce the frog
    this.tweens.add({
      targets: frogGfx,
      y: -3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Loading text
    this.add.text(width / 2, y - 16, 'Loading...', {
      fontSize: '12px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    // Progress bar track
    const barTrack = this.add.graphics();
    barTrack.fillStyle(COLORS.PANEL_DARK, 1);
    barTrack.fillRect(x, y, barWidth, barHeight);
    barTrack.lineStyle(1, COLORS.BORDER, 1);
    barTrack.strokeRect(x, y, barWidth, barHeight);

    // Progress bar fill
    const bar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.gradientFillRect(x, y, barWidth * value, barHeight, COLORS.GROUND, COLORS.PRIMARY, 0);
    });

    this.load.on('complete', () => {
      bar.destroy();
      barTrack.destroy();
    });
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
```

Note: `gradientFillRect` may not exist on Phaser Graphics. Use a simpler approach — just fill with PRIMARY color:

```ts
    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.PRIMARY, 1);
      bar.fillRect(x, y, barWidth * value, barHeight);
    });
```

Use the simpler version in the actual file.

- [ ] **Step 2: Rewrite `src/scenes/MenuScene.ts`**

```ts
import Phaser from 'phaser';
import { Difficulty } from '../config/constants';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';

export class MenuScene extends Phaser.Scene {
  private selectedDifficulty: Difficulty = 'easy';
  private difficultyBtns: Record<Difficulty, Phaser.GameObjects.Container> = {} as any;
  private gameInputHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.selectedDifficulty = 'easy';
    this.difficultyBtns = {} as any;

    const { width, height } = this.cameras.main;

    // Sky gradient background
    const bg = this.add.graphics();
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const r = Math.round(0x0f * (1 - t) + 0x33 * t);
      const g = Math.round(0x17 * (1 - t) + 0x41 * t);
      const b = Math.round(0x2a * (1 - t) + 0x55 * t);
      bg.fillStyle((r << 16) | (g << 8) | b);
      bg.fillRect(0, y, width, 1);
    }

    // Stars
    const starGfx = this.add.graphics();
    starGfx.fillStyle(COLORS.STAR);
    for (let i = 0; i < 15; i++) {
      starGfx.fillRect(Math.random() * width, Math.random() * height * 0.5, 2, 2);
    }

    // Moon
    const moonGfx = this.add.graphics();
    moonGfx.fillStyle(COLORS.MOON);
    moonGfx.fillCircle(width - 60, 35, 10);
    moonGfx.fillStyle(COLORS.MOON, 0.15);
    moonGfx.fillCircle(width - 60, 35, 22);

    // Title
    this.add.text(width / 2, height * 0.12, 'WORD HOPPER', {
      fontSize: '22px',
      color: colorToHex(COLORS.PRIMARY),
      fontFamily: FONT_DISPLAY,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.22, 'Type to survive. Jump to thrive.', {
      fontSize: '14px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    // Pixel frog icon
    const frogGfx = this.add.graphics();
    const T = COLORS.FROG_BODY;
    const Y2 = COLORS.FROG_EYE;
    const D = COLORS.FROG_LEG;
    const P2 = COLORS.FROG_CHEEK;
    const fx = width / 2 - 8;
    const fy = height * 0.30;
    frogGfx.fillStyle(T); frogGfx.fillRect(fx, fy, 8, 2);
    frogGfx.fillStyle(T); frogGfx.fillRect(fx - 2, fy + 2, 12, 2);
    frogGfx.fillStyle(Y2); frogGfx.fillRect(fx, fy + 2, 2, 2);
    frogGfx.fillStyle(Y2); frogGfx.fillRect(fx + 6, fy + 2, 2, 2);
    frogGfx.fillStyle(T); frogGfx.fillRect(fx - 2, fy + 4, 12, 2);
    frogGfx.fillStyle(P2); frogGfx.fillRect(fx - 2, fy + 4, 2, 2);
    frogGfx.fillStyle(P2); frogGfx.fillRect(fx + 8, fy + 4, 2, 2);
    frogGfx.fillStyle(T); frogGfx.fillRect(fx - 4, fy + 6, 16, 2);
    frogGfx.fillStyle(D); frogGfx.fillRect(fx - 4, fy + 8, 4, 2);
    frogGfx.fillStyle(D); frogGfx.fillRect(fx + 8, fy + 8, 4, 2);

    // Bounce frog
    this.tweens.add({
      targets: frogGfx,
      y: -3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Difficulty buttons
    const difficulties: { key: Difficulty; label: string; accentColor: number; desc: string }[] = [
      { key: 'easy', label: 'EASY', accentColor: COLORS.SUCCESS, desc: '3-5 chars' },
      { key: 'medium', label: 'MEDIUM', accentColor: COLORS.SECONDARY, desc: '6-10 chars' },
      { key: 'hard', label: 'HARD', accentColor: COLORS.DANGER, desc: '10+ chars' },
    ];

    difficulties.forEach(({ key, label, accentColor, desc }, i) => {
      const yPos = height * 0.5 + i * 44;

      const container = this.add.container(width / 2, yPos);

      const bgRect = this.add.rectangle(0, 0, 200, 32, COLORS.PANEL_DARK);
      bgRect.setStrokeStyle(1, COLORS.BORDER);

      const labelTxt = this.add.text(-70, 0, label, {
        fontSize: '12px',
        color: colorToHex(accentColor),
        fontFamily: FONT_DISPLAY,
      }).setOrigin(0, 0.5);

      const descTxt = this.add.text(40, 0, desc, {
        fontSize: '14px',
        color: colorToHex(COLORS.TEXT_MUTED),
        fontFamily: FONT_BODY,
      }).setOrigin(0, 0.5);

      container.add([bgRect, labelTxt, descTxt]);
      container.setSize(200, 32);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        this.selectedDifficulty = key;
        this.updateHighlight();
      });

      this.difficultyBtns[key] = container;
    });

    // Start prompt
    const startText = this.add.text(width / 2, height * 0.82, '▸ PRESS ENTER TO START ◂', {
      fontSize: '12px',
      color: colorToHex(COLORS.MOON),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.startGame();
      }
    });

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.value = '';
      gameInput.focus();
      this.gameInputHandler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          this.startGame();
        }
      };
      gameInput.addEventListener('keydown', this.gameInputHandler);
    }

    this.updateHighlight();
  }

  private updateHighlight(): void {
    const accentColors: Record<Difficulty, number> = {
      easy: COLORS.SUCCESS,
      medium: COLORS.SECONDARY,
      hard: COLORS.DANGER,
    };
    (Object.keys(this.difficultyBtns) as Difficulty[]).forEach((key) => {
      const container = this.difficultyBtns[key];
      const bgRect = container.getAt(0) as Phaser.GameObjects.Rectangle;
      const labelTxt = container.getAt(1) as Phaser.GameObjects.Text;
      if (key === this.selectedDifficulty) {
        container.setAlpha(1);
        bgRect.setFillStyle(COLORS.BORDER_ACCENT, 1);
        bgRect.setStrokeStyle(2, accentColors[key]);
        labelTxt.setText('▶ ' + labelTxt.text.replace('▶ ', ''));
      } else {
        container.setAlpha(0.6);
        bgRect.setFillStyle(COLORS.PANEL_DARK, 1);
        bgRect.setStrokeStyle(1, COLORS.BORDER);
        labelTxt.setText(labelTxt.text.replace('▶ ', ''));
      }
    });
  }

  private startGame(): void {
    if (this.gameInputHandler) {
      const gameInput = document.getElementById('game-input') as HTMLInputElement;
      if (gameInput) gameInput.removeEventListener('keydown', this.gameInputHandler);
    }
    this.input.keyboard?.off('keydown');
    this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
  }
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Visual check**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vite`
Expected: Boot scene with gradient, title, frog, styled loading bar. Menu with moon, stars, frog icon, green/yellow/red difficulty buttons.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BootScene.ts src/scenes/MenuScene.ts
git commit -m "feat: redesign BootScene and MenuScene with Pixel Nature Night style"
```

---

### Task 8: DeathScene Score-vs-Best Redesign

**Files:**
- Rewrite: `src/scenes/DeathScene.ts`

This task implements the Score-vs-Best death screen with: score comparison, progress bar, stat cards, RETRY/MENU buttons, and localStorage for best scores.

- [ ] **Step 1: Rewrite `src/scenes/DeathScene.ts`**

```ts
import Phaser from 'phaser';
import { Difficulty, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../config/colors';
import { colorToHex } from '../utils/PixelArt';

export interface DeathData {
  score: number;
  wordsTyped: number;
  wpm: number;
  bestWord: string;
  difficulty: Difficulty;
}

function getBestScore(difficulty: Difficulty): number {
  return parseInt(localStorage.getItem(`word-hopper-best-${difficulty}`) || '0', 10);
}

function setBestScore(difficulty: Difficulty, score: number): void {
  localStorage.setItem(`word-hopper-best-${difficulty}`, score.toString());
}

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeathScene' });
  }

  create(data: DeathData): void {
    const { width, height } = this.cameras.main;

    // Dim game-like background
    const bg = this.add.graphics();
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const r = Math.round(0x0f * (1 - t) + 0x33 * t);
      const g = Math.round(0x17 * (1 - t) + 0x41 * t);
      const b = Math.round(0x2a * (1 - t) + 0x55 * t);
      bg.fillStyle((r << 16) | (g << 8) | b, 0.4);
      bg.fillRect(0, y, width, 1);
    }

    // Red line at top
    const redLine = this.add.graphics();
    redLine.fillStyle(COLORS.DANGER);
    redLine.fillRect(0, 0, width, 3);

    // Best score logic
    const best = getBestScore(data.difficulty);
    const isNewBest = data.score > best;
    if (isNewBest) {
      setBestScore(data.difficulty, data.score);
    }
    const displayBest = isNewBest ? data.score : best;
    const pct = displayBest > 0 ? Math.min(data.score / displayBest, 1) : 0;

    let currentY = 30;

    // GAME OVER
    this.add.text(width / 2, currentY, 'GAME OVER', {
      fontSize: '16px',
      color: colorToHex(COLORS.DANGER),
      fontFamily: FONT_DISPLAY,
    }).setOrigin(0.5);
    currentY += 40;

    // Score vs Best side by side
    const scoreX = width / 2 - 60;
    const bestX = width / 2 + 60;

    // Current score
    this.add.text(scoreX, currentY, data.score.toLocaleString(), {
      fontSize: '26px',
      color: colorToHex(COLORS.PRIMARY),
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(scoreX, currentY + 28, 'THIS RUN', {
      fontSize: '9px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    // Divider
    const divider = this.add.graphics();
    divider.fillStyle(COLORS.BORDER);
    divider.fillRect(width / 2, currentY, 1, 40);

    // Best score
    this.add.text(bestX, currentY, displayBest.toLocaleString(), {
      fontSize: '26px',
      color: colorToHex(COLORS.SECONDARY),
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(bestX, currentY + 28, 'BEST', {
      fontSize: '9px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    currentY += 50;

    // NEW BEST badge
    if (isNewBest) {
      this.add.text(width / 2, currentY, '★ NEW BEST ★', {
        fontSize: '10px',
        color: colorToHex(COLORS.SECONDARY),
        fontFamily: FONT_DISPLAY,
      }).setOrigin(0.5);
      currentY += 20;
    }

    // Progress bar
    const barW = width * 0.6;
    const barH = 6;
    const barX = (width - barW) / 2;

    const barTrack = this.add.graphics();
    barTrack.fillStyle(COLORS.PANEL_DARK);
    barTrack.fillRect(barX, currentY, barW, barH);
    barTrack.lineStyle(1, COLORS.BORDER);
    barTrack.strokeRect(barX, currentY, barW, barH);

    // Animated fill
    const barFill = this.add.graphics();
    this.tweens.addCounter({
      from: 0,
      to: pct,
      duration: 600,
      onUpdate: (tween) => {
        const val = tween.getValue();
        barFill.clear();
        barFill.fillStyle(COLORS.PRIMARY);
        barFill.fillRect(barX, currentY, barW * val, barH);
      },
    });

    currentY += 12;

    this.add.text(width / 2, currentY, `${Math.round(pct * 100)}% of best`, {
      fontSize: '9px',
      color: colorToHex(COLORS.TEXT_MUTED),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    currentY += 24;

    // Stat cards
    const statW = 80;
    const statGap = 12;
    const totalStatW = statW * 3 + statGap * 2;
    const statStartX = (width - totalStatW) / 2;

    // Words Typed
    const stat1X = statStartX + statW / 2;
    const stat1Bg = this.add.rectangle(stat1X, currentY + 10, statW, 40, COLORS.PANEL_DARK);
    stat1Bg.setStrokeStyle(1, COLORS.BORDER);
    this.add.text(stat1X, currentY + 4, data.wordsTyped.toString(), {
      fontSize: '16px',
      color: colorToHex(COLORS.SUCCESS),
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(stat1X, currentY + 22, 'WORDS', {
      fontSize: '8px',
      color: colorToHex(COLORS.TEXT_MUTED),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    // WPM
    const stat2X = statStartX + statW + statGap + statW / 2;
    const stat2Bg = this.add.rectangle(stat2X, currentY + 10, statW, 40, COLORS.PANEL_DARK);
    stat2Bg.setStrokeStyle(1, COLORS.BORDER);
    this.add.text(stat2X, currentY + 4, data.wpm.toString(), {
      fontSize: '16px',
      color: colorToHex(COLORS.SUCCESS),
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(stat2X, currentY + 22, 'WPM', {
      fontSize: '8px',
      color: colorToHex(COLORS.TEXT_MUTED),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    // Best Word
    const stat3X = statStartX + (statW + statGap) * 2 + statW / 2;
    const stat3Bg = this.add.rectangle(stat3X, currentY + 10, statW, 40, COLORS.PANEL_DARK);
    stat3Bg.setStrokeStyle(1, COLORS.BORDER);
    this.add.text(stat3X, currentY + 4, data.bestWord || '—', {
      fontSize: '11px',
      color: colorToHex(COLORS.SECONDARY),
      fontFamily: FONT_BODY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(stat3X, currentY + 22, 'BEST', {
      fontSize: '8px',
      color: colorToHex(COLORS.TEXT_MUTED),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    currentY += 52;

    // Difficulty badge
    this.add.text(width / 2, currentY, `▸ ${data.difficulty.toUpperCase()} ◂`, {
      fontSize: '9px',
      color: colorToHex(COLORS.TEXT_MUTED),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    currentY += 28;

    // RETRY button
    const retryBg = this.add.rectangle(width / 2 - 40, currentY, 80, 28, COLORS.PRIMARY);
    retryBg.setStrokeStyle(2, COLORS.PRIMARY);
    const retryText = this.add.text(width / 2 - 40, currentY, 'RETRY', {
      fontSize: '10px',
      color: colorToHex(COLORS.SKY_TOP),
      fontFamily: FONT_DISPLAY,
    }).setOrigin(0.5);

    const retryContainer = this.add.container(width / 2 - 40, currentY);
    retryContainer.add([retryBg, retryText]);
    retryContainer.setSize(80, 28);
    retryContainer.setInteractive({ useHandCursor: true });
    retryContainer.on('pointerdown', () => this.retry());

    // MENU button
    const menuBg = this.add.rectangle(width / 2 + 50, currentY, 70, 28, COLORS.PANEL_DARK);
    menuBg.setStrokeStyle(1, COLORS.BORDER);
    const menuText = this.add.text(width / 2 + 50, currentY, 'MENU', {
      fontSize: '10px',
      color: colorToHex(COLORS.TEXT_SECONDARY),
      fontFamily: FONT_DISPLAY,
    }).setOrigin(0.5);

    const menuContainer = this.add.container(width / 2 + 50, currentY);
    menuContainer.add([menuBg, menuText]);
    menuContainer.setSize(70, 28);
    menuContainer.setInteractive({ useHandCursor: true });
    menuContainer.on('pointerdown', () => this.goToMenu());

    currentY += 24;

    // Enter hint
    this.add.text(width / 2, currentY, 'or press ENTER', {
      fontSize: '9px',
      color: colorToHex(COLORS.TEXT_MUTED),
      fontFamily: FONT_BODY,
    }).setOrigin(0.5);

    // Keyboard handlers
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.retry();
      }
      if (event.key === 'Escape') {
        this.goToMenu();
      }
    });

    const gameInput = document.getElementById('game-input') as HTMLInputElement;
    if (gameInput) {
      gameInput.focus();
      gameInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.retry();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.goToMenu();
        }
      });
    }
  }

  private retry(): void {
    this.input.keyboard?.off('keydown');
    this.scene.start('GameScene', { difficulty: this.scene.settings.data?.difficulty || 'easy' });
  }

  private goToMenu(): void {
    this.input.keyboard?.off('keydown');
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 2: Fix DeathScene retry — pass difficulty through**

The `this.scene.settings.data` in `retry()` may not contain the difficulty. We need to store it. Add a class field:

Add `private difficulty: Difficulty = 'easy';` to the class, and in `create()`, add `this.difficulty = data.difficulty;`. Then in `retry()` use `this.scene.start('GameScene', { difficulty: this.difficulty });`.

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Visual check — play game, die, see death screen**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vite`
Expected: Score-vs-Best layout, progress bar animates, RETRY/MENU buttons work, best score persists in localStorage

- [ ] **Step 5: Commit**

```bash
git add src/scenes/DeathScene.ts
git commit -m "feat: redesign DeathScene with Score-vs-Best layout and localStorage best scores"
```

---

### Task 9: Final Polish & Verification

**Files:**
- Modify: `src/config/colors.ts` (if needed after testing)

- [ ] **Step 1: Run full type check**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run existing tests**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vitest run`
Expected: All tests pass (none of the tests touch visual code)

- [ ] **Step 3: Play through full game flow**

Run: `cd /home/zhu/wsl-workspace/me/idea/word-hopper && npx vite`

Verify:
1. Boot scene loads with gradient, title, frog, progress bar
2. Menu shows sky, moon, stars, frog, difficulty buttons work
3. Game has parallax background, pixel frog, pixel plants, HUD, typing indicator
4. Death shows score-vs-best, progress bar, RETRY/MENU buttons
5. RETRY goes to GameScene with same difficulty
6. MENU goes back to MenuScene
7. Best score persists after page reload

- [ ] **Step 4: Fix any visual issues found during testing**

Tweak colors, sizes, positions as needed based on play test.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Pixel Nature Night UI redesign"
```
