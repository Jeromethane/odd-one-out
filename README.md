# Odd Word Game 🎯

A polished, fully playable browser game: every round shows a group of words that
all belong to one category — and exactly **one word that does not belong**.
Find the odd word, beat the clock, and complete all three levels.

Built as a plain static website (HTML + CSS + vanilla JavaScript). No build
step, no server, no frameworks — it runs by double-clicking `index.html` and
publishes perfectly on GitHub Pages.

The look and feel are rebuilt from the supplied **Canva design**: dark navy
background, blue gradient corner chevrons, the circuit-brain logo,
"BRAIN | SPEED | LOGIC" branding, "Baloo 2" display type + "Poppins" body
text, the gold trophy on the win screens and the red **LOST** stamp on the
loss screens.

---

## 🎮 Features

- **Three levels** with exact rules:
  | Level | Words per round | Time | Correct answers needed | Wrong answers allowed |
  |-------|-----------------|------|------------------------|-----------------------|
  | 1     | 5               | 3 min (180 s) | 13 | 2 (a 3rd wrong answer loses) |
  | 2     | 7               | 2 min (120 s) | 9  | 2 |
  | 3     | 9               | 1 min (60 s)  | 5  | 2 |
- **Complete word bank**: all **180 supplied categories** (Easy 1–40,
  Intermediate 41–90, Advanced 91–180), preserved exactly as supplied.
- **Fair round generation**: each round = 4/6/8 words from one category + 1
  word from a different category, shuffled with an unbiased Fisher–Yates
  shuffle so the odd word can appear in any position.
- **Ambiguity protection**: overlapping category pairs (for example
  "Grammar Categories" vs "Parts of Speech", or "Oceans" vs "Water Bodies")
  are automatically and manually excluded so there is always one clearly
  correct answer.
- **All 15 screens** from the specification: Start, Home, Statistics,
  Gameplay, Correct feedback, Wrong feedback, Level Completed, Time Over,
  Three Wrong Answers, Level 2, Level 3, All Levels Completed, Choose Level
  and Home 2.
- **Persistent progress** via `localStorage`: username, completed levels,
  every finished attempt, lifetime totals — all survive refreshes, browser
  restarts and username changes.
- **Statistics page** with per-level latest attempt, left/right arrows and
  lifetime totals.
- **Responsive design** — works on phones, tablets, laptops and desktops, and
  is keyboard- and screen-reader-friendly.
- **No Home button during gameplay** (as specified). A refresh during a level
  returns to Home and never records the interrupted attempt.

## 🛠 Technology used

- **HTML5** — page structure (`index.html`)
- **CSS3** — design system, animations, responsive layout (`css/style.css`)
- **Vanilla JavaScript** — all game logic, no libraries
  (`js/wordbank.js`, `js/storage.js`, `js/statistics.js`, `js/game.js`,
  `js/navigation.js`, `js/app.js`)
- **Browser localStorage** — saved player data

## 📁 Project folder structure

```
odd-word-game/
├── index.html                 # the only page; all screens render here
├── README.md                  # this file
├── .gitignore
├── assets/
│   ├── images/                # optional artwork
│   ├── icons/
│   │   └── favicon.svg        # browser tab icon
│   └── design-reference/      # put your Canva exports here (reference only)
├── css/
│   └── style.css              # all styles, responsive rules, design tokens
├── js/
│   ├── app.js                 # renders every screen, wires up the buttons
│   ├── game.js                # level rules, round generation, timer, answers
│   ├── wordbank.js            # the complete 180-category word bank
│   ├── storage.js             # all localStorage reading/writing
│   ├── statistics.js          # progress & statistics calculations
│   └── navigation.js          # which screen comes next
└── tests/
    ├── test-runner.html       # automated test suite (open it in a browser)
    └── game-tests.md          # the full test report
```

## ▶ How to run the project locally

**Easiest way (no tools needed):**

1. Open the `odd-word-game` folder.
2. Double-click `index.html`.
3. The game opens in your browser. Done!

**Nicer way (a tiny local web server, optional):**

If you have Python installed:

```bash
cd odd-word-game
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

**How to run the tests:** open `tests/test-runner.html` in your browser
(double-click it). It runs 47 automated checks and shows PASS/FAIL for each.

## 🚀 How to publish on GitHub Pages (step by step)

You need: a GitHub account and Git installed
(<https://git-scm.com/downloads> — during setup, accept all defaults).

1. **Open the project folder** in File Explorer and check every file listed in
   the structure above exists.
2. **Open a terminal** (on Windows: press `Win`, type `powershell`, press
   Enter) and go to the project's *parent* folder:

   ```powershell
   cd "$env:USERPROFILE\OneDrive\Documents\Default Project"
   ```
3. **Create a local Git repository** and add everything:

   ```powershell
   cd odd-word-game
   git init
   git add .
   git commit -m "Odd Word Game first version"
   ```
4. **Create an empty repository on GitHub**: open <https://github.com/new>,
   give it a name such as `odd-word-game`, keep it **Public**, and press
   *Create repository*. GitHub now shows a page with commands — copy the
   repository URL it displays (looks like `https://github.com/YOUR-NAME/odd-word-game.git`).
5. **Connect your local project to GitHub** (replace the URL with yours):

   ```powershell
   git remote add origin https://github.com/YOUR-NAME/odd-word-game.git
   git branch -M main
   git push -u origin main
   ```
   When asked for credentials, GitHub prompts for a username and a **personal
   access token** (or opens your browser for sign-in).
6. **Enable GitHub Pages**: on your repository page click **Settings → Pages**
   (left sidebar). Under *Build and deployment* choose:
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
   - Press **Save**.
7. **Wait ~1 minute**, then refresh the Settings → Pages page. It will show:
   *"Your site is live at https://YOUR-NAME.github.io/odd-word-game/"*
8. **Open that URL and test the game.**
9. **To update later**: change files, then run:

   ```powershell
   git add .
   git commit -m "Describe your change"
   git push
   ```
   GitHub Pages rebuilds automatically in about a minute.

> All asset paths in this project are **relative** (`css/style.css`,
> `js/app.js`), so the game works correctly at a repository URL such as
> `https://user.github.io/odd-word-game/`, not just at a domain root.

## 💾 How localStorage is used

Everything is saved under the single key **`oddwordgame.data.v1`** as JSON:

```json
{
  "username": "WordWizard",
  "completedLevels": [1, 2],
  "seq": 5,
  "attempts": [
    { "id": 1, "level": 1, "outcome": "win", "reason": "target",
      "correct": 13, "wrong": 1, "rounds": 14, "timeTaken": 96,
      "endedAt": 1712345678900 }
  ]
}
```

- The **attempt list is the source of truth**: lifetime totals and "latest
  attempt per level" are always calculated from it, so numbers can never drift.
- A level is *completed* only when a **win** attempt exists for it. Losses are
  recorded but never unlock anything, and replaying a completed level and
  losing never erases the unlock.
- Changing the username changes **only** the username field.
- An attempt is recorded **only** when a level actually ends (win, three
  wrong answers, or time over). Refreshing mid-level records nothing.
- Corrupted or old saved data is detected, cleaned and replaced with safe
  defaults instead of crashing the game.

## ⚠️ Important limitations

- Progress is stored **per browser, per device** — it is not synced to an
  account and is lost if browser data is cleared.
- The automated tests run in the browser (`tests/test-runner.html`); there is
  no Node.js test setup because the project deliberately uses no build tools.
- The interface was rebuilt directly from the supplied **Canva design PDF**
  (dark navy background, blue gradient chevrons, circuit-brain logo,
  "Baloo 2" + "Poppins" fonts, trophy and LOST-stamp artwork). Your own Canva
  image exports can be dropped into `assets/design-reference/` — that folder is
  reference-only and is not loaded by the game. A few functional elements the
  design does not show were added because the specification requires them:
  the score counters (`✓ 0 ✗ 0`) in the gameplay header, the username chip on
  Home, and a **BACK TO HOME** button on Home 2 (the design shows only
  PLAY/STATISTICS there).
- Test results from the last run (47/47 automated + full manual walkthrough,
  18 October 2026) are documented in `tests/game-tests.md`.
- This machine has no Git installed, so the repository was **not** created or
  pushed — follow steps 3–5 above after installing Git.

## 📄 License / data

The 180 categories and their word lists were supplied by the project owner and
are included complete and unmodified in `js/wordbank.js`.
