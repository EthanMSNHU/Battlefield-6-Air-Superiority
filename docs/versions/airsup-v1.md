Airsup_v1.ts Explanation
========================

Purpose

  - Baseline Air Superiority ruleset.

  - Establishes objective-based ticket flow and per-player custom scoreboard stats without any custom HUD layer.

Major Functions And Why They Are Used

  - OnGameModeStarted()
  Why: Bootstraps the mode. It configures capture points, initializes both team scores, sets up the scoreboard, and drives the 1-second gameplay loop.

  - setUpScoreBoard()
  Why: Defines the custom two-team scoreboard layout and stat columns in one place so all row/header formatting stays consistent.

  - updateScoreBoardTotal()
  Why: Mirrors live team scores into the scoreboard header so the visible team totals stay current.

  - getSecondsPerPoint(pointsHeld)
  Why: Encodes the scoring cadence rules in one function: 3 held = 1 second, 2 held = 5 seconds, 1 held = 10 seconds.

  - updateTeamScores()
  Why: Core scoring engine. It reads ownership of A/B/C, advances per-team timers, and awards score only when the correct interval is reached.

  - updatePlayerScoreBoard(player)
  Why: Central writer for per-player row values so kills, deaths, score, and captures always refresh through the same path.

  - OnPlayerEarnKill / OnPlayerDied / OnCapturePointCaptured
  Why: Gameplay event hooks that update stored player stats and immediately refresh the affected scoreboard row.

System Design Notes

  - Team score gain is timer-based rather than burst-based, which gives the mode a steady domination-style flow.

  - Player stats are stored in fixed object-variable slots for simple and predictable event updates.

  - This version is rules-first and intentionally minimal; all later versions build on this scoring/stat foundation.
