/* ==========================================================================
   ODD WORD GAME — navigation.js
   Decides WHICH screen is shown next. It never draws anything itself —
   it hands a screen name and data to OWG.app.render().

   The 15 logical screens of the specification all map to one of these names:
     start            1. Start Page
     start            2. Start Page after username entry (same screen, filled)
     home             3. Main Home Page
     statistics       4. Statistics Page
     gameplay         5. Level 1 page  (also 11. Level 2 and 12. Level 3)
     (feedback is drawn in place on the gameplay screen — screens 6 and 7)
     levelComplete    8. Level Completed
     timeOver         9. Level Lost (Time Over)
     threeWrong      10. Level Lost (Three Wrong Answers)
     allComplete     13. All Levels Completed
     chooseLevel     14. Choose Level
     home2           15. Home 2
   ========================================================================== */
(function () {
  "use strict";

  window.OWG = window.OWG || {};

  var navigation = {
    current: { screen: "start", data: {} },

    /** Move to a screen. Also stops any running game for safety. */
    go: function (screen, data) {
      // Leaving gameplay must always stop the timer. Screens reached after a
      // level has ended are fine because the game is already finished.
      if (screen !== "gameplay") OWG.game.stop();
      this.current = { screen: screen, data: data || {} };
      OWG.app.render(screen, this.current.data);
    },

    /**
     * First screen after the page loads.
     * Username saved -> Home. Otherwise -> Start Page.
     * (A refresh during gameplay therefore always lands on Home, and an
     * interrupted attempt is never recorded.)
     */
    startApp: function () {
      if (OWG.storage.hasUsername()) this.go("home");
      else this.go("start");
    },

    /* --- Home ------------------------------------------------------------ */

    goHome: function () {
      this.go("home");
    },

    /** Play from the main Home page: next incomplete level, or level select. */
    playFromHome: function () {
      var next = OWG.statistics.nextLevel();
      if (next === null) this.go("chooseLevel");
      else this.startLevel(next);
    },

    goStatistics: function () {
      this.go("statistics");
    },

    /* --- Gameplay -------------------------------------------------------- */

    /** Start a level only if it is unlocked; locked levels never start. */
    startLevel: function (level) {
      if (!OWG.statistics.isUnlocked(level)) return false;
      this.go("gameplay", { level: level });
      return true;
    },

    retryLevel: function (level) {
      this.startLevel(level);
    },

    /**
     * Called by the app when a level ends (win or loss). The attempt has
     * already been recorded by the app at this point.
     */
    afterLevelEnd: function (result) {
      if (result.outcome === "win") {
        this.go("levelComplete", { level: result.level, result: result });
      } else if (result.reason === "time") {
        this.go("timeOver", { level: result.level, result: result });
      } else {
        this.go("threeWrong", { level: result.level, result: result });
      }
    },

    /** Continue button on the Level Completed screen. */
    continueFromComplete: function (level) {
      if (level === 3) {
        this.go("allComplete");
      } else {
        this.startLevel(level + 1);
      }
    },

    /* --- All levels completed ------------------------------------------- */

    allCompleteYes: function () { this.go("chooseLevel"); },
    allCompleteNo: function () { this.go("home2"); },

    /* --- Choose level & Home 2 ------------------------------------------ */

    goChooseLevel: function () { this.go("chooseLevel"); },
    goHome2: function () { this.go("home2"); }
  };

  OWG.navigation = navigation;
})();
