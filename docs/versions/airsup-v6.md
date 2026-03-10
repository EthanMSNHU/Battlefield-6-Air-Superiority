Airsup_v6.ts Explanation
========================

Purpose

  - Full-feature Air Sup HUD with mirrored scores, dynamic bars, and live objective ownership states.

Major Functions And Why They Are Used

  - OnGameModeStarted()
  Why: Complete mode bootstrap. It resets authoritative state, configures objectives, initializes the scoreboard, and runs the continuous score/objective refresh loop.

  - updateTeamScores()
  Why: Remains the scoring authority and triggers downstream HUD refresh only when score values change.

  - updateAllHudScores()
  Why: Updates the player-relative score text and dynamic bar visuals from authoritative team score values.

  - createHUD(player)
  Why: Builds the per-player HUD tree and registers all score/bar/objective widget names in `PlayerHud`.

  - updateSingleObjectiveVisibility(...)
  Why: Encapsulates the ownership-state rules for one objective stack so exactly one visual state is active: neutral, friendly, or enemy.

  - updateAllObjectiveIcons()
  Why: Reads live ownership once for A/B/C and applies the correct visibility state to every player's HUD.

  - OnPlayerJoinGame(player)
  Why: Initializes player stats, builds HUD widgets, and forces an immediate HUD/objective sync for late joiners.

  - OnCapturePointCaptured(capturePoint)
  Why: Awards capture rewards and immediately refreshes the ownership visuals after a point changes hands.

Objective-State Design Rationale

  - Each objective uses overlapping widgets for neutral, friendly, and enemy states.

  - Runtime code toggles visibility instead of rebuilding widgets, which is cheaper and more stable.

  - Team-relative mapping means the same objective can appear friendly to one player and enemy to another.

Why This Version Matters

  - Represents the first complete gameplay plus HUD readability package.

  - Combines stable authoritative scoring with live objective awareness from the player's perspective.
