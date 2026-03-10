Airsup_v4.ts Explanation
========================

Purpose

  - Architectural stabilization pass for score synchronization and HUD updates.

Major Functions And Why They Are Used

  - OnGameModeStarted()
  Why: Resets both timers and the new authoritative score object at match start so no stale values leak between rounds.

  - updateTeamScores()
  Why: Main state mutator. It computes held objectives, advances timers, applies score updates, and only refreshes UI when the authoritative score actually changes.

  - updateScoreBoardHeader()
  Why: Single writer for scoreboard header values so both team totals come from the same source of truth.

  - updateAllHudScores()
  Why: Setter-based HUD refresh for every player. It maps global team scores into player-relative friendly/enemy values and updates existing widgets in place.

  - createHUD(player)
  Why: Builds the score HUD once per player and stores the widget names in `PlayerHud` for later setter-driven updates.

Why gameState Is Important

  - It becomes the authoritative local score model.

  - Scoreboard header and HUD read from the same values, which eliminates desync caused by mixing sources.

  - Later visual systems can safely build on this without changing the core scoring flow.

Why This Version Matters

  - First version where score data flow is clearly authoritative and predictable.

  - Moves HUD behavior from ad-hoc creation toward controlled state mutation.
