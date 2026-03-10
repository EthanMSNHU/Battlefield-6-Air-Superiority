Airsup_v7.ts Explanation
========================

Purpose

  - Polish iteration on the full v6 feature set.

  - Preserves the authoritative scoring model while expanding the HUD with richer objective styling, team-switch UX, capture progress, and redzone enforcement.

Major Functions And Why They Are Used

  - OnGameModeStarted()
  Why: Central bootstrap. It resets state, configures objectives, initializes scoreboard/HUD state, and runs the 1-second score and ownership refresh loop.

  - initializeAllCurrentPlayers()
  Why: Handles players already in the server when the mode starts so they receive the full stat, HUD, and objective setup immediately.

  - initializePlayerState(player)
  Why: Consolidates per-player stat reset, HUD creation, redzone UI creation, and team-switch setup into one reusable entry point.

  - updateTeamScores()
  Why: Core scoring authority. It reads ownership, advances timers, applies score increments, and triggers HUD/header refresh only when the authoritative score changes.

  - updateAllHudScores()
  Why: Applies player-relative friendly/enemy score mapping and resizes the score bars from those same values.

  - updatePlayerCaptureProgressHud(player)
  Why: Shows a live capture-progress widget only while a player is actively involved in an in-flight capture, including friendly/enemy split fill behavior.

  - createHUD(player)
  Why: Builds the full per-player HUD tree, including score labels, bars, objective stacks, and capture-progress widgets.

  - createTeamSwitchUi(player)
  Why: Creates the triple-tap interact panel that lets a player switch to Team 1 or Team 2 and close the panel safely.

  - updateSingleObjectiveVisibility(...)
  Why: Encapsulates the neutral/friendly/enemy objective visibility rules so each point shows exactly one ownership state from that viewer's perspective.

  - updateAllObjectiveIcons()
  Why: Resolves current owners for A/B/C and refreshes all player HUD objective states in one pass.

  - ensureRedZoneWarningUi(player) / resolveRedZoneTimeout(...)
  Why: Drive the enemy-HQ warning box and timed destruction flow when a player remains inside the opposing base trigger.

  - OnPlayerEnterAreaTrigger / OnPlayerExitAreaTrigger
  Why: Start and cancel enemy-HQ redzone countdowns based on area trigger entry and exit.

V7 Feature Set

  - Objective plate visuals use layered outer and inner states for neutral, friendly, and enemy ownership.

  - Capture progress HUD appears only during active capture movement and supports runtimes that report progress as either `0..1` or `0..100`.

  - Triple tap Interact (`E`) opens the team-switch panel, and successful team changes force undeploy for a clean redeploy flow.

  - Enemy HQ redzones use AreaTrigger ObjIds `104` and `105` with a `5` second warning countdown before destruction.

System Design Notes

  - `gameState` remains the single local source of truth for team scores.

  - UI is created once and updated through setters and visibility toggles for runtime stability.

  - Objective and capture visuals remain perspective-correct based on the viewing player's team.

Working Copy Note

  - `Airsup_v7 copy.ts` is the tuning/working copy of the same feature set and currently mirrors the same major systems as `Airsup_v7.ts`.

Why This Version Matters

  - It is the most complete Air Sup iteration in the project.

  - It combines stable scoring, mature HUD layering, team-switch UX, live capture feedback, and enemy-base enforcement in one version.
