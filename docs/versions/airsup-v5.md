Airsup_v5.ts Explanation
========================

Purpose

  - Adds dynamic score bars on top of the v4 stable score architecture.

Major Functions And Why They Are Used

  - updateAllHudScores()
  Why: Becomes the main visual feedback function. It updates score text and recalculates both bar fill sizes from the same authoritative score values.

  - createHUD(player)
  Why: Adds dedicated bar fill widgets for the friendly and enemy sides and stores those widget names for fast runtime resizing.

  - updateTeamScores()
  Why: Still owns all score changes. The bars intentionally react only when score changes happen so HUD work stays efficient.

  - getSecondsPerPoint(pointsHeld)
  Why: Preserves the v4 pacing rules of 3 held = 1 second, 2 held = 5 seconds, 1 held = 10 seconds.

Bar System Design

  - `MAX_SCORE` and `MAX_BAR_WIDTH` normalize score into bar width.

  - The friendly side grows in the normal positive direction.

  - The enemy side uses mirrored growth so the HUD stays visually balanced from the player's perspective.

Why This Version Matters

  - Introduces an immediate at-a-glance momentum indicator without changing the mode rules.

  - Shows how new visual systems can layer onto the authoritative score model from v4.
