# Word Hopper

[中文版](./README_CN.md)

A hopping game for word typing practice.

## How to Play

Obstacles scroll toward you from the right, each displaying one or two words.

1. **Type the first letter** of a word to select it
2. **Finish typing** the rest of the word
3. **Press SPACE** to jump through the gap matching that word

Type the wrong letter and you'll have to start over. Collide with an obstacle and it's game over.

After completing a word, a **green timing line** appears on screen — it marks the ideal moment to press SPACE. Jump closer to the line for a more precise landing; the flash glows brighter the nearer you are.

The game speeds up as you clear obstacles. Four difficulty levels control word length and speed:

- **Chill** — 3–5 characters, half speed
- **Easy** — 3–5 characters
- **Medium** — 6–8 characters
- **Hard** — 8+ characters

## Development

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
```
