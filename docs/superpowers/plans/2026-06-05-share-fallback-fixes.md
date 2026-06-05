# Share Fallback Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make share links with `score=0` render the share card correctly and make the share button gracefully fall back when Clipboard API support is missing or fails.

**Architecture:** Keep the fix tightly scoped to the existing share helpers and death screen. Add focused tests around share param parsing and extract the share action into a small exported helper so the fallback order can be tested without booting a Phaser scene.

**Tech Stack:** TypeScript, Vitest, Phaser 3

---

### Task 1: Cover share param parsing

**Files:**
- Modify: `src/scenes/ShareCardScene.ts`
- Create: `tests/ShareCardScene.test.ts`
- Test: `tests/ShareCardScene.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
it('accepts score=0 share links', () => {
  window.history.replaceState({}, '', 'https://example.com/?s=0&w=0&bw=&d=easy');

  expect(parseShareParams()).toEqual({
    score: 0,
    wpm: 0,
    bestWord: '',
    difficulty: 'easy',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ShareCardScene.test.ts`
Expected: FAIL because `parseShareParams()` currently returns `null` for `score=0`.

- [ ] **Step 3: Write minimal implementation**

```typescript
const rawScore = params.get('s');
const score = rawScore === null ? NaN : parseInt(rawScore, 10);

if (Number.isNaN(score) || !['chill', 'easy', 'medium', 'hard'].includes(difficulty)) {
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ShareCardScene.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/ShareCardScene.test.ts src/scenes/ShareCardScene.ts docs/superpowers/plans/2026-06-05-share-fallback-fixes.md
git commit -m "test: cover share param parsing"
```

### Task 2: Cover share button fallback order

**Files:**
- Modify: `src/scenes/DeathScene.ts`
- Modify: `tests/ShareCardScene.test.ts`
- Test: `tests/ShareCardScene.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
it('falls back to navigator.share when clipboard API is unavailable', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

  const copied = await shareResult({ url: 'https://example.com', title: 'Word Hopper' });

  expect(copied).toBe(false);
  expect(share).toHaveBeenCalledWith({ title: 'Word Hopper', url: 'https://example.com' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/ShareCardScene.test.ts`
Expected: FAIL because there is no helper covering the fallback path yet.

- [ ] **Step 3: Write minimal implementation**

```typescript
export async function shareResult(data: { title: string; url: string }): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch {
      // fall through to navigator.share
    }
  }

  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch {
      // ignore user cancellation and unsupported environments
    }
  }

  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/ShareCardScene.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/ShareCardScene.test.ts src/scenes/DeathScene.ts
git commit -m "fix: harden share fallback flow"
```

### Task 3: Verify integrated behavior

**Files:**
- Modify: `src/scenes/DeathScene.ts`
- Modify: `src/scenes/ShareCardScene.ts`
- Test: `tests/ShareCardScene.test.ts`

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/ShareCardScene.test.ts`
Expected: PASS

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS with all existing and new tests green.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/ShareCardScene.test.ts src/scenes/DeathScene.ts src/scenes/ShareCardScene.ts docs/superpowers/plans/2026-06-05-share-fallback-fixes.md
git commit -m "fix: support zero-score share links"
```
