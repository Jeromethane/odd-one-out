# Odd Word Game — Test Report

Date of this run: **18 October 2026**
Environment: Windows, Chromium-based browser, served locally at
`http://127.0.0.1:8000/odd-word-game/` (a local server so the app is exercised
under a repository **sub-path**, exactly like GitHub Pages).

Everything in this report was actually executed. Nothing here is predicted or
assumed.

---

## 1. Automated test suite

- **How it was run:** opened `http://127.0.0.1:8000/odd-word-game/tests/test-runner.html`
  in the browser, waited for the runner to finish, then read
  `window.__TEST_RESULTS__` from the page.
- **Result:**

| Metric | Value |
|--------|-------|
| Total tests | 47 |
| Passed | **47** |
| Failed | **0** |
| Page title | `TESTS PASSED (47/47)` |
| Failures list | empty |

The suite was re-run again after the final CSS change (word hyphenation) and
still reported **47/47 PASS**.

The suite covers (grouped): word-bank integrity (180 categories, ids 1–180,
no duplicate words), round generation (4+1 / 6+1 / 8+1 words, odd word from a
different category, unbiased shuffle, ambiguity exclusions), level config
(13/9/5 correct, 180/120/60 seconds, 3rd wrong = loss), timer behaviour,
storage persistence, statistics maths, navigation between all screens, the
start-form validation states, and the DOM contract each screen must satisfy
(`#username-form`, `#word-grid`, `.word-tile[data-word-index]`, `#timer-text`,
`#correct-count`, `#wrong-count`, `#feedback`, `#total-correct`,
`#total-wrong`, `#levels-completed-count`, `#change-username-form`, and the
action names `play`, `statistics`, `go-home`, `stats-prev`, `stats-next`,
`change-username`, `cancel-username-change`, `retry`, `continue`, `all-yes`,
`all-no`, `choose-level`, `choose-home`, `home2-play`, `home2-back`).

## 2. Manual browser walkthrough (scripted in-page, real app)

Each flow below was performed by driving the real rendered app (clicking the
real buttons/tiles) and reading the real DOM + `localStorage` afterwards.

### 2.1 Start → Home
- Empty submit keeps the Start screen and shows an error message.
- Typing a name enables **SAVE**; saving stores the username and opens **Home**.
- Home shows the username, the 03:00 clock and the "NEXT UP LEVEL 1" card.

### 2.2 Level 1 complete (5 words / 180 s / 13 correct)
- **5 tiles** rendered, timer started at **03:00**, score counters at 0.
- Played **13 rounds**, tapping the odd word every time.
- Feedback after every tap: green tile + `CORRECT — NICE ONE!`, tile class
  `word-tile is-correct`.
- After the 13th correct answer → **Level Completed** screen:
  `IN 00:10 · GOT 13 ANSWERS CORRECT · 0 ANSWERS ARE WRONG · LEVEL 1 COMPLETED`,
  buttons `LEVEL 2 »»` and `BACK TO HOME`.

### 2.3 Level 2 complete (7 words / 120 s / 9 correct) with a deliberate wrong tap
- **7 tiles**, timer **02:00**.
- Deliberately tapped a wrong word → red tile + `WRONG — NOT THAT ONE`,
  tile class `word-tile is-wrong`, wrong counter became 1. The timer kept
  running during the feedback, and the next round appeared automatically.
- Continued to 9 correct → **Level 2 Completed** (`GOT 9 ANSWERS CORRECT`,
  `1 ANSWER IS WRONG` — singular/plural handled).

### 2.4 Level 3 complete (9 words / 60 s / 5 correct) → All Complete
- **9 tiles** (2-column grid), timer **01:00**.
- 5 correct → `LEVEL 3 COMPLETED · FINISH »»`.
- **FINISH** → **All Levels Completed** screen:
  `ALL LEVELS ARE COMPLETED · DO YOU WANT TO CONTINUE? · YES / NO`.
- Storage after the run: `completedLevels = [1,2,3]`, **3 attempts** (one per
  level, each recorded exactly once).

### 2.5 YES → Choose Level
- Shows all three level cards, each marked **COMPLETED**, plus **HOME**.
- Locking verified separately with a player that had only Level 1 finished:
  Level 1 `COMPLETED`, Level 2 `READY`, Level 3 `LOCKED` and unclickable.

### 2.6 NO → Home 2
- Home 2 shows the summary (`SCORE · LEVELS COMPLETED` with ✓ chips for
  Levels 1–3) and both required buttons: **PLAY AGAIN** and **BACK TO HOME**
  (the design only shows PLAY/STATISTICS, so an explicit way back was added).

### 2.7 Three-wrong loss
- Replayed Level 1 from Choose Level and tapped a wrong word 3 times.
- After the 3rd wrong → **Three Wrong Answers** screen:
  `IN 00:02 · 3 WRONG ANSWERS · 0 ANSWERS WERE CORRECT · RETRY`, with the red
  **LOST** stamp.
- Storage: the loss was appended **once** as
  `{ level: 1, outcome: "loss", reason: "wrong3" }` and
  `completedLevels` stayed `[1,2,3]` — **replaying and losing never erases
  progress**, and the loss never unlocks the next level.
- **RETRY** restarted Level 1 with a fresh state (`wrong = 0`).

### 2.8 Time-over loss
- Started Level 1, answered 2 correctly, then the clock was fast-forwarded past
  180 s (the suite's `OWG.game.setNow` + `checkTimer` injection point).
- → **Time Over** screen, using the design's exact wording:
  `IN 03:00 · ONLY 2 IS CORRECT · MINIMUM 13 ANSWERS NEED TO BE CORRECT ·
  TO PROCEED TO LEVEL 2 · RETRY`.
- Storage: recorded once as `{ level: 1, outcome: "loss", reason: "time",
  correct: 2, wrong: 0, timeTaken: 180 }`.

### 2.9 Statistics
- Shows `Username`, `Levels Completed 3 / 3`, lifetime `Correct Answers` /
  `Wrong Answers`, then the per-level record with `»` arrows.
- Arrows browse Level 1 → 2 → 3 records (wrapping at the end) and the
  previous-level direction works.
- **Change username** form saves the new name and keeps everything else:
  after renaming, `completedLevels` and the attempt list were unchanged.
- **GO HOME** returns to Home.

### 2.10 Refresh / data-integrity rules
- Started Level 2, answered one word correctly, then **reloaded the page**
  mid-attempt → landed on **Home**, attempt count unchanged, completed levels
  unchanged. **An interrupted attempt is never recorded.**

### 2.11 Console
- Read the browser console after the whole walkthrough: **0 errors, 0 warnings**
  of level `error`.

## 3. Responsive check

There is no device-emulation control in this browser, so the app was loaded in
a **360 × 640 iframe** (a typical phone viewport) and driven the same way:

- Home, Statistics, Choose Level, result screens and Gameplay all lay out
  correctly with no horizontal overflow
  (`documentElement.scrollWidth === clientWidth`).
- Level 3's 9-word grid switches to **2 columns** at that width; font sizes
  come from `clamp()`, so everything shrinks proportionally.
- Found and fixed during this check: very long single words
  (`POLYMERIZATION`) used to break mid-word on narrow screens. The tiles now
  use `hyphens: auto` + `overflow-wrap: anywhere`, so
  `CROSS-VALIDATION` hyphenates cleanly and nothing overflows. Verified again
  in the 360 px iframe after the fix.
- The countdown chip also turns **red** in the last seconds, as designed.

## 4. Not covered / known limitations

- Touch-only gestures and real screen-reader output were not tested (no
  assistive-tech tooling available here); the markup uses real `<button>`
  elements, labels and `aria-*` attributes, but this has not been verified with
  an actual screen reader.
- Only Chromium was available. The code uses no browser-specific APIs, but
  Firefox/Safari were not exercised.
- Lighthouse/accessibility audits were not run.
- The tests exercise the game logic directly for the timer (fake clock); the
  full 180-second real-time countdown was not waited out end-to-end in the
  browser (the 60-second Level 3 countdown was observed live).
