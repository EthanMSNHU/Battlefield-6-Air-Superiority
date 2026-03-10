Airsup_v3.ts Explanation
========================

Purpose

  - Expands the v2 HUD with objective placeholder boxes and A/B/C label structure.

Major Functions And Why They Are Used

  - createHUD(player)
  Why: Becomes the main visual-composition function. It adds the score area plus objective placeholder plates and labels using shared layout constants.

  - OnGameModeStarted()
  Why: Continues stable mode setup while ensuring active players get the richer HUD scaffold at startup.

  - updateTeamScores()
  Why: Remains intentionally unchanged so UI layout growth does not alter gameplay rules.

HUD Structure Rationale

  - Objective placeholders are added before ownership-state logic so spacing, symmetry, and visual layering can be validated independently.

  - Shared size and spacing constants reduce layout drift across the A/B/C objective elements.

  - Depth/layer values are introduced so text remains readable over the objective plates.

Why This Version Matters

  - Creates the objective HUD scaffold that later versions rely on for live ownership-state rendering.

  - Separates visual layout evolution from gameplay and scoring changes.
