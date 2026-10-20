/* ==========================================================================
   ODD WORD GAME — app.js
   Renders every screen of the Canva design (ODD ONE OUT) into #app and wires
   user input to the OWG modules. This file is the only place that touches
   the DOM.

   Screen names (see navigation.js): start, home, statistics, gameplay,
   levelComplete, timeOver, threeWrong, allComplete, chooseLevel, home2.

   IMPORTANT — tests/test-runner.html asserts these exact element ids and
   data-action names, so do not rename them:
     #username-form #username-input #username-error #save-username-btn
     #word-grid .word-tile[data-word-index] #timer-text #correct-count
     #wrong-count #feedback #total-correct #total-wrong
     #levels-completed-count #change-username-form #change-username-input
     actions: play statistics go-home stats-prev stats-next change-username
              cancel-username-change retry continue all-yes all-no
              choose-level choose-home home2-play home2-back
   ========================================================================== */
(function () {
  "use strict";

  window.OWG = window.OWG || {};

  var app = document.getElementById("app");

  /* Which level's record the Statistics arrows are showing (0..2 = L1..L3). */
  var statsIndex = 0;

  /* ---------------------------------------------------------------- utils */

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clock(seconds) {
    return OWG.statistics.formatClock(seconds);
  }

  /* Small inline icons matching the Canva line-icon style. */
  var ICON = {
    stopwatch:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="13" r="8"/><path d="M12 13V9"/><path d="M9 2h6"/>' +
      '<path d="M12 2v3"/><path d="M19 6l-1.5 1.5"/></svg>',
    chart:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16l4-5 3 3 5-7"/></svg>',
    home:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    retry:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#ec1b25" stroke-width="2.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
    chevronLeft:
      '<svg class="icon icon--big" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="15 5 8 12 15 19"/></svg>',
    chevronRight:
      '<svg class="icon icon--big" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="9 5 16 12 9 19"/></svg>',
    check:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#00be62" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="4 13 9 18 20 6"/></svg>',
    cross:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#ff3131" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 5l14 14M19 5L5 19"/></svg>',
    user:
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
  };

  /* The repeated brand header: circuit brain + glowing kicker + big title. */
  function brandBlock(withSubtitle) {
    return (
      '<div class="brand">' +
      '<img class="brand-logo" src="assets/icons/brain.svg" alt="" width="116" height="116">' +
      '<span class="brand-kicker">Brain<span class="sep">|</span>Speed<span class="sep">|</span>Logic</span>' +
      '<h1 class="brand-title">Odd One Out</h1>' +
      (withSubtitle
        ? '<p class="brand-sub">Find the word that doesn\'t belong</p>'
        : "") +
      "</div>"
    );
  }

  /* ---------------------------------------------------------- start page */

  function renderStart() {
    app.innerHTML =
      '<div class="screen screen--center" data-screen="start">' +
      brandBlock(true) +
      '<form id="username-form" class="panel" novalidate>' +
      '<h2 class="panel-title">Enter your username to begin</h2>' +
      '<input id="username-input" class="text-input" type="text" maxlength="24" ' +
      'autocomplete="nickname" placeholder="ENTER HERE" aria-label="Username" ' +
      'aria-describedby="username-error">' +
      '<p id="username-error" class="form-error" role="alert"></p>' +
      '<button id="save-username-btn" class="btn btn--primary btn--save" type="submit" disabled>' +
      "Save</button>" +
      "</form>" +
      "</div>";
  }

  /* --------------------------------------------------------------- home */

  function renderHome() {
    var username = OWG.storage.getUsername();
    var progress = OWG.statistics.homeProgress();
    var level = progress.nextLevel || 1;
    var config = OWG.game.LEVELS[level];
    var allDone = progress.nextLevel === null;

    app.innerHTML =
      '<div class="screen screen--center" data-screen="home">' +
      brandBlock(true) +
      '<p class="username-preview" id="username-preview">' + esc(username) + "</p>" +
      '<span class="chip chip--timer">' + ICON.stopwatch + " " + clock(config.seconds) + "</span>" +
      '<div class="next-box">' +
      '<span class="next-label">Next up</span>' +
      '<span class="next-value">' + esc(progress.nextLevelText) + "</span>" +
      "</div>" +
      '<p class="hint-lines">' +
      (allDone
        ? "You beat every level &mdash; replay any time!"
        : config.wordsPerRound + " words to start | More words each levels<br>Less time each levels") +
      "</p>" +
      '<div class="button-row">' +
      '<button type="button" class="btn btn--play" data-action="play">Play</button>' +
      '<button type="button" class="btn" data-action="statistics">' + ICON.chart + " Statistics</button>" +
      "</div>" +
      "</div>";
  }

  /* --------------------------------------------------------- statistics */

  function kvRow(label, icon, valueHtml) {
    return (
      '<div class="kv-row">' +
      '<span class="kv-key">' + label + " " + icon + "</span>" +
      '<span class="kv-value">' + valueHtml + "</span>" +
      "</div>"
    );
  }

  function renderStatistics(data) {
    if (!data || !data.keepIndex) statsIndex = 0;

    var totals = OWG.statistics.lifetimeTotals();
    var completed = OWG.statistics.levelsCompleted();
    var level = statsIndex + 1;
    var attempt = OWG.statistics.latestAttempt(level);

    var recordHtml;
    if (attempt) {
      recordHtml =
        kvRow("Correct Answers", ICON.check, esc(attempt.correct)) +
        kvRow("Wrong Answers", ICON.cross, esc(attempt.wrong)) +
        kvRow("Time Taken", ICON.stopwatch, esc(OWG.statistics.formatDuration(attempt.timeTaken)));
    } else {
      recordHtml = '<p class="empty-state">No finished attempt yet</p>';
    }

    app.innerHTML =
      '<div class="screen" data-screen="statistics">' +
      brandBlock(false) +
      '<h2 class="section-chip">' + ICON.chart + " Statistics</h2>" +
      '<div class="card">' +
      kvRow("Username", ICON.user, '<span class="chip">' + esc(OWG.storage.getUsername()) + "</span>") +
      kvRow("Levels Completed", ICON.check, '<span id="levels-completed-count">' +
        completed + " / 3</span>") +
      kvRow("Correct Answers", ICON.check, '<span id="total-correct">' + totals.correct + "</span>") +
      kvRow("Wrong Answers", ICON.cross, '<span id="total-wrong">' + totals.wrong + "</span>") +
      '<p class="record-title">Level ' + level + ' Record <span aria-hidden="true">&raquo;</span></p>' +
      recordHtml +
      "</div>" +
      '<div class="stats-arrows">' +
      '<button type="button" class="arrow-btn" data-action="stats-prev" aria-label="Previous level record"' +
      (statsIndex === 0 ? " disabled" : "") + ">" + ICON.chevronLeft + "</button>" +
      '<button type="button" class="arrow-btn" data-action="stats-next" aria-label="Next level record"' +
      (statsIndex === 2 ? " disabled" : "") + ">" + ICON.chevronRight + "</button>" +
      "</div>" +
      '<div class="button-row">' +
      '<button type="button" class="btn btn--ghost btn--small" data-action="change-username">' +
      "Change username</button>" +
      '<form id="change-username-form" class="panel" hidden novalidate>' +
      '<label for="change-username-input">New username</label>' +
      '<input id="change-username-input" class="text-input" type="text" maxlength="24" ' +
      'autocomplete="nickname" placeholder="ENTER HERE">' +
      '<p id="change-username-error" class="form-error" role="alert"></p>' +
      '<div class="button-row button-row--split">' +
      '<button class="btn btn--primary btn--small" type="submit">Save</button>' +
      '<button class="btn btn--ghost btn--small" type="button" ' +
      'data-action="cancel-username-change">Cancel</button>' +
      "</div>" +
      "</form>" +
      '<button type="button" class="btn" data-action="go-home">' + ICON.home + " Go Home</button>" +
      "</div>" +
      "</div>";
  }

  /* ----------------------------------------------------------- gameplay */

  function paintRound(round) {
    var grid = document.getElementById("word-grid");
    if (!grid || !round) return;

    var html = "";
    for (var i = 0; i < round.words.length; i++) {
      html +=
        '<button type="button" class="word-tile" data-word-index="' + i + '">' +
        esc(round.words[i]) +
        "</button>";
    }
    grid.innerHTML = html;

    var feedback = document.getElementById("feedback");
    if (feedback) {
      feedback.textContent = "";
      feedback.className = "feedback";
    }
  }

  function lockTiles() {
    var tiles = document.querySelectorAll("#word-grid .word-tile");
    for (var i = 0; i < tiles.length; i++) tiles[i].disabled = true;
  }

  function showFeedback(isCorrect) {
    var feedback = document.getElementById("feedback");
    if (!feedback) return;
    feedback.className = "feedback " + (isCorrect ? "is-good" : "is-bad");
    feedback.innerHTML = isCorrect
      ? '<span class="feedback-main">Correct</span><span class="feedback-sub">Nice one!</span>'
      : '<span class="feedback-main">Wrong</span><span class="feedback-sub">Not that one</span>';
  }

  function onTick(seconds) {
    var text = document.getElementById("timer-text");
    if (text) text.textContent = clock(seconds);

    var snapshot = OWG.game.snapshot();
    var total = snapshot ? OWG.game.LEVELS[snapshot.level].seconds : 1;

    var chip = document.querySelector(".hud-timer");
    if (chip) chip.classList.toggle("is-low", seconds <= 15);

    var fill = document.querySelector(".timer-fill");
    if (fill) {
      var percent = Math.max(0, Math.min(100, (seconds / total) * 100));
      fill.style.width = percent + "%";
      fill.classList.toggle("is-low", seconds <= 15);
    }
  }

  function onAnswer(result) {
    var correctEl = document.getElementById("correct-count");
    var wrongEl = document.getElementById("wrong-count");
    if (correctEl) correctEl.textContent = String(result.correct);
    if (wrongEl) wrongEl.textContent = String(result.wrong);

    var tile = document.querySelector('#word-grid .word-tile[data-word-index="' + result.index + '"]');
    if (tile) tile.classList.add(result.isCorrect ? "is-correct" : "is-wrong");
    lockTiles();
    showFeedback(result.isCorrect);
  }

  function onEnd(result) {
    // Record the finished attempt exactly once (game.js guards the ending).
    OWG.storage.recordAttempt({
      level: result.level,
      outcome: result.outcome,
      reason: result.reason,
      correct: result.correct,
      wrong: result.wrong,
      rounds: result.rounds,
      timeTaken: result.timeTaken,
      endedAt: Date.now()
    });
    OWG.navigation.afterLevelEnd(result);
  }

  function renderGameplay(data) {
    var level = (data && data.level) || OWG.statistics.nextLevel() || 1;
    var config = OWG.game.LEVELS[level];

    app.innerHTML =
      '<div class="screen screen--game" data-screen="gameplay">' +
      '<div class="game-brand">' +
      '<img class="brand-logo" src="assets/icons/brain.svg" alt="" width="66" height="66">' +
      '<h1 class="game-title">Odd One Out</h1>' +
      "</div>" +
      '<div class="hud-row">' +
      '<span class="hud-chip">Level ' + level + "</span>" +
      '<span class="hud-chip hud-timer">' + ICON.stopwatch +
      ' <span id="timer-text">' + clock(config.seconds) + "</span></span>" +
      '<span class="hud-chip">' + config.wordsPerRound + " Words</span>" +
      '<span class="hud-chip"><span class="score-good">&#10003; <b id="correct-count">0</b></span> ' +
      '<span class="score-bad">&#10007; <b id="wrong-count">0</b></span></span>' +
      "</div>" +
      '<div class="timer-track"><span class="timer-fill"></span></div>' +
      '<h2 class="round-title">Find the word that <strong>doesn\'t belong</strong></h2>' +
      '<div id="word-grid" class="word-grid word-grid--level' + level + '" role="group" ' +
      'aria-label="Word choices"></div>' +
      '<p id="feedback" class="feedback" aria-live="polite"></p>' +
      '<p class="tap-hint">Tap the odd one</p>' +
      "</div>";

    OWG.game.start(level, {
      onStart: paintRound,
      onTick: onTick,
      onRound: paintRound,
      onAnswer: onAnswer,
      onEnd: onEnd
    });
  }

  /* ------------------------------------------------------ result screens */

  function resultBrand() {
    return (
      '<div class="game-brand">' +
      '<img class="brand-logo" src="assets/icons/brain.svg" alt="" width="66" height="66">' +
      '<h1 class="game-title">Odd One Out</h1>' +
      "</div>"
    );
  }

  function timeChip(seconds) {
    return (
      '<p class="inline-chip">In <span class="chip chip--timer">' +
      ICON.stopwatch + " " + clock(seconds) + "</span></p>"
    );
  }

  function resultFrom(data) {
    var result = (data && data.result) || null;
    if (!result) {
      var level = (data && data.level) || 1;
      result = OWG.statistics.latestAttempt(level) || {
        level: level, correct: 0, wrong: 0, timeTaken: OWG.game.LEVELS[level].seconds
      };
    }
    return result;
  }

  function renderLevelComplete(data) {
    var result = resultFrom(data);
    var level = result.level;
    var nextLabel = level < 3 ? "Level " + (level + 1) : "Finish";

    app.innerHTML =
      '<div class="screen screen--center" data-screen="levelComplete">' +
      resultBrand() +
      timeChip(result.timeTaken) +
      '<img class="result-art" src="assets/images/trophy.svg" alt="Trophy" width="172" height="172">' +
      '<p class="result-lines">Got ' + result.correct + ' answers correct<br>' +
      result.wrong + (result.wrong === 1 ? " answer is wrong" : " answers are wrong") + "</p>" +
      '<p class="result-box">Level ' + level + " completed</p>" +
      '<div class="button-row">' +
      '<button type="button" class="btn btn--play" data-action="continue">' +
      esc(nextLabel) + " &raquo;&raquo;</button>" +
      '<button type="button" class="btn btn--ghost btn--small" data-action="go-home">' +
      ICON.home + " Back to Home</button>" +
      "</div>" +
      "</div>";
  }

  function renderTimeOver(data) {
    var result = resultFrom(data);
    var level = result.level;
    var config = OWG.game.LEVELS[level];
    var goal = level < 3 ? "to proceed to level " + (level + 1) : "to complete the game";

    app.innerHTML =
      '<div class="screen screen--center" data-screen="timeOver">' +
      resultBrand() +
      timeChip(config.seconds) +
      '<img class="result-art result-art--stamp" src="assets/images/lost-stamp.svg" ' +
      'alt="Lost" width="300" height="300">' +
      '<p class="loss-message">Only ' + result.correct + " is correct<br>" +
      "Minimum " + config.required + " answers need to be correct<br>" +
      '<span class="accent">' + goal + "</span></p>" +
      '<div class="button-row">' +
      '<button type="button" class="btn btn--play" data-action="retry">' +
      "Retry " + ICON.retry + "</button>" +
      "</div>" +
      "</div>";
  }

  function renderThreeWrong(data) {
    var result = resultFrom(data);
    var level = result.level;

    app.innerHTML =
      '<div class="screen screen--center" data-screen="threeWrong">' +
      resultBrand() +
      timeChip(result.timeTaken) +
      '<img class="result-art result-art--stamp" src="assets/images/lost-stamp.svg" ' +
      'alt="Lost" width="300" height="300">' +
      '<p class="loss-message"><span class="accent">' + result.wrong + " wrong answers</span><br>" +
      result.correct + " answers were correct</p>" +
      '<div class="button-row">' +
      '<button type="button" class="btn btn--play" data-action="retry">' +
      "Retry " + ICON.retry + "</button>" +
      "</div>" +
      "</div>";
  }

  /* ---------------------------------------------------- all levels done */

  function renderAllComplete() {
    app.innerHTML =
      '<div class="screen screen--center" data-screen="allComplete">' +
      brandBlock(false) +
      '<h2 class="panel-title">All levels are completed</h2>' +
      '<img class="result-art" src="assets/images/trophy.svg" alt="Trophy" width="172" height="172">' +
      '<p class="question-line">Do you want to continue?</p>' +
      '<div class="button-row button-row--split">' +
      '<button type="button" class="btn btn--yes" data-action="all-yes">Yes</button>' +
      '<button type="button" class="btn btn--no" data-action="all-no">No</button>' +
      "</div>" +
      "</div>";
  }

  /* -------------------------------------------------------- choose level */

  function renderChooseLevel() {
    var cards = "";
    for (var level = 1; level <= 3; level++) {
      var config = OWG.game.LEVELS[level];
      var status = OWG.statistics.levelStatus(level);
      var badge =
        status === "completed"
          ? '<span class="badge badge--done">Completed</span>'
          : status === "unlocked"
            ? '<span class="badge badge--ready">Ready</span>'
            : '<span class="badge badge--locked">Locked</span>';
      var locked = status === "locked" ? " disabled" : "";

      cards +=
        '<button type="button" class="level-card' +
        (status === "completed" ? " is-done" : "") +
        '" data-action="choose-level" data-level="' + level + '"' + locked + ">" +
        "<span>" +
        '<span class="level-number">Level ' + level + "</span>" +
        '<span class="level-card-meta">' + config.wordsPerRound + " words | " +
        config.seconds + " seconds</span>" +
        "</span>" + badge +
        "</button>";
    }

    app.innerHTML =
      '<div class="screen screen--center" data-screen="chooseLevel">' +
      brandBlock(false) +
      '<h2 class="panel-title">Which level do you<br>want to play</h2>' +
      '<div class="level-card-list">' + cards + "</div>" +
      '<div class="button-row">' +
      '<button type="button" class="btn" data-action="choose-home">' + ICON.home + " Home</button>" +
      "</div>" +
      "</div>";
  }

  /* ------------------------------------------------------------- home 2 */

  function renderHome2() {
    var completed = OWG.storage.getCompletedLevels();
    var chips = "";
    if (completed.length === 0) {
      chips = '<span class="level-dot">No levels completed yet</span>';
    } else {
      for (var i = 0; i < completed.length; i++) {
        chips += '<span class="level-dot is-done">Level ' + completed[i] +
          ' <span class="dot-status">&#10003;</span></span>';
      }
    }

    app.innerHTML =
      '<div class="screen screen--center" data-screen="home2">' +
      brandBlock(true) +
      '<span class="chip chip--timer">' + ICON.stopwatch + " 03:00</span>" +
      '<div class="next-box">' +
      '<span class="next-label">Score</span>' +
      '<span class="next-value">Levels completed</span>' +
      "</div>" +
      '<div class="progress-row">' + chips + "</div>" +
      '<p class="hint-lines">5 words to start | More words each levels<br>Less time each levels</p>' +
      '<div class="button-row">' +
      '<button type="button" class="btn btn--play" data-action="home2-play">Play Again</button>' +
      '<button type="button" class="btn" data-action="home2-back">' + ICON.home + " Back to Home</button>" +
      "</div>" +
      "</div>";
  }

  /* ------------------------------------------------------------- router */

  function render(name, data) {
    switch (name) {
      case "start": renderStart(); break;
      case "home": renderHome(); break;
      case "statistics": renderStatistics(data); break;
      case "gameplay": renderGameplay(data); break;
      case "levelComplete": renderLevelComplete(data); break;
      case "timeOver": renderTimeOver(data); break;
      case "threeWrong": renderThreeWrong(data); break;
      case "allComplete": renderAllComplete(); break;
      case "chooseLevel": renderChooseLevel(); break;
      case "home2": renderHome2(); break;
      default: renderHome();
    }
  }

  OWG.app = { render: render };

  /* ----------------------------------------------------- event handling */

  document.addEventListener("click", function (event) {
    var target = event.target;

    /* Word tiles only work while a level is running. game.submitAnswer()
       already invokes the onAnswer callback, so we must not call it again. */
    var tile = target.closest ? target.closest(".word-tile") : null;
    if (tile) {
      if (OWG.navigation.current.screen !== "gameplay") return;
      var index = parseInt(tile.getAttribute("data-word-index"), 10);
      OWG.game.submitAnswer(index);
      return;
    }

    var el = target.closest ? target.closest("[data-action]") : null;
    if (!el) return;

    switch (el.getAttribute("data-action")) {
      case "play":
        OWG.navigation.playFromHome();
        break;

      case "statistics":
        OWG.navigation.goStatistics();
        break;

      case "go-home":
        OWG.navigation.goHome();
        break;

      case "stats-prev":
        if (statsIndex > 0) statsIndex--;
        render("statistics", { keepIndex: true });
        break;

      case "stats-next":
        if (statsIndex < 2) statsIndex++;
        render("statistics", { keepIndex: true });
        break;

      case "change-username": {
        var form = document.getElementById("change-username-form");
        if (form) {
          form.hidden = false;
          el.hidden = true;
          var input = document.getElementById("change-username-input");
          if (input) {
            input.value = OWG.storage.getUsername();
            input.focus();
          }
        }
        break;
      }

      case "cancel-username-change":
        render("statistics", { keepIndex: true });
        break;

      case "retry":
        OWG.navigation.retryLevel(OWG.navigation.current.data.level);
        break;

      case "continue":
        OWG.navigation.continueFromComplete(OWG.navigation.current.data.level);
        break;

      case "all-yes":
        OWG.navigation.allCompleteYes();
        break;

      case "all-no":
        OWG.navigation.allCompleteNo();
        break;

      case "choose-level": {
        var level = parseInt(el.getAttribute("data-level"), 10);
        OWG.navigation.startLevel(level); // refuses locked levels itself
        break;
      }

      case "choose-home":
        OWG.navigation.goHome();
        break;

      case "home2-play":
        OWG.navigation.goChooseLevel();
        break;

      case "home2-back":
        OWG.navigation.goHome();
        break;
    }
  });

  /* The Save button on the Start Page only enables for a non-empty name. */
  document.addEventListener("input", function (event) {
    if (event.target && event.target.id === "username-input") {
      var button = document.getElementById("save-username-btn");
      if (button) button.disabled = event.target.value.trim().length === 0;
      var error = document.getElementById("username-error");
      if (error) error.textContent = "";
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target.id === "username-form") {
      event.preventDefault();
      var input = document.getElementById("username-input");
      var error = document.getElementById("username-error");
      var result = OWG.storage.setUsername(input ? input.value : "");
      if (result.ok) {
        OWG.navigation.go("home");
      } else if (error) {
        error.textContent = result.error;
        if (input) input.focus();
      }
    } else if (event.target.id === "change-username-form") {
      event.preventDefault();
      var cInput = document.getElementById("change-username-input");
      var cError = document.getElementById("change-username-error");
      var cResult = OWG.storage.setUsername(cInput ? cInput.value : "");
      if (cResult.ok) {
        // Progress and statistics are untouched: only the name changes.
        render("statistics", { keepIndex: true });
      } else if (cError) {
        cError.textContent = cResult.error;
        if (cInput) cInput.focus();
      }
    } else {
      return;
    }
  });

  /* Escape leaves the Statistics page, like a small "back" gesture. */
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && OWG.navigation.current.screen === "statistics") {
      OWG.navigation.goHome();
    }
  });

  /* ------------------------------------------------------------- startup */

  function boot() {
    // Nothing is auto-restored: a refresh mid-attempt always lands on Home
    // (or the Start Page) and the interrupted attempt is never recorded.
    OWG.navigation.startApp();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
