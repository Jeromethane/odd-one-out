/* ==========================================================================
   ODD WORD GAME — statistics.js
   All calculations shown on the Home and Statistics screens.
   This module only READS saved data through OWG.storage.
   ========================================================================== */
(function () {
  "use strict";

  window.OWG = window.OWG || {};

  var ALL_LEVELS = [1, 2, 3];

  var statistics = {
    ALL_LEVELS: ALL_LEVELS,

    /** How many of the three levels the player has completed (0..3). */
    levelsCompleted: function () {
      return OWG.storage.getCompletedLevels().length;
    },

    isLevelCompleted: function (level) {
      return OWG.storage.isLevelCompleted(level);
    },

    /**
     * The lowest-numbered level that is not yet completed.
     * Returns null when all three levels are done.
     */
    nextLevel: function () {
      var completed = OWG.storage.getCompletedLevels();
      for (var i = 0; i < ALL_LEVELS.length; i++) {
        if (completed.indexOf(ALL_LEVELS[i]) === -1) return ALL_LEVELS[i];
      }
      return null;
    },

    /**
     * Which levels may be played right now.
     * Level 1 is always open; Level 2 opens after Level 1; Level 3 after Level 2.
     */
    unlockedLevels: function () {
      var completed = OWG.storage.getCompletedLevels();
      var unlocked = [1];
      if (completed.indexOf(1) !== -1) unlocked.push(2);
      if (completed.indexOf(2) !== -1) unlocked.push(3);
      return unlocked;
    },

    isUnlocked: function (level) {
      return this.unlockedLevels().indexOf(level) !== -1;
    },

    /**
     * Display status for one level:
     *   "locked"   – cannot be played yet
     *   "completed"– has been won at least once (can be replayed)
     *   "unlocked" – playable but not yet won
     */
    levelStatus: function (level) {
      var completed = OWG.storage.getCompletedLevels();
      if (completed.indexOf(level) !== -1) return "completed";
      return this.isUnlocked(level) ? "unlocked" : "locked";
    },

    /** Lifetime correct/wrong totals summed over every finished attempt. */
    lifetimeTotals: function () {
      return OWG.storage.getLifetimeTotals();
    },

    /** Most recent finished attempt for a level (win or loss), or null. */
    latestAttempt: function (level) {
      return OWG.storage.getLatestAttempt(level);
    },

    /** Data for the Home page: text + per-level chips. */
    homeProgress: function () {
      var next = this.nextLevel();
      var completed = OWG.storage.getCompletedLevels();
      var chips = ALL_LEVELS.map(function (level) {
        return {
          level: level,
          done: completed.indexOf(level) !== -1,
          locked: !this.isUnlocked(level)
        };
      }, this);

      return {
        nextLevel: next, // null when everything is finished
        nextLevelText: next === null ? "All levels completed!" : "Level " + next,
        completedCount: completed.length,
        totalLevels: ALL_LEVELS.length,
        chips: chips
      };
    },

    /** Format a number of seconds as a friendly "m min s s" string. */
    formatDuration: function (totalSeconds) {
      var seconds = Math.max(0, Math.round(totalSeconds || 0));
      var minutes = Math.floor(seconds / 60);
      var rest = seconds % 60;
      return minutes + " min " + rest + " s";
    },

    /** Format seconds as a countdown clock, e.g. 180 -> "03:00". */
    formatClock: function (totalSeconds) {
      var seconds = Math.max(0, Math.round(totalSeconds || 0));
      var minutes = Math.floor(seconds / 60);
      var rest = seconds % 60;
      var mm = minutes < 10 ? "0" + minutes : String(minutes);
      var ss = rest < 10 ? "0" + rest : String(rest);
      return mm + ":" + ss;
    }
  };

  OWG.statistics = statistics;
})();
