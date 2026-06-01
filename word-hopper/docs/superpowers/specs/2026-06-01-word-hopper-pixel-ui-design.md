---
date: 2026-06-01
title: Word Hopper Pixel Nature Night UI Redesign
status: approved
---

# Word Hopper: Pixel Nature Night UI Redesign

## Overview

Complete visual overhaul of all 4 scenes from flat rectangles + monospace text to a **Pixel Nature Night** aesthetic: moonlit outdoor scene with pixel art characters, detailed plant obstacles, parallax background layers, and retro pixel fonts.

## Style Direction

**Pixel Nature Night** — A moonlit pixel art world. Dark gradient sky with stars and moon, distant rolling hills, lush green ground with grass tufts. The pixel frog character hops through gaps in pixel art plant obstacles. Warm and charming while maintaining arcade intensity.

### Design Principles

- All visuals drawn via Phaser Graphics API (fillRect, fillCircle) — no sprite assets needed
- Pixel-perfect rendering: integer coordinates only, no sub-pixel
- Consistent pixel grid: 2px minimum feature size
- Every shape is hand-drawn pixel art, not plain rectangles
- Game background stays visible (dimmed) in death scene for continuity

## Color Palette

### Background & Nature

| Name | Hex | Usage |
|------|-----|-------|
| Sky Top | `#0F172A` | Top of gradient sky |
| Sky Mid | `#1E293B` | Middle of gradient sky |
| Horizon | `#334155` | Bottom of sky gradient, near hills |
| Hills | `#1B4332` | Distant hills silhouettes |
| Ground | `#2D6A4F` | Main ground fill |
| Ground Edge | `#40916C` | Top edge of ground (bright line) |
| Grass Highlight | `#52B788` | Grass tufts, ground surface shimmer |

### UI Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary (Teal) | `#4ECDC4` | Title, player body, word1, HUD score, buttons |
| Secondary (Gold) | `#FBBF24` | Word2, speed display, moon, best word highlight |
| Success (Green) | `#4ADE80` | Typed characters, difficulty easy, positive feedback |
| Danger (Red) | `#EF4444` | Wrong typing flash, death overlay, game over text |
| Moon | `#FDE68A` | Moon glow, warm accents |

### Text & UI Chrome

| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#F9FAFB` | Stats values, readable body text |
| Text Secondary | `#64748B` | Labels, descriptions, dim text |
| Text Muted | `#475569` | Hints, tertiary info |
| Panel Dark | `#1E293B` | Card/panel backgrounds |
| Border | `#334155` | Panel borders, dividers |
| Border Accent | `#2D6A4F` | Active/selected element borders (with #40916C fill) |

## Typography

| Role | Font | Size | Usage |
|------|------|------|-------|
| Display | Press Start 2P | 22px | Game title, GAME OVER |
| Heading | Press Start 2P | 12-14px | Section headers, button labels |
| Body | VT323 | 16-18px | Words in game, stats, descriptions |
| HUD | VT323 | 14px | Score, speed, typing progress |
| Micro | VT323 | 10-12px | Labels, hints |

Both fonts loaded via Google Fonts in index.html.

## Pixel Frog Character

The player is a pixel frog drawn on a Phaser Container. All coordinates are relative to the container origin (center-bottom).

### Idle Pose (facing right)

```
Grid: each cell = 2x2 pixels
Character size: ~16px wide x 20px tall (before scaling)
Origin: bottom-center

Color map (top to bottom, left to right):
Row 0:  . . T T T T . .        T = Teal #4ECDC4 (head top)
Row 1:  . T Y T T Y T .        Y = Yellow #FFD93D (eyes)
Row 2:  . T T T T T T .        
Row 3:  . T P T T P T .        P = Pink #F472B6 (cheeks)
Row 4:  . T T T T T T .        
Row 5:  T T T T T T T T        (body, wider)
Row 6:  T D T T T T D T        D = Dark green #2D6A4F (feet start)
Row 7:  . T T T T T T .        
Row 8:  . D D . . D D .        (feet)
```

### Jump Pose

Same as idle but:
- Legs extend downward (2 extra rows of D)
- Eyes shift up 1 pixel (anticipation)
- Body squishes slightly wider

### Death Pose

- Eyes become X marks (white #F9FAFB)
- Body color dims to #64748B
- Legs splay outward

## Pixel Plant Obstacles

Each plant type has a unique pixel art silhouette. All drawn via Phaser Graphics fillRect calls.

### Drawing Convention

- All plants are 24-32px wide
- Lower obstacles grow up from ground
- Upper obstacles hang down from top
- Each plant has 2-3 colors: main body, highlight, accent

### Cactus

```
Body: #22C55E (green)
Highlight: #4ADE80 (light green)
Accent: #166534 (dark green, spines)

Shape: Tall column with 2 side arms
- Main stem: 6px wide, full height
- Left arm at 40% height, extends left 4px, cap with 2px round
- Right arm at 60% height, extends right 4px, cap with 2px round  
- Spines: 1px dots on edges at intervals
```

### Mushroom

```
Cap: #E17055 (orange-red)
Cap Spots: #FDE68A (cream dots)
Stem: #FBBF24 (golden yellow)

Shape: Wide cap on narrow stem
- Cap: dome shape, 20px wide, 8px tall, 3 cream spots
- Stem: 8px wide, extends down
```

### Hanging Vines

```
Vines: #6AB04C (medium green)
Leaves: #52B788 (bright green)

Shape: 2-3 dangling strands from top
- Each strand: 2px wide, different lengths
- Small leaf clusters at tips (4px triangle shapes)
- Top bar: 20px wide horizontal mount
```

### Venus Flytrap

```
Jaws: #27AE60 (darker green)
Teeth/Inside: #EF4444 (red)
Stem: #166534 (dark green)

Shape: Wide open jaw on a stem
- Top jaw: trapezoid pointing down
- Bottom jaw: trapezoid pointing up  
- Red interior visible between jaws
- Sharp tooth shapes along edges
- Stem below
```

### Tree Stump

```
Bark: #8B4513 (saddle brown)
Top ring: #6B7280 (gray, cross-section)
Highlight: #A0522D (sienna)

Shape: Wide squat cylinder
- Top surface: 24px wide, 6px tall with gray ring pattern
- Body: 20px wide, extends down
- Slight taper at bottom
```

### Bramble

```
Body: #2D5016 (dark green)
Thorns: #1E293B (dark)
Highlight: #3D6B1E (lighter dark green)

Shape: Zigzag thorny mass
- Alternating left-right triangles stacked vertically
- Small thorn dots at peaks
- Wider than tall (28px wide)
```

## Scene-by-Scene Design

### BootScene

**Background:** Sky gradient (top #0F172A → mid #1E293B)

**Content (centered):**
1. Title "WORD HOPPER" in Press Start 2P, teal #4ECDC4 with subtle text-shadow glow
2. Decorative pixel line below title: 20px of #2D6A4F blocks
3. Mini pixel frog (8px tall version) below the line, bouncing tween
4. Loading text "Loading..." in VT323, #64748B
5. Progress bar: 60% canvas width, 12px tall
   - Track: #1E293B with 1px #334155 border
   - Fill: gradient left #2D6A4F → right #4ECDC4

**Animation:** Frog does a small bounce tween (y: +2px, yoyo, 600ms repeat)

### MenuScene

**Background:** Sky gradient + stars (small dots, #475569) + moon (top-right, #FDE68A with glow shadow)

**Layout (vertical, centered):**
1. Title "WORD HOPPER" — Press Start 2P 22px, #4ECDC4, glow
2. Subtitle "Type to survive. Jump to thrive." — VT323 12px, #64748B
3. Pixel frog icon — 12px tall, centered, idle animation
4. Difficulty buttons (3 stacked):
   - **Selected:** bg #2D6A4F, border 2px #40916C, text in accent color (Easy=#4ADE80, Medium=#FBBF24, Hard=#EF4444), bold, with ▶ prefix
   - **Unselected:** bg #1E293B, border 1px #334155, text #64748B, no prefix
   - Size: ~200px wide, 32px tall each, 8px gap
5. Start prompt "▸ PRESS ENTER TO START ◂" — VT323 12px, #FDE68A, alpha blink tween (1.0→0.3, 800ms yoyo)

**Click handler:** Same Container approach as current, but with new colors/styling

### GameScene

**Background layers (rendered in order, back to front):**

| Layer | Element | Speed | Detail |
|-------|---------|-------|--------|
| 0 | Sky gradient | Static | fillRect top #0F172A → bottom #334155 |
| 1 | Stars | 0.05x | ~15 small 2x2 dots, #475569, very slow parallax |
| 2 | Moon | 0.02x | 16px circle, #FDE68A, glow shadow, top-right area |
| 3 | Distant hills | 0.2x | #1B4332 rounded shapes, silhouettes |
| 4 | Ground | 1.0x (game speed) | #2D6A4F fill, #40916C 2px top edge, #52B788 1px shimmer |
| 5 | Grass tufts | 1.0x | Small #52B788 pixel clusters on ground surface |

**Parallax implementation:** Each layer has a scroll factor. Stars and moon are recreated as they scroll off-screen. Hills tile seamlessly.

**HUD (top-left):**
- Semi-transparent panel: bg rgba(15,23,42,0.8), border 1px rgba(45,106,79,0.5)
- Score: "SCORE 1,240" in VT323 14px, #4ECDC4 with text-shadow glow
- Speed: "SPEED 1.3x" in VT323 14px, #FBBF24

**Typing progress (bottom-center):**
- Semi-transparent panel, same style as HUD
- Shows current word with typed chars in #4ADE80, remaining in #64748B
- Example: `ho|p` → "ho" in green, "p" in gray with cursor line

**Timing line:**
- Dashed vertical line (3px on, 3px off) from y=30 to GROUND_Y
- Color: #4ECDC4, alpha varies by proximity (0.7 near, 0.3 far)
- Triangle arrow at top

**Words in gap:**
- Word1: VT323 16px, #4ECDC4, bold, subtle text-shadow glow
- Word2: VT323 16px, #FBBF24, bold, subtle text-shadow glow
- Typed characters turn #4ADE80 with cursor pipe
- Wrong flash: #EF4444 for 200ms
- Unselected word fades to alpha 0.2

**Plant rendering:**
- Each plant drawn via dedicated draw method on Phaser Graphics
- Lower plants anchored at ground level, growing upward
- Upper plants anchored at top, hanging downward
- Plants scroll with obstacle x position

### DeathScene

**Background:** Game scene frozen, dimmed to 30% opacity. Thin red (#EF4444) 3px line across top of screen.

**Content (centered, vertical):**

1. "GAME OVER" — Press Start 2P 16px, #EF4444, glow text-shadow
2. Score comparison (side by side):
   - Left: current run score in #4ECDC4, 26px, bold. Label "THIS RUN" below in #64748B 8px
   - Divider: 1px #334155 vertical line
   - Right: best score in #FBBF24, 26px, bold. Label "BEST" below in #64748B 8px
3. Progress bar (70% width, 6px tall):
   - Track: #1E293B with 1px #334155 border
   - Fill: gradient #4ECDC4 → #FBBF24, width = (current/best * 100)%
   - Label below: "35% of best" in #64748B 7px
4. Stats row (horizontal):
   - 3 items: Words Typed, WPM, Best Word
   - Values in #4ADE80 14px bold, labels in #475569 7px
   - Best word value in #FBBF24
5. Difficulty badge: "▸ EASY ◂" in #475569 8px
6. Action buttons (horizontal):
   - RETRY: bg #4ECDC4, text #0F172A, 10px bold, 2px border #4ECDC4, padding 6px 20px
   - MENU: bg transparent, text #64748B, 10px, 1px border #334155, padding 6px 14px
7. ENTER hint: "or press ENTER" in #475569 8px below RETRY

**Best score tracking:** Stored in localStorage per difficulty. If new best, show "★ NEW BEST ★" badge in #FBBF24 between title and scores.

**Animation:** No crash animation. Scene transitions instantly from game (500ms delay retained). Score numbers count up from 0 to final value over 600ms for dramatic reveal.

## Implementation Notes

### Font Loading

Add to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
```

Fonts must be loaded before Phaser creates text objects. BootScene's preload should include a brief delay or font-check to ensure they're available.

### Pixel Art Drawing Pattern

All pixel art uses a helper approach on Phaser Graphics:
```ts
// Example: draw a 2x2 pixel at grid position
private drawPixel(g: Phaser.GameObjects.Graphics, x: number, y: number, pixelSize: number, color: number) {
  g.fillStyle(color);
  g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}
```

Pixel size = 2 (each "pixel" in the art is 2x2 real pixels for visibility at game resolution).

### Parallax System

Create a simple parallax manager that tracks multiple Graphics/TileSprite layers with different scroll speeds. Each layer's x offset = base_x - (distance * speed_factor). TileSprite for repeating elements (stars, hills), regular Graphics for one-off elements (moon).

### Best Score Storage

```ts
// localStorage key pattern
const BEST_SCORE_KEY = `word-hopper-best-${difficulty}`;
```

Loaded in DeathScene, compared against current run score. Saved on new best.

### What NOT to Change

- Game logic (typing, collision, scoring, speed)
- Canvas size (800x450)
- Hidden input mechanism for Vim compatibility
- Physics constants (gravity, jump formula)
- Collision hitbox logic (60% shrink)
