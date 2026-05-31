# Word Hopper — MVP Design Spec

## Overview

Word Hopper is an endless runner + typing game. The character runs right while the world scrolls left. Obstacles (plants) appear with gaps, and words float inside the gaps. The player types words to control jump height — upper word = high jump, lower word = low jump. One-hit death, instant restart. Score rewards both survival and typing skill.

## Gameplay

### Core Loop

```
Start → Character auto-runs → Obstacle + 2 words appear on right → Player types → Jump →
  ├─ Clear gap → Score bonus → Speed increases → Next obstacle
  └─ Hit obstacle → Death → Score screen → Restart
```

### Difficulty Modes

| Mode | Word Length | Word Count |
|------|------------|------------|
| Easy | 3-5 chars | 1,631 words |
| Medium | 6-10 chars | 2,756 words |
| Hard | 10+ chars | 1,543 words |

Selected at title screen. Press SPACE or click START to begin.

### Character

- Fixed horizontal position (X = 80px)
- Faces right (sprite flipped)
- Only vertical movement (jump/land)
- One-hit death on collision with any obstacle

### Typing Mechanics

- Two words float in the obstacle gap, positioned at different heights
- Words are bound to the obstacle group and scroll together
- **Position mapping**: upper word = high jump target, lower word = low jump target
- Both words always have **different first letters** (guaranteed by WordSpawner)
- Player types directly (no input box) — first keystroke auto-matches the word with that first letter
- Correct letter → turns green
- Wrong letter → word flashes red (200ms), progress resets to 0
- After wrong letter, player can switch to the other word by typing its first letter
- When all letters green → character jumps to the word's Y position
- The unselected word fades out

### Skip Mechanic

- **Upper-only obstacle**: player can skip typing and run through the gap. Survives but earns 0 bonus.
- **Lower-only obstacle**: player MUST jump or die. No typing = no jump = death.
- This is intentional: skip is a safe-but-low-score strategy.

### Mid-Air Typing

- Typing is always allowed, even while airborne
- If player completes a word mid-jump, current jump is overridden — new target height applied immediately, physics recalculates velocity

### Multiple Obstacles On Screen

- At high speed, multiple obstacle groups may be visible
- Only the **nearest** upcoming obstacle group accepts typing input
- Farther groups are dimmed

## Scoring

| Component | Formula | Notes |
|-----------|---------|-------|
| Base score | +1 per tick | Survival reward |
| Word bonus | +10 × word_length × current_speed | Typing reward |
| Skip | 0 bonus | Safe but no points |

Example: Hard mode, speed 2.0x, type "adventure" (9 chars) → 10 × 9 × 2.0 = +180 points.

## Speed & Acceleration

| Distance | Rule |
|----------|------|
| 0-500m | Fixed initial speed (200 px/s) |
| 500-1500m | +1% speed every 3 obstacles cleared |
| 1500m+ | +1% speed every 1 obstacle cleared |
| Cap | 2.5× initial speed (500 px/s) |

## Jump Physics

Character only moves vertically. World scrolls horizontally regardless.

| Quantity | Formula |
|----------|---------|
| Target height h | word_y − ground_y |
| Initial velocity vy₀ | √(2 × g × h) |
| Time to apex | √(2h / g) |
| Total airtime | 2 × √(2h / g) |

Constants: `GRAVITY = 1200 px/s²`, `PLAYER_X = 80px`, `PLAYER_HEIGHT = 32px`

The character does NOT need to be at apex when passing the obstacle — it just needs its Y coordinate to be within the gap at the moment the obstacle reaches PLAYER_X.

## Obstacles

### Plant Types

| Plant | Shape | Appearance |
|-------|-------|------------|
| Cactus | Tall, narrow | Upper or lower, grows from ceiling/floor |
| Bramble | Wide, with downward thorns | Upper-only, hangs from ceiling |
| Mushroom | Short, wide | Lower-only, sits on ground |
| Venus Flytrap | Wide jaws | Upper+lower combo |
| Tree Stump | Very wide, short | Lower-only |
| Hanging Vines | Long, thin with thorns | Upper-only |

### Layout Types

| Type | Probability | Words | Notes |
|------|------------|-------|-------|
| Upper + Lower | 70% | 2 words | Must choose height |
| Upper-only | 15% | 1 word | Can skip (0 bonus) |
| Lower-only | 15% | 1 word | Must type or die |

### Gap & Position Randomization

- Gap height: random in [2.5×, 4.5×] player height (80px – 144px)
- Upper/lower obstacle lengths: random, but must produce a valid gap within bounds
- Single obstacles: can appear at various heights

## Spacing Formula

Obstacle spacing ensures the player has enough time to read, decide, and type before the obstacle arrives.

```
spacing = scroll_speed × (char_count × 0.25s + 0.8s) × 1.3 × compression_factor

compression_factor = 1.0 / sqrt(current_speed)
```

The compression factor makes higher speeds genuinely harder (less real time to type), not just visually faster.

**Timing invariant**: obstacle arrival time must always exceed `typing_window + time_to_apex`. This ensures the player can complete the word AND reach the target height before the obstacle reaches PLAYER_X. The spacing formula's safety factor (1.3) accounts for this.

| Speed | Compression | Effective Time Window |
|-------|------------|----------------------|
| 1.0x | 1.00 | 100% |
| 1.5x | 0.82 | 82% |
| 2.0x | 0.71 | 71% |
| 2.5x | 0.63 | 63% |

Obstacles and their words appear simultaneously on the right edge of the screen.

## UI

### HUD (top-right corner)

Grid layout, monospace font:
- `Score:` label left-aligned, value right-aligned
- `Speed:` label left-aligned, value right-aligned

### Screens

1. **Title** → click difficulty → SPACE or click START
2. **Game** → HUD + gameplay
3. **Death** → final score, words typed, WPM, best word → SPACE → back to title

All text in English. All game words in lowercase.

## Visual Style

Minimalist pixel/line art. Dark background (#1a1a2e), green plants, colored words (cyan upper, yellow lower), red thorns.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Engine | Phaser 3 (Canvas mode) |
| Language | TypeScript (strict) |
| Build | Vite |
| Word lists | Static JSON files |
| Deploy | Static site (any CDN) |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Project Structure

```
word-hopper/
├── public/
│   ├── assets/
│   │   ├── sprites/       # character, plant spritesheets
│   │   ├── audio/         # jump, type-correct, type-wrong, death
│   │   └── fonts/         # pixel font for words
│   └── index.html
├── src/
│   ├── main.ts            # Phaser game config + boot
│   ├── scenes/
│   │   ├── BootScene.ts   # preload assets
│   │   ├── MenuScene.ts   # title + difficulty select
│   │   ├── GameScene.ts   # main gameplay
│   │   └── DeathScene.ts  # score screen + restart
│   ├── entities/
│   │   ├── Player.ts      # character + jump physics
│   │   └── Obstacle.ts    # plant obstacle (type, gap, scroll)
│   ├── systems/
│   │   ├── TypingSystem.ts   # input capture, prefix match, char highlight
│   │   ├── WordSpawner.ts    # word pair generation + first-letter diff
│   │   ├── ObstacleSpawner.ts # random plant type + gap generation
│   │   ├── ScoreSystem.ts    # base score + word bonus + speed multiplier
│   │   └── SpeedManager.ts   # staged acceleration
│   ├── data/
│   │   ├── words-easy.json   # 1631 words
│   │   ├── words-medium.json # 2756 words
│   │   └── words-hard.json   # 1543 words
│   └── config/
│       └── constants.ts      # all tunable game params
├── tests/
│   ├── TypingSystem.test.ts
│   ├── WordSpawner.test.ts
│   ├── ScoreSystem.test.ts
│   └── SpeedManager.test.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Constants

| Constant | Value |
|----------|-------|
| CANVAS_WIDTH | 800 |
| CANVAS_HEIGHT | 450 |
| PLAYER_X | 80 |
| PLAYER_HEIGHT | 32 |
| GROUND_Y | CANVAS_HEIGHT - 35 |
| INITIAL_SCROLL_SPEED | 200 px/s |
| MAX_SPEED | 2.5× |
| GRAVITY | 1200 px/s² |
| GAP_MIN | 2.5 × PLAYER_HEIGHT (80px) |
| GAP_MAX | 4.5 × PLAYER_HEIGHT (144px) |
| SINGLE_OBSTACLE_CHANCE | 0.3 |
| TYPING_WINDOW_PER_CHAR | 0.25s |
| DECISION_BUFFER | 0.8s |
| SPACING_SAFETY_FACTOR | 1.3 |
| COMPRESSION_FACTOR | 1.0 / sqrt(current_speed) |

## Audio (MVP)

| Sound | Trigger | Duration |
|-------|---------|----------|
| Soft tick | Correct letter typed | <200ms |
| Low buzz | Wrong letter typed | <200ms |
| Whoosh | Jump | <200ms |
| Thud | Death | <300ms |

All sounds are optional — the game is fully playable muted.

## Out of Scope (Post-MVP)

- Mobile/touch support
- Leaderboards / online features
- Multiple language word lists
- Themed word packs (programmer, GRE, etc.)
- Particle effects
- Background parallax
- Difficulty switching mid-run
