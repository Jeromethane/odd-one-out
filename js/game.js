/* ==========================================================================
   ODD WORD GAME — game.js
   The heart of the game:
     • one central configuration object for all three levels
     • round generation (4+1 / 6+1 / 8+1 words) with ambiguity protection
     • unbiased Fisher–Yates shuffling
     • a timestamp-based countdown timer that keeps running during feedback
     • the answer state machine (answering -> feedback -> next round / end)

   This module never touches the DOM. It reports what happened through
   callbacks and lets the app (app.js) draw the screens.
   ========================================================================== */
(function () {
  "use strict";

  window.OWG = window.OWG || {};

  /* ----------------------------------------------------------------------
     1. LEVEL CONFIGURATION — the single source of truth for level rules.
     ---------------------------------------------------------------------- */
  var LEVELS = {
    1: { level: 1, group: "easy",         wordsPerRound: 5, mainCount: 4, seconds: 180, required: 13, maxWrong: 2 },
    2: { level: 2, group: "intermediate", wordsPerRound: 7, mainCount: 6, seconds: 120, required: 9,  maxWrong: 2 },
    3: { level: 3, group: "advanced",     wordsPerRound: 9, mainCount: 8, seconds: 60,  required: 5,  maxWrong: 2 }
  };

  /* Timing values (milliseconds). Exposed so the test suite can shorten them. */
  var TIMING = {
    FEEDBACK_MS: 700,   // green/red flash before the next round starts
    END_FLASH_MS: 550,  // flash shown right before a win/loss result screen
    TICK_MS: 200        // how often the countdown display refreshes
  };

  /* ----------------------------------------------------------------------
     2. AMBIGUITY PROTECTION
        Some supplied categories overlap heavily (for example "Grammar
        Categories" and "Parts of Speech"). Two automatic rules reject
        unsafe pairs, plus a short hand-checked list for pairs that only a
        human would spot (for example "Colours" and "Flowers", because of
        Violet/Lavender).

        Rule A: category names that share a meaningful word are rejected
                ("computer" in Computer Hardware / Computer Software).
        Rule B: categories that share ANY word are rejected.
        Rule C: the hand-checked pairs in EXCLUDED_PAIRS below.
     ---------------------------------------------------------------------- */

  // Pairs of category ids that must never be used together.
  // Written as "smallerId-largerId".
  var EXCLUDED_PAIRS = {
    // --- Easy group (1-40) ---
    "5-21": "Colours vs Flowers (Violet, Lavender are ambiguous)",
    "7-39": "Vehicles vs Modes of Transport (Train / Rail Transport)",
    "9-35": "Clothing vs Types of Shoes (both wearable)",
    "9-36": "Clothing vs Types of Bags (both worn/carried accessories)",
    "9-37": "Clothing vs Types of Hats (a hat can be seen as clothing)",
    "33-34": "Fast Food vs Desserts (doughnuts/pies are sold as fast food)",
    "38-39": "Types of Buildings vs Modes of Transport (Airport Terminal / Air Transport)",

    // --- Intermediate group (41-90) ---
    "43-47": "Continents vs Landforms (Australia is both)",
    "44-48": "Oceans vs Water Bodies (an ocean IS a water body)",
    "45-48": "Rivers vs Water Bodies (a river IS a water body)",
    "46-47": "Mountains vs Landforms (a mountain IS a landform)",
    "51-52": "Constellations vs Stars (players cannot tell star names from constellations)",
    "57-60": "Computer Hardware vs Internet and Networking (Router/Modem are hardware)",
    "57-61": "Computer Hardware vs Networking Devices (both are hardware)",
    "57-63": "Computer Hardware vs Cybersecurity Terms (a firewall can be hardware)",
    "57-65": "Computer Hardware vs Data Storage Devices (SSD/Hard Drive are storage)",
    "58-59": "Computer Software vs Programming Languages (a language produces software)",
    "58-61": "Computer Software vs Networking Devices (a firewall can be software)",
    "58-63": "Computer Software vs Cybersecurity Terms (malware is software)",
    "58-66": "Computer Software vs Operating Systems ('Operating System' is in the software list)",
    "58-67": "Computer Software vs Web Browsers ('Web Browser' is in the software list)",
    "66-67": "Operating Systems vs Web Browsers (ChromeOS vs Google Chrome)",
    "67-68": "Web Browsers vs Search Engines (Brave / DuckDuckGo appear in both)",
    "59-69": "Programming Languages vs File Extensions (.py vs Python)",
    "85-86": "Vitamins vs Nutrients (vitamins ARE nutrients)",

    // --- Advanced group (91-180) ---
    "94-95": "Electromagnetic Phenomena vs Types of Waves (diffraction/interference are waves)",
    "96-100": "Electrical Components vs Digital Circuits (a multiplexer is a component)",
    "97-100": "Electronic Components vs Digital Circuits (a decoder is a component)",
    "107-108": "Organic Functional Groups vs Hydrocarbons (alkenes ARE hydrocarbons)",
    "114-115": "Taxonomic Ranks vs Biological Classification (a class is both)",
    "121-122": "Astronomy Concepts vs Types of Galaxies ('Galaxy' is in the concepts list)",
    "121-125": "Astronomy Concepts vs Black Hole Concepts ('Black Hole' is in the concepts list)",
    "122-123": "Types of Galaxies vs Stellar Evolution Stages (Dwarf Galaxy vs Brown Dwarf)",
    "122-124": "Types of Galaxies vs Types of Stars (Dwarf Galaxy vs Red/White/Brown Dwarf)",
    "129-130": "CS Concepts vs Algorithms ('Algorithm' is in the concepts list)",
    "129-132": "CS Concepts vs Sorting Algorithms (Bubble Sort is an algorithm)",
    "129-133": "CS Concepts vs Searching Algorithms (Binary Search vs Binary Tree)",
    "129-134": "CS Concepts vs Programming Paradigms ('Function' vs 'Functional Programming')",
    "130-138": "Algorithms vs AI Techniques (Genetic Algorithms ARE algorithms)",
    "131-132": "Data Structures vs Sorting Algorithms ('Heap' vs 'Heap Sort')",
    "131-133": "Data Structures vs Searching Algorithms ('Binary Tree' vs 'Binary Search')",
    "133-138": "Searching Algorithms vs AI Techniques ('Search' is in the AI list)",
    "137-139": "ML Concepts vs Neural Network Concepts (Gradient Descent is machine learning)",
    "138-139": "AI Techniques vs Neural Network Concepts (Neural Networks / Backpropagation)",
    "141-142": "Cryptographic Algorithms vs Encryption Methods (AES IS an encryption method)",
    "142-144": "Encryption Methods vs Network Security Protocols (TLS provides transport encryption)",
    "151-153": "Logic and Reasoning vs Types of Arguments (Syllogism appears in both themes)",
    "151-154": "Logic and Reasoning vs Philosophical Concepts ('Logic' is a philosophy branch)",
    "151-155": "Logic and Reasoning vs Branches of Philosophy ('Logic' is a branch)",
    "153-154": "Types of Arguments vs Philosophical Concepts (Modus Ponens is logic)",
    "153-155": "Types of Arguments vs Branches of Philosophy (Logic branch overlap)",
    "154-156": "Philosophical Concepts vs Ethical Theories (Ethics is a concept AND a theory area)",
    "164-170": "Types of Government vs Branches of Law ('Constitutional Monarchy' / 'Constitutional Law')",
    "174-177": "Mathematical Functions vs Calculus Concepts (derivatives of functions)",
    "174-179": "Mathematical Functions vs Types of Equations (Linear Function / Linear Equation)"
  };

  // Generic words that carry no meaning when comparing category names.
  var NAME_STOPWORDS = {
    "of": true, "and": true, "the": true, "in": true,
    "type": true, "types": true, "concept": true, "concepts": true,
    "term": true, "terms": true, "category": true, "categories": true
  };

  function normaliseText(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function nameTokens(name) {
    return normaliseText(name).split(" ").filter(function (token) {
      return token.length > 0 && !NAME_STOPWORDS[token];
    });
  }

  function commonPrefixLength(a, b) {
    var length = Math.min(a.length, b.length);
    var count = 0;
    while (count < length && a.charAt(count) === b.charAt(count)) count++;
    return count;
  }

  /** Rule A: do the two category names share a meaningful word? */
  function namesTooSimilar(nameA, nameB) {
    var tokensA = nameTokens(nameA);
    var tokensB = nameTokens(nameB);
    for (var i = 0; i < tokensA.length; i++) {
      for (var j = 0; j < tokensB.length; j++) {
        if (tokensA[i] === tokensB[j]) return true;
        // Also catch near-identical words such as "logic" / "logical".
        if (commonPrefixLength(tokensA[i], tokensB[j]) >= 5) return true;
      }
    }
    return false;
  }

  /** Rule B: do the two categories share any word? */
  function hasWordOverlap(categoryA, categoryB) {
    var seen = {};
    uniqueWordTexts(categoryA).forEach(function (word) { seen[word] = true; });
    return uniqueWordTexts(categoryB).some(function (word) { return seen[word] === true; });
  }

  /** Rule C: hand-checked pair list. */
  function isExcludedPair(idA, idB) {
    var key = Math.min(idA, idB) + "-" + Math.max(idA, idB);
    return Object.prototype.hasOwnProperty.call(EXCLUDED_PAIRS, key);
  }

  /* ----------------------------------------------------------------------
     3. ROUND GENERATION
     ---------------------------------------------------------------------- */

  /** Category word list with duplicates removed (case-insensitive), order kept. */
  function uniqueWords(category) {
    // Object.create(null) is important: a normal {} inherits "constructor",
    // "toString" etc. from Object.prototype, which would wrongly make a word
    // like "Constructor" look like a duplicate of itself.
    var seen = Object.create(null);
    var result = [];
    category.words.forEach(function (word) {
      var key = normaliseText(word);
      if (!seen[key]) {
        seen[key] = true;
        result.push(word);
      }
    });
    return result;
  }

  function uniqueWordTexts(category) {
    return uniqueWords(category).map(normaliseText);
  }

  /** Unbiased Fisher–Yates shuffle. Returns a NEW array. */
  function shuffle(list) {
    var result = list.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /** Cache of valid (main, odd) category pairs for each level. */
  var pairCache = {};

  /**
   * Build every safe (main, odd) category pair for one level.
   *
   * Main category: must live in this level's difficulty group AND contain at
   *   least mainCount distinct words (Level 3 needs eight words, so a category
   *   with only five can never be the MAIN category).
   * Odd category: any category of the same difficulty group with at least one
   *   word. Small categories are still allowed here — they only have to supply
   *   the single odd word.
   *
   * If the difficulty group somehow produces no safe pair at all, we widen the
   * search to the complete 180-category bank instead of crashing.
   */
  function buildValidPairs(level, useWholeBank) {
    var config = LEVELS[level];
    var bank = OWG.WORD_BANK || [];

    function inScope(category) {
      return useWholeBank ? true : category.group === config.group;
    }

    var mainPool = bank.filter(function (category) {
      return inScope(category) && uniqueWords(category).length >= config.mainCount;
    });
    var oddPool = bank.filter(function (category) {
      return inScope(category) && uniqueWords(category).length >= 1;
    });

    var pairs = [];
    mainPool.forEach(function (mainCategory) {
      oddPool.forEach(function (oddCategory) {
        if (mainCategory.id === oddCategory.id) return;
        if (isExcludedPair(mainCategory.id, oddCategory.id)) return;      // Rule C
        if (namesTooSimilar(mainCategory.name, oddCategory.name)) return; // Rule A
        if (hasWordOverlap(mainCategory, oddCategory)) return;            // Rule B
        pairs.push({ main: mainCategory, odd: oddCategory });
      });
    });

    // Safety net: never return an empty list while the bank still has data.
    if (pairs.length === 0 && !useWholeBank && bank.length > 0) {
      return buildValidPairs(level, true);
    }
    return pairs;
  }

  function validPairsFor(level) {
    if (!pairCache[level]) pairCache[level] = buildValidPairs(level);
    return pairCache[level];
  }

  /** Rebuild the pair caches (used by the test suite). */
  function clearPairCache() {
    pairCache = {};
  }

  /**
   * Create one round for a level.
   * Level 1: 4 words from one category + 1 word from another = 5 words.
   * Level 2: 6 + 1 = 7.  Level 3: 8 + 1 = 9.
   * Returns { words, oddIndex, mainCategory, oddCategory }.
   * oddIndex is only used internally to validate the player's tap — it is
   * never shown in the interface.
   */
  function generateRound(level, lastMainId) {
    var config = LEVELS[level];
    if (!config) throw new Error("Unknown level: " + level);

    var pairs = validPairsFor(level);
    if (pairs.length === 0) throw new Error("No valid category pairs available for level " + level);

    // Random order, but pairs using the previous round's main category are
    // pushed to the back so consecutive rounds usually look different.
    var order = shuffle(pairs.map(function (_, index) { return index; }));
    var notRecent = [];
    var recent = [];
    order.forEach(function (index) {
      if (pairs[index].main.id === lastMainId) recent.push(index);
      else notRecent.push(index);
    });
    order = notRecent.concat(recent);

    // Try candidate pairs at most this many times, then fall back to walking
    // the full (already randomised) list. This guarantees we never loop forever.
    var maxTrials = Math.min(order.length, 25);

    for (var i = 0; i < order.length; i++) {
      var pair = pairs[order[i]];
      var attemptsLeft = i < maxTrials ? 3 : 1;

      for (var attempt = 0; attempt < attemptsLeft; attempt++) {
        var mainWords = shuffle(uniqueWords(pair.main)).slice(0, config.mainCount);
        var mainTexts = mainWords.map(normaliseText);

        // The odd word must not appear among the main words.
        var oddPool = uniqueWords(pair.odd).filter(function (word) {
          return mainTexts.indexOf(normaliseText(word)) === -1;
        });
        if (oddPool.length === 0) continue; // unsuitable pair, try another

        var oddWord = pickRandom(oddPool);
        var words = shuffle(mainWords.concat([oddWord]));

        return {
          words: words,
          oddIndex: words.indexOf(oddWord),
          mainCategory: { id: pair.main.id, name: pair.main.name, group: pair.main.group },
          oddCategory: { id: pair.odd.id, name: pair.odd.name, group: pair.odd.group }
        };
      }
    }

    throw new Error("Could not generate a valid round for level " + level);
  }

  /* ----------------------------------------------------------------------
     4. GAME STATE MACHINE
     ---------------------------------------------------------------------- */

  // Overridable clock. The test suite replaces this with a fake clock so it
  // can simulate 180 seconds passing instantly.
  var now = function () { return Date.now(); };

  var state = null;
  var callbacks = null;

  function clearTimers() {
    if (state && state.timerId !== null) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
    if (state && state.pendingId !== null) {
      window.clearTimeout(state.pendingId);
      state.pendingId = null;
    }
  }

  function remainingSeconds() {
    if (!state) return 0;
    return Math.max(0, Math.ceil((state.endAt - now()) / 1000));
  }

  function elapsedSeconds() {
    if (!state) return 0;
    var end = Math.min(now(), state.endAt);
    return Math.max(0, Math.round((end - state.startedAt) / 1000));
  }

  /** Called on every timer tick. Ends the level when time is up. */
  function checkTimer() {
    if (!state || state.phase === "ended" || state.phase === "ending") return;
    var left = remainingSeconds();
    if (callbacks && callbacks.onTick) callbacks.onTick(left);
    if (left <= 0) finishLevel("time");
  }

  /**
   * Terminate the level. Guarded so a level can only ever end (and therefore
   * be recorded) exactly once. The phase "ending" is still allowed through
   * here — that is the short feedback flash right before a terminal answer.
   */
  function finishLevel(reason) {
    if (!state || state.phase === "ended") return;
    state.phase = "ended";
    state.ended = true;
    clearTimers();

    var result = {
      level: state.level,
      outcome: reason === "target" ? "win" : "loss",
      reason: reason,
      correct: state.correct,
      wrong: state.wrong,
      rounds: state.rounds,
      timeTaken: reason === "time" ? LEVELS[state.level].seconds : elapsedSeconds()
    };

    if (callbacks && callbacks.onEnd) callbacks.onEnd(result);
  }

  /** Start the next round. Guarded against running after the level ended. */
  function startNextRound() {
    if (!state || state.ended) return;
    state.round = generateRound(state.level, state.lastMainId);
    state.lastMainId = state.round.mainCategory.id;
    state.phase = "answering";
    if (callbacks && callbacks.onRound) callbacks.onRound(state.round);
  }

  var game = {
    LEVELS: LEVELS,
    TIMING: TIMING,
    EXCLUDED_PAIRS: EXCLUDED_PAIRS,
    generateRound: generateRound,
    clearPairCache: clearPairCache,
    checkTimer: checkTimer,

    /** Clock injection point (tests replace this with a fake clock). */
    now: function () { return now(); },
    setNow: function (fn) { now = fn; },

    /**
     * Begin a level.
     * callbacks: { onStart(round), onTick(seconds), onRound(round),
     *              onAnswer(result), onEnd(result) }
     */
    start: function (level, cbs) {
      this.stop(); // never allow two levels at once
      if (!LEVELS[level]) throw new Error("Unknown level: " + level);

      var config = LEVELS[level];
      callbacks = cbs || {};
      state = {
        level: level,
        correct: 0,
        wrong: 0,
        rounds: 0,
        startedAt: now(),
        endAt: now() + config.seconds * 1000,
        timerId: null,
        pendingId: null,
        phase: "answering",
        ended: false,
        lastMainId: null,
        round: null
      };

      state.round = generateRound(level, null);
      state.lastMainId = state.round.mainCategory.id;

      if (callbacks.onStart) callbacks.onStart(state.round);
      if (callbacks.onTick) callbacks.onTick(config.seconds);

      state.timerId = window.setInterval(checkTimer, TIMING.TICK_MS);
      return state.round;
    },

    /**
     * The player taps a word.
     * Returns null if no answer is accepted (wrong phase, unknown index,
     * level already over). Otherwise returns a result object.
     */
    submitAnswer: function (index) {
      if (!state || state.ended) return null;
      if (state.phase !== "answering") return null;
      if (index !== Math.round(index) || index < 0 || index >= state.round.words.length) return null;

      var config = LEVELS[state.level];
      state.phase = "feedback";
      state.rounds++;

      var isCorrect = index === state.round.oddIndex;
      if (isCorrect) state.correct++;
      else state.wrong++;

      var reachedTarget = state.correct >= config.required;
      var tooManyWrong = state.wrong > config.maxWrong; // the 3rd wrong answer
      var terminal = reachedTarget || tooManyWrong;

      var result = {
        index: index,
        isCorrect: isCorrect,
        correct: state.correct,
        wrong: state.wrong,
        rounds: state.rounds,
        terminal: terminal,
        outcome: reachedTarget ? "win" : (tooManyWrong ? "loss" : null),
        reason: reachedTarget ? "target" : (tooManyWrong ? "wrong3" : null)
      };

      if (callbacks && callbacks.onAnswer) callbacks.onAnswer(result);

      if (terminal) {
        // The level is over at this exact moment. We freeze the clock now and
        // show the result screen after a very short feedback flash.
        var reason = result.reason;
        state.phase = "ending";
        state.endAt = now(); // freeze elapsed time at the winning/losing answer
        clearTimers();
        state.pendingId = window.setTimeout(function () {
          finishLevel(reason);
        }, TIMING.END_FLASH_MS);
      } else {
        // Keep the timer running during feedback, then show the next round.
        state.pendingId = window.setTimeout(function () {
          if (!state || state.ended) return;
          startNextRound();
        }, TIMING.FEEDBACK_MS);
      }

      return result;
    },

    /** Stop everything. Used when leaving gameplay or starting a new level. */
    stop: function () {
      if (state) {
        clearTimers();
      }
      state = null;
      callbacks = null;
    },

    /** Snapshot of the running game (read-only, for the HUD/tests).
     *  oddIndex is internal bookkeeping used to validate taps — it is never
     *  rendered into the page or any accessibility text. */
    snapshot: function () {
      if (!state) return null;
      return {
        level: state.level,
        correct: state.correct,
        wrong: state.wrong,
        rounds: state.rounds,
        phase: state.phase,
        remaining: remainingSeconds(),
        oddIndex: state.round ? state.round.oddIndex : -1,
        words: state.round ? state.round.words.slice() : []
      };
    }
  };

  OWG.game = game;
})();
