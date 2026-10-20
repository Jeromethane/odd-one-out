/* ==========================================================================
   ODD WORD GAME — storage.js
   Everything that reads or writes the browser's localStorage lives here.

   Saved data shape (version 1):
   {
     username:        "WordWizard",
     completedLevels: [1],                  // levels the player has WON at least once
     seq:             4,                    // running counter used to order attempts
     attempts: [
       {
         id:         4,                     // same value as seq when it was recorded
         level:      1,                     // 1, 2 or 3
         outcome:    "win" | "loss",
         reason:     "target" | "time" | "wrong3",
         correct:    13,
         wrong:      1,
         rounds:     14,
         timeTaken:  96,                    // seconds of real gameplay
         endedAt:    1712345678900          // Date.now() when the attempt finished
       }
     ]
   }
   ========================================================================== */
(function () {
  "use strict";

  // Expose one single global namespace so we do not pollute window with many names.
  window.OWG = window.OWG || {};

  var STORAGE_KEY = "oddwordgame.data.v1";

  var DEFAULT_DATA = {
    username: "",
    completedLevels: [],
    seq: 0,
    attempts: []
  };

  /* --- small helpers ---------------------------------------------------- */

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function isValidLevel(value) {
    return value === 1 || value === 2 || value === 3;
  }

  function isValidAttempt(raw) {
    if (!raw || typeof raw !== "object") return false;
    if (!isValidLevel(raw.level)) return false;
    if (raw.outcome !== "win" && raw.outcome !== "loss") return false;
    return (
      isFiniteNumber(raw.correct) && raw.correct >= 0 &&
      isFiniteNumber(raw.wrong) && raw.wrong >= 0 &&
      isFiniteNumber(raw.rounds) && raw.rounds >= 0 &&
      isFiniteNumber(raw.timeTaken) && raw.timeTaken >= 0
    );
  }

  function normaliseAttempt(raw) {
    // Keep only the fields we trust, filling in safe defaults for the rest.
    return {
      id: isFiniteNumber(raw.id) ? raw.id : 0,
      level: raw.level,
      outcome: raw.outcome,
      reason: typeof raw.reason === "string" ? raw.reason : "",
      correct: Math.round(raw.correct),
      wrong: Math.round(raw.wrong),
      rounds: Math.round(raw.rounds),
      timeTaken: Math.round(raw.timeTaken),
      endedAt: isFiniteNumber(raw.endedAt) ? raw.endedAt : Date.now()
    };
  }

  /* --- load / save ------------------------------------------------------ */

  function load() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      // localStorage can be blocked (private browsing, disabled cookies).
      return freshCopy();
    }
    if (!raw) return freshCopy();

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // Malformed JSON: fall back to defaults instead of crashing.
      return freshCopy();
    }
    if (!parsed || typeof parsed !== "object") return freshCopy();
    return sanitise(parsed);
  }

  function sanitise(parsed) {
    var data = freshCopy();

    if (typeof parsed.username === "string") {
      data.username = parsed.username.trim();
    }

    if (Array.isArray(parsed.completedLevels)) {
      data.completedLevels = parsed.completedLevels
        .filter(isValidLevel)
        .filter(function (value, index, list) { return list.indexOf(value) === index; })
        .sort();
    }

    if (Array.isArray(parsed.attempts)) {
      data.attempts = parsed.attempts.filter(isValidAttempt).map(normaliseAttempt);
    }

    if (isFiniteNumber(parsed.seq) && parsed.seq >= 0) {
      data.seq = Math.round(parsed.seq);
    }

    // Keep the sequence counter consistent with the stored attempts.
    var highestId = data.attempts.reduce(function (max, attempt) {
      return Math.max(max, attempt.id);
    }, 0);
    if (highestId > data.seq) data.seq = highestId;

    reconcileCompletedLevels(data);
    return data;
  }

  function reconcileCompletedLevels(data) {
    // A level counts as completed if it is stored as completed OR if any
    // recorded attempt for it is a win. This heals older/partial data and
    // guarantees a win is never "lost".
    data.attempts.forEach(function (attempt) {
      if (attempt.outcome === "win" && data.completedLevels.indexOf(attempt.level) === -1) {
        data.completedLevels.push(attempt.level);
      }
    });
    data.completedLevels.sort();
  }

  function freshCopy() {
    return {
      username: DEFAULT_DATA.username,
      completedLevels: DEFAULT_DATA.completedLevels.slice(),
      seq: 0,
      attempts: []
    };
  }

  function save(data) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      // Storage full or blocked. The game keeps working in memory for this
      // session; nothing we can do about the write itself.
      return false;
    }
  }

  /* --- public API ------------------------------------------------------- */

  var storage = {
    STORAGE_KEY: STORAGE_KEY,

    /** Full copy of the saved data (never a live reference). */
    getAll: function () {
      var data = load();
      return {
        username: data.username,
        completedLevels: data.completedLevels.slice(),
        seq: data.seq,
        attempts: data.attempts.slice()
      };
    },

    hasUsername: function () {
      return load().username.length > 0;
    },

    getUsername: function () {
      return load().username;
    },

    /**
     * Save the username. Only the username changes — attempts, totals and
     * progression are never touched here.
     * Returns { ok, username, error }.
     */
    setUsername: function (name) {
      var clean = typeof name === "string" ? name.trim() : "";
      if (clean.length === 0) {
        return { ok: false, username: "", error: "Username cannot be empty." };
      }
      if (clean.length > 24) {
        return { ok: false, username: "", error: "Username must be 24 characters or fewer." };
      }
      var data = load();
      data.username = clean;
      save(data);
      return { ok: true, username: clean, error: "" };
    },

    /**
     * Record one FINISHED attempt (win or loss). Called exactly once by the
     * game when a level ends. Returns the stored attempt.
     */
    recordAttempt: function (attempt) {
      var data = load();
      data.seq += 1;
      var stored = normaliseAttempt(attempt);
      stored.id = data.seq;
      data.attempts.push(stored);

      if (stored.outcome === "win" && data.completedLevels.indexOf(stored.level) === -1) {
        data.completedLevels.push(stored.level);
        data.completedLevels.sort();
      }

      save(data);
      return stored;
    },

    /** Every recorded finished attempt, oldest first. */
    getAttempts: function () {
      return load().attempts;
    },

    /** The most recent finished attempt for one level, or null. */
    getLatestAttempt: function (level) {
      if (!isValidLevel(level)) return null;
      var attempts = load().attempts;
      for (var i = attempts.length - 1; i >= 0; i--) {
        if (attempts[i].level === level) return attempts[i];
      }
      return null;
    },

    /** Levels the player has won at least once (always sorted 1..3). */
    getCompletedLevels: function () {
      return load().completedLevels;
    },

    isLevelCompleted: function (level) {
      return load().completedLevels.indexOf(level) !== -1;
    },

    /** Used by the game/navigation after a win. Marks one level completed. */
    markLevelCompleted: function (level) {
      if (!isValidLevel(level)) return false;
      var data = load();
      if (data.completedLevels.indexOf(level) === -1) {
        data.completedLevels.push(level);
        data.completedLevels.sort();
        save(data);
      }
      return true;
    },

    /** Lifetime totals summed from ALL recorded finished attempts. */
    getLifetimeTotals: function () {
      var attempts = load().attempts;
      return attempts.reduce(
        function (totals, attempt) {
          totals.correct += attempt.correct;
          totals.wrong += attempt.wrong;
          return totals;
        },
        { correct: 0, wrong: 0 }
      );
    }
  };

  OWG.storage = storage;
})();
