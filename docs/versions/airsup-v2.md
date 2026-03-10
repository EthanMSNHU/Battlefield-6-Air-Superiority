Airsup_v2.ts Explanation
========================

Purpose

  - Keeps v1 scoring and stat behavior while introducing the first per-player HUD layer.

Major Functions And Why They Are Used

  - OnGameModeStarted()
  Why: Still owns match setup and the 1-second scoring loop, but now also creates HUD widgets for players already present when the mode starts.

  - createHUD(player)
  Why: First dedicated HUD constructor. It builds one widget tree per player and uses unique names based on player object ID to avoid collisions.

  - OnPlayerJoinGame(player)
  Why: Ensures late joiners receive both stat initialization and HUD creation immediately instead of waiting for another event.

  - updateTeamScores()
  Why: Preserves the exact v1 scoring core so HUD work does not change gameplay behavior.

  - updatePlayerScoreBoard(player)
  Why: Keeps the scoreboard row authoritative while the new HUD layer is added alongside it.

HUD Design Notes

  - HUD creation is one-time per player and tracked through a simple `hudCreated` list.

  - This version is still mostly scoreboard-driven; the HUD is an early presentation layer rather than a live state-heavy system.

Why This Version Matters

  - Introduces the first bridge from scoreboard-only gameplay to player-specific on-screen UI.

  - Establishes the pattern of building HUD widgets once and reusing them later.
