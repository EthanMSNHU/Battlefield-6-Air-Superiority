/**
 * Airsup_v7
 * Full Air Sup mode with mirrored score HUD, dynamic bars, and live objective ownership icons.
 *
 * Scope:
 * - Iterative polish pass on v6: objective plate contrast, alignment, and letter readability.
 * - Preserves scoring logic while refining HUD layering and legibility behavior.
 *
 * Runtime Model:
 * 1. Team score state remains authoritative and drives header/HUD outputs.
 * 2. Objective ownership icons update continuously from live capture ownership.
 * 3. Layering/alpha tuning improves objective marker clarity in varied map lighting.
 *
 * Notes:
 * - This version is visual-quality focused and intended for rapid in-match tuning.
 *
 * Team Switcher Attribution:
 * - Team switch UI interaction/template approach adapted from:
 *   https://github.com/The0zzy/BF6-Portal-TeamSwitchUI
 * - Original TeamSwitchUI copyright remains with its upstream author(s).
 * - Airsup v7 integration/customization copyright (c) 2026 Ethan Mills.
 * Copyright (c) 2026 Ethan Mills. All rights reserved.
 */

// -----------------------------------------------------------------------------
// GAME MODE VARIABLES
// -----------------------------------------------------------------------------
const playerKills = 0;
const playerDeaths = 1;
const playerScore = 2;
const playerCaptures = 3;
let team1ScoreTimer = 0;
let team2ScoreTimer = 0;
const TRIPLE_TAP_WINDOW_SECONDS = 1.25;
// Authoritative state
// Local source of truth for team scores; scoreboard and HUD derive from this object.
let gameState = {
    team1Score: 0,
    team2Score: 0
};

interface PlayerTeamSwitchUi {
    hintTextName: string;
    panelName: string;
    panelLabelName: string;
    team1ButtonName: string;
    team2ButtonName: string;
    closeButtonName: string;
    team1TextName: string;
    team2TextName: string;
    closeTextName: string;
    panelVisible: boolean;
    tapCount: number;
    lastTapTime: number;
    interactPoint: mod.InteractPoint | null;
    panelOpenedAt: number;
}

const playerTeamSwitchUiMap: Map<number, PlayerTeamSwitchUi> = new Map();

/**
 * Interact multi-click detector used by the team-switch UI.
 *
 * Why this exists:
 * - Portal input callbacks can vary by runtime/context.
 * - Polling interact edge transitions in `OngoingPlayer` gives a resilient fallback.
 *
 * Behavior:
 * - Tracks only rising edges of `IsInteracting`.
 * - Counts presses inside a fixed time window.
 * - Returns `true` exactly on the 3rd press, then resets sequence state.
 */
class InteractMultiClickDetector {
    private static readonly STATES: Record<number, { lastIsInteracting: boolean; clickCount: number; sequenceStartTime: number }> = {};
    private static readonly WINDOW_MS = 2000;
    private static readonly REQUIRED_CLICKS = 3;

    /**
     * Returns true when the player has pressed Interact three times within window.
     */
    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = mod.GetSoldierState(player, mod.SoldierStateBool.IsInteracting);

        let state = this.STATES[playerId];
        if (!state) {
            this.STATES[playerId] = state = {
                lastIsInteracting: isInteracting,
                clickCount: 0,
                sequenceStartTime: 0
            };
        }

        if (isInteracting === state.lastIsInteracting) return false;
        state.lastIsInteracting = isInteracting;

        if (!isInteracting) return false;

        const now = Date.now();

        if (state.clickCount > 0 && now - state.sequenceStartTime > this.WINDOW_MS) {
            state.clickCount = 0;
        }

        if (state.clickCount === 0) {
            state.sequenceStartTime = now;
            state.clickCount = 1;
            return false;
        }

        if (++state.clickCount !== this.REQUIRED_CLICKS) return false;

        state.clickCount = 0;
        return true;
    }
}




// HUD MAP (store widget names only)
// Per-player registry of all HUD widgets that need runtime updates.
interface PlayerHud {
    // Score text labels (friendly on left, enemy on right after team-relative mapping).
    blueScoreName: string;
    redScoreName: string;
    // Dynamic bar fill containers.
    blueBarFillName: string;
    redBarFillName: string;

    // Objective A state widgets (only one should be visible at a time).
    objA_Neutral: string;
    objA_NeutralInner: string;
    objA_Friendly: string;
    objA_FriendlyInner: string;
    objA_Enemy: string;
    objA_EnemyInner: string;

    // Objective B state widgets.
    objB_Neutral: string;
    objB_NeutralInner: string;
    objB_Friendly: string;
    objB_FriendlyInner: string;
    objB_Enemy: string;
    objB_EnemyInner: string;

    // Objective C state widgets.
    objC_Neutral: string;
    objC_NeutralInner: string;
    objC_Friendly: string;
    objC_FriendlyInner: string;
    objC_Enemy: string;
    objC_EnemyInner: string;
}

let playerHudMap: Map<number, PlayerHud> = new Map();





// -----------------------------------------------------------------------------
// INITIALIZE GAME MODE
// -----------------------------------------------------------------------------
/**
 * Mode bootstrap and main runtime loop.
 *
 * Responsibilities:
 * - Reset all authoritative mode state.
 * - Configure capture points and baseline objective rules.
 * - Build scoreboard + initialize all current players.
 * - Run a 1-second tick for score updates and objective icon synchronization.
 */
export async function OnGameModeStarted() {

    // Reset timers and authoritative score state at match start.
    team1ScoreTimer = 0;
    team2ScoreTimer = 0;
    playerTeamSwitchUiMap.clear();

    gameState.team1Score = 0;
    gameState.team2Score = 0;

    // Configure the three capture points used by this mode.
    let capturePointA = mod.GetCapturePoint(100);
    let capturePointB = mod.GetCapturePoint(101);
    let capturePointC = mod.GetCapturePoint(102);

    mod.EnableGameModeObjective(capturePointA, true);
    mod.EnableGameModeObjective(capturePointB, true);
    mod.EnableGameModeObjective(capturePointC, true);

    mod.SetCapturePointCapturingTime(capturePointA,3);
    mod.SetCapturePointNeutralizationTime(capturePointA,3);
    mod.SetCapturePointCapturingTime(capturePointB,3);
    mod.SetCapturePointNeutralizationTime(capturePointB,3);
    mod.SetCapturePointCapturingTime(capturePointC,3);
    mod.SetCapturePointNeutralizationTime(capturePointC,3);

    mod.SetMaxCaptureMultiplier(capturePointA, 1);
    mod.SetMaxCaptureMultiplier(capturePointB, 1);
    mod.SetMaxCaptureMultiplier(capturePointC, 1);

    mod.SetGameModeScore(mod.GetTeam(1), 0);
    mod.SetGameModeScore(mod.GetTeam(2), 0);

    // Initialize scoreboard and team header labels.
    setUpScoreBoard();
    updateScoreBoardHeader();
    initializeAllCurrentPlayers();

    // Main mode tick: update tickets and objective ownership icons once per second.
    while(mod.GetMatchTimeRemaining() > 0) {
        await mod.Wait(1);
        updateTeamScores();
        updateAllObjectiveIcons();
    }
}

/**
 * Initializes every player already in the server at mode start.
 * This prevents "late init" problems where existing players miss HUD/state setup.
 */
function initializeAllCurrentPlayers(){
    // Ensure players already present when the mode starts are initialized.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++){
        const player = mod.ValueInArray(players, i) as mod.Player;
        initializePlayerState(player);
    }

    // Sync once after the batch init.
    updateAllHudScores();
    updateAllObjectiveIcons();
}





// -----------------------------------------------------------------------------
// SCOREBOARD
// -----------------------------------------------------------------------------
/**
 * Configures scoreboard type/schema for this mode.
 * Column order: Score, Kills, Deaths, Captures.
 */
function setUpScoreBoard(){
    // Define custom scoreboard type, labels, and column widths.
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    updateScoreBoardHeader();
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.SBHead1),
        mod.Message(mod.stringkeys.SBHead2),
        mod.Message(mod.stringkeys.SBHead3),
        mod.Message(mod.stringkeys.SBHead4),
    );
    mod.SetScoreboardColumnWidths(10,10,10,10);
}

/**
 * Mirrors authoritative team score values into scoreboard team headers.
 */
function updateScoreBoardHeader(){
    // Mirror authoritative score values into the scoreboard header.
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.score, gameState.team1Score),
        mod.Message(mod.stringkeys.score, gameState.team2Score)
    );
}





// -----------------------------------------------------------------------------
// TEAM SCORING
// -----------------------------------------------------------------------------
/**
 * Returns score cadence in seconds based on objectives held.
 * Higher map control yields faster score income.
 */
function getSecondsPerPoint(pointsHeld: number): number{
    // Ticket gain speed based on how many objectives a team owns.
    if (pointsHeld === 3) return 1;
    if (pointsHeld === 2) return 3;
    if (pointsHeld === 1) return 6;
    return 0;
}

/**
 * Core ticket-scoring authority.
 *
 * Flow:
 * 1) Resolve objective ownership counts for both teams.
 * 2) Advance per-team timers once per outer loop tick.
 * 3) Convert ownership to score interval via `getSecondsPerPoint`.
 * 4) Award score when timer reaches interval.
 * 5) Refresh HUD/header only if score changed.
 */
function updateTeamScores(){

    // Count ownership across A/B/C for each team.
    let team1PointsHeld = 0;
    let team2PointsHeld = 0;

    let A = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(100));
    let B = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(101));
    let C = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(102));

    if (mod.Equals(A, mod.GetTeam(1))) team1PointsHeld++;
    else if (mod.Equals(A, mod.GetTeam(2))) team2PointsHeld++;

    if (mod.Equals(B, mod.GetTeam(1))) team1PointsHeld++;
    else if (mod.Equals(B, mod.GetTeam(2))) team2PointsHeld++;

    if (mod.Equals(C, mod.GetTeam(1))) team1PointsHeld++;
    else if (mod.Equals(C, mod.GetTeam(2))) team2PointsHeld++;

    // Advance per-team score timers each tick.
    team1ScoreTimer++;
    team2ScoreTimer++;

    // Convert objective ownership into score intervals.
    const team1Rate = getSecondsPerPoint(team1PointsHeld);
    const team2Rate = getSecondsPerPoint(team2PointsHeld);

    // Gate expensive HUD/header refresh calls to only when values changed.
    let scoreChanged = false;

    // Apply score when each team reaches its current interval.
    if (team1Rate > 0 && team1ScoreTimer >= team1Rate){
        team1ScoreTimer = 0;
        gameState.team1Score++;
        mod.SetGameModeScore(mod.GetTeam(1), gameState.team1Score);
        scoreChanged = true;
    }

    if (team2Rate > 0 && team2ScoreTimer >= team2Rate){
        team2ScoreTimer = 0;
        gameState.team2Score++;
        mod.SetGameModeScore(mod.GetTeam(2), gameState.team2Score);
        scoreChanged = true;
    }

    // Refresh scoreboard and HUD only when a score changed.
    if (scoreChanged){
        updateScoreBoardHeader();
        updateAllHudScores();
    }
}





// -----------------------------------------------------------------------------
// HUD UPDATE (SETTERS ONLY)
// -----------------------------------------------------------------------------
/**
 * Updates per-player score labels and score bars.
 *
 * Key design:
 * - Uses team-relative mapping so each player sees friendly left / enemy right.
 * - Only mutates already-created widgets (no runtime widget creation here).
 */
function updateAllHudScores(){

    // Update each player's left/right score labels and bar fill sizes.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++){

        const player = mod.ValueInArray(players, i) as mod.Player;
        const id = mod.GetObjId(player);

        // Look up this player's registered HUD widgets.
        const hud = playerHudMap.get(id);
        if (!hud) continue;

        const blueWidget = mod.FindUIWidgetWithName(hud.blueScoreName);
        const redWidget = mod.FindUIWidgetWithName(hud.redScoreName);
        if (!blueWidget || !redWidget) continue;

        const playerTeam = mod.GetTeam(player);

        // Convert global team scores into player-relative friendly/enemy values.
        let friendlyScore;
        let enemyScore;

        if (mod.Equals(playerTeam, mod.GetTeam(1))){
            friendlyScore = gameState.team1Score;
            enemyScore = gameState.team2Score;
        } else {
            friendlyScore = gameState.team2Score;
            enemyScore = gameState.team1Score;
        }

        mod.SetUITextLabel(
            blueWidget,
            mod.Message(mod.stringkeys.score, friendlyScore)
        );

        mod.SetUITextLabel(
            redWidget,
            mod.Message(mod.stringkeys.score, enemyScore)
        );
    





// -----------------------------------------------------------------------------
// UPDATE BARS (LOCK ONE SIDE)
// -----------------------------------------------------------------------------
    // Normalize score into bar width space.
    // MAX_SCORE defines full bar length; values above 100 continue beyond full width.

    const MAX_SCORE = 100;
    const MAX_BAR_WIDTH = 280;
    const BAR_HEIGHT = 20;

    const friendlyWidth = MAX_BAR_WIDTH * (friendlyScore / MAX_SCORE);
    const enemyWidth = MAX_BAR_WIDTH * (enemyScore / MAX_SCORE);

    const blueBarFill = mod.FindUIWidgetWithName(hud.blueBarFillName);
    const redBarFill = mod.FindUIWidgetWithName(hud.redBarFillName);

    if (blueBarFill) {
        mod.SetUIWidgetSize(
            blueBarFill,
            mod.CreateVector(friendlyWidth, BAR_HEIGHT, 0)
        );
    }

    if (redBarFill) {
        mod.SetUIWidgetSize(
            redBarFill,
            mod.CreateVector(-enemyWidth, BAR_HEIGHT, 0) // Negative width grows left from the fixed right-side anchor.
            );
        }
    }
}
    




// -----------------------------------------------------------------------------
// HUD CREATION (CREATE ONCE)
// -----------------------------------------------------------------------------
/**
 * One-time HUD builder for a specific player.
 *
 * This function creates all static widgets (scores, bars, objective stacks, labels),
 * then stores widget-name references in `playerHudMap` for fast setter updates later.
 */
function createHUD(player: mod.Player){

    // Use object id for unique per-player widget names.
    const id = mod.GetObjId(player);
    // Prevent duplicate HUD creation for the same player.
    if (playerHudMap.has(id)) return;

    // =====================================================
    // DEFINE ALL CONSTANTS FIRST
    // =====================================================

    const blueName = "HUD_BLUE_SCORE_" + id;
    const redName = "HUD_RED_SCORE_" + id;

    const blueBarFillName = "HUD_BLUE_BAR_FILL_" + id;
    const redBarFillName = "HUD_RED_BAR_FILL_" + id;

    const objA_Neutral = "HUD_OBJ_A_NEUTRAL_" + id;
    const objA_NeutralInner = "HUD_OBJ_A_NEUTRAL_INNER_" + id;
    const objA_Friendly = "HUD_OBJ_A_FRIENDLY_" + id;
    const objA_FriendlyInner = "HUD_OBJ_A_FRIENDLY_INNER_" + id;
    const objA_Enemy = "HUD_OBJ_A_ENEMY_" + id;
    const objA_EnemyInner = "HUD_OBJ_A_ENEMY_INNER_" + id;

    const objB_Neutral = "HUD_OBJ_B_NEUTRAL_" + id;
    const objB_NeutralInner = "HUD_OBJ_B_NEUTRAL_INNER_" + id;
    const objB_Friendly = "HUD_OBJ_B_FRIENDLY_" + id;
    const objB_FriendlyInner = "HUD_OBJ_B_FRIENDLY_INNER_" + id;
    const objB_Enemy = "HUD_OBJ_B_ENEMY_" + id;
    const objB_EnemyInner = "HUD_OBJ_B_ENEMY_INNER_" + id;

    const objC_Neutral = "HUD_OBJ_C_NEUTRAL_" + id;
    const objC_NeutralInner = "HUD_OBJ_C_NEUTRAL_INNER_" + id;
    const objC_Friendly = "HUD_OBJ_C_FRIENDLY_" + id;
    const objC_FriendlyInner = "HUD_OBJ_C_FRIENDLY_INNER_" + id;
    const objC_Enemy = "HUD_OBJ_C_ENEMY_" + id;
    const objC_EnemyInner = "HUD_OBJ_C_ENEMY_INNER_" + id;

    const OBJ_Y = 70;
    const OBJ_SIZE = 46;
    const OBJ_INNER_SIZE = OBJ_SIZE - 8;
    const OBJ_SPACING = 90;
    const OBJ_LETTER_PLATE_SIZE = OBJ_SIZE - 14;
    const OBJ_LETTER_PLATE_COLOR = mod.CreateVector(0,0,0);
    const OBJ_LETTER_PLATE_ALPHA = 0;
    const LETTER_COLOR = mod.CreateVector(1,1,1);

    const COLOR_NEUTRAL = mod.CreateVector(0.39, 0.39, 0.39);
    const COLOR_NEUTRAL_INNER = mod.CreateVector(0, 0, 0);
    const COLOR_FRIENDLY = mod.CreateVector(0.45, 0.75, 1);
    const COLOR_FRIENDLY_INNER = mod.CreateVector(0.05, 0.2, 0.5);
    const COLOR_ENEMY = mod.CreateVector(1, 0.6, 0.6);
    const COLOR_ENEMY_INNER = mod.CreateVector(0.45, 0.05, 0.05);
    const NEUTRAL_ALPHA = 1;
    const NEUTRAL_INNER_ALPHA = 0.39;
    const FRIENDLY_INNER_ALPHA = 0.75;
    const ENEMY_INNER_ALPHA = 0.75;

    // =====================================================
    // CREATE ROOT
    // =====================================================

    mod.AddUIContainer(
        "HUD_ROOT_" + id,
        mod.CreateVector(0, 48, 0),
        mod.CreateVector(1200, 150, 0),
        mod.UIAnchor.TopCenter,
        mod.GetUIRoot(),
        true,
        8,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        player
    );

    const root = mod.FindUIWidgetWithName("HUD_ROOT_" + id);
    if (!root) return;
    // Early return avoids null-parent UI calls if root failed for any reason.

    // =====================================================
    // HUD VISUAL BUILD (STATIC CREATION PHASE)
    // =====================================================
    // From here down, widgets are only created once.
    // Runtime changes later happen through SetUITextLabel/SetUIWidgetSize/SetUIWidgetVisible.

    // --- BLUE SCORE BG ---
    mod.AddUIText(
        "HUD_BLUE_SCORE_BG_" + id,
        mod.CreateVector(-340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        5,
        mod.CreateVector(0.05,0.1,0.2),
        0.85,
        mod.UIBgFill.Solid,
        mod.Message(" "),
        0,
        mod.CreateVector(1,1,1),
        0,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIText(
        blueName,
        mod.CreateVector(-340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.score, gameState.team1Score),
        32,
        mod.CreateVector(0.3,0.6,1),
        1,
        mod.UIAnchor.Center,
        player
    );

    // --- RED SCORE BG ---
    mod.AddUIText(
        "HUD_RED_SCORE_BG_" + id,
        mod.CreateVector(340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        5,
        mod.CreateVector(0.2,0.05,0.05),
        0.85,
        mod.UIBgFill.Solid,
        mod.Message(" "),
        0,
        mod.CreateVector(1,1,1),
        0,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIText(
        redName,
        mod.CreateVector(340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.score, gameState.team2Score),
        32,
        mod.CreateVector(1,0.3,0.3),
        1,
        mod.UIAnchor.Center,
        player
    );

    // --- BAR BACKGROUNDS ---
    mod.AddUIText("HUD_BLUE_BAR_BG_" + id,
        mod.CreateVector(-145, 25, 0),
        mod.CreateVector(280, 20, 0),
        mod.UIAnchor.TopCenter, root, true, 4,
        mod.CreateVector(0,0,0), 0.35, mod.UIBgFill.Blur,
        mod.Message(" "), 0, mod.CreateVector(1,1,1), 0,
        mod.UIAnchor.Center, player);

    mod.AddUIText("HUD_RED_BAR_BG_" + id,
        mod.CreateVector(145, 25, 0),
        mod.CreateVector(280, 20, 0),
        mod.UIAnchor.TopCenter, root, true, 4,
        mod.CreateVector(0,0,0), 0.35, mod.UIBgFill.Blur,
        mod.Message(" "), 0, mod.CreateVector(1,1,1), 0,
        mod.UIAnchor.Center, player);

    // --- BAR FILLS ---
    mod.AddUIContainer(
        blueBarFillName,
        mod.CreateVector(305, 25, 0),
        mod.CreateVector(0, 20, 0),
        mod.UIAnchor.TopLeft,
        root,
        true,
        5,
        mod.CreateVector(0.2,0.55,1),
        1,
        mod.UIBgFill.Solid,
        player
    );

    mod.AddUIContainer(
        redBarFillName,
        mod.CreateVector(879, 25, 0),
        mod.CreateVector(0, 20, 0),
        mod.UIAnchor.TopLeft,
        root,
        true,
        5,
        mod.CreateVector(1,0.25,0.25),
        1,
        mod.UIBgFill.Solid,
        player
    );

// -----------------------------------------------------------------------------
// OBJECTIVE STACKS
// -----------------------------------------------------------------------------
// Each objective (A/B/C) uses three overlapping state widgets:
// neutral, friendly, enemy. Visibility toggles decide which color plate is shown.
// -----------------------------------------------------------------------------
// A STACK
// -----------------------------------------------------------------------------
// LETTER BACKING A
mod.AddUIText(
    "HUD_OBJ_LETTER_BG_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_LETTER_PLATE_SIZE, OBJ_LETTER_PLATE_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    11,
    OBJ_LETTER_PLATE_COLOR,
    OBJ_LETTER_PLATE_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// LETTER A
mod.AddUIText(
    "HUD_OBJ_LETTER_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    100, // stable depth to avoid projection offset/clipping
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_A),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

// LETTER B
mod.AddUIText(
    "HUD_OBJ_LETTER_BG_B_" + id,
    mod.CreateVector(0, OBJ_Y, 0),
    mod.CreateVector(OBJ_LETTER_PLATE_SIZE, OBJ_LETTER_PLATE_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    11,
    OBJ_LETTER_PLATE_COLOR,
    OBJ_LETTER_PLATE_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_B_" + id,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    100,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_B),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

// LETTER C
mod.AddUIText(
    "HUD_OBJ_LETTER_BG_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_LETTER_PLATE_SIZE, OBJ_LETTER_PLATE_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    11,
    OBJ_LETTER_PLATE_COLOR,
    OBJ_LETTER_PLATE_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    100,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_C),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);
// Neutral (default visible)
// Start with neutral visible so UI is valid before first ownership update pass.
mod.AddUIText(
    objA_Neutral,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    COLOR_NEUTRAL,
    NEUTRAL_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
mod.AddUIText(
    objA_NeutralInner,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    3,
    COLOR_NEUTRAL_INNER,
    NEUTRAL_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// Friendly
mod.AddUIText(
    objA_Friendly,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_FRIENDLY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
mod.AddUIText(
    objA_FriendlyInner,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_FRIENDLY_INNER,
    FRIENDLY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// Enemy
mod.AddUIText(
    objA_Enemy,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_ENEMY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
mod.AddUIText(
    objA_EnemyInner,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_ENEMY_INNER,
    ENEMY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);




// -----------------------------------------------------------------------------
// B STACK
// -----------------------------------------------------------------------------
mod.AddUIText(objB_Neutral,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    COLOR_NEUTRAL,
    NEUTRAL_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objB_NeutralInner,
    mod.CreateVector(0, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    3,
    COLOR_NEUTRAL_INNER,
    NEUTRAL_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objB_Friendly,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_FRIENDLY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objB_FriendlyInner,
    mod.CreateVector(0, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_FRIENDLY_INNER,
    FRIENDLY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objB_Enemy,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_ENEMY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);




// -----------------------------------------------------------------------------
// C STACK
// -----------------------------------------------------------------------------
mod.AddUIText(objC_Neutral,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    COLOR_NEUTRAL,
    NEUTRAL_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objC_NeutralInner,
    mod.CreateVector(OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    3,
    COLOR_NEUTRAL_INNER,
    NEUTRAL_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objC_Friendly,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_FRIENDLY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objB_EnemyInner,
    mod.CreateVector(0, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_ENEMY_INNER,
    ENEMY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objC_FriendlyInner,
    mod.CreateVector(OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_FRIENDLY_INNER,
    FRIENDLY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objC_Enemy,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_ENEMY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objC_EnemyInner,
    mod.CreateVector(OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_ENEMY_INNER,
    ENEMY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

// ---------------------------------------------------------------------------
// LETTER FRONT PASS
// ---------------------------------------------------------------------------
// Render letters last so they always stay visible over solid objective plates.
mod.AddUIText(
    "HUD_OBJ_LETTER_FRONT_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    12,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_A),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_FRONT_B_" + id,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    12,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_B),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_FRONT_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    12,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_C),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);




    // ===============================================================================================================================================================
    // STORE MAP LAST
    // ===============================================================================================================================================================

    playerHudMap.set(id, {
        blueScoreName: blueName,
        redScoreName: redName,
        blueBarFillName,
        redBarFillName,
        objA_Neutral,
        objA_NeutralInner,
        objA_Friendly,
        objA_FriendlyInner,
        objA_Enemy,
        objA_EnemyInner,
        objB_Neutral,
        objB_NeutralInner,
        objB_Friendly,
        objB_FriendlyInner,
        objB_Enemy,
        objB_EnemyInner,
        objC_Neutral,
        objC_NeutralInner,
        objC_Friendly,
        objC_FriendlyInner,
        objC_Enemy,
        objC_EnemyInner
    });
}

// -----------------------------------------------------------------------------
// TEAM SWITCH UI
// -----------------------------------------------------------------------------
// Team switch UI interaction/template approach adapted from:
// https://github.com/The0zzy/BF6-Portal-TeamSwitchUI
// Original Airsup integration/customization copyright (c) 2026 Ethan Mills.
/**
 * Builds per-player team-switch panel and input hint.
 *
 * Important:
 * - Widgets are created once and then shown/hidden.
 * - Button events are enabled for both ButtonDown and ButtonUp for robust click capture.
 */
function createTeamSwitchUi(player: mod.Player) {
    const id = mod.GetObjId(player);
    if (playerTeamSwitchUiMap.has(id)) return;

    const hintTextName = "HUD_TEAM_SWITCH_HINT_" + id;
    const panelName = "HUD_TEAM_SWITCH_PANEL_" + id;
    const panelLabelName = "HUD_TEAM_SWITCH_LABEL_" + id;
    const team1ButtonName = "HUD_TEAM_SWITCH_T1_" + id;
    const team2ButtonName = "HUD_TEAM_SWITCH_T2_" + id;
    const closeButtonName = "HUD_TEAM_SWITCH_CLOSE_" + id;
    const team1TextName = "HUD_TEAM_SWITCH_T1_TEXT_" + id;
    const team2TextName = "HUD_TEAM_SWITCH_T2_TEXT_" + id;
    const closeTextName = "HUD_TEAM_SWITCH_CLOSE_TEXT_" + id;

    mod.AddUIText(
        hintTextName,
        mod.CreateVector(20, 690, 0),
        mod.CreateVector(440, 24, 0),
        mod.UIAnchor.BottomLeft,
        mod.GetUIRoot(),
        true,
        5,
        mod.CreateVector(0, 0, 0),
        0.35,
        mod.UIBgFill.Solid,
        mod.Message(mod.stringkeys.TEAM_SWITCH_HINT),
        13,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIContainer(
        panelName,
        mod.CreateVector(20, 500, 0),
        mod.CreateVector(440, 150, 0),
        mod.UIAnchor.BottomLeft,
        mod.GetUIRoot(),
        false,
        6,
        mod.CreateVector(0, 0, 0),
        0.5,
        mod.UIBgFill.Blur,
        player
    );

    const panel = mod.FindUIWidgetWithName(panelName);
    if (!panel) return;

    mod.AddUIText(
        panelLabelName,
        mod.CreateVector(70, 14, 0),
        mod.CreateVector(300, 24, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        7,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.TEAM_SWITCH_LABEL),
        15,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIButton(
        team1ButtonName,
        mod.CreateVector(20, 50, 0),
        mod.CreateVector(180, 36, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        7,
        mod.CreateVector(0.1, 0.2, 0.4),
        0.95,
        mod.UIBgFill.Solid,
        true,
        mod.CreateVector(0.15, 0.35, 0.7),
        1,
        mod.CreateVector(0.12, 0.12, 0.12),
        0.6,
        mod.CreateVector(0.08, 0.2, 0.4),
        1,
        mod.CreateVector(0.2, 0.45, 0.85),
        1,
        mod.CreateVector(0.2, 0.45, 0.85),
        1,
        player
    );

    mod.AddUIText(
        team1TextName,
        mod.CreateVector(30, 56, 0),
        mod.CreateVector(160, 24, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        8,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.TEAM_SWITCH_JOIN_1),
        13,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIButton(
        team2ButtonName,
        mod.CreateVector(240, 50, 0),
        mod.CreateVector(180, 36, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        7,
        mod.CreateVector(0.4, 0.1, 0.1),
        0.95,
        mod.UIBgFill.Solid,
        true,
        mod.CreateVector(0.7, 0.15, 0.15),
        1,
        mod.CreateVector(0.12, 0.12, 0.12),
        0.6,
        mod.CreateVector(0.4, 0.1, 0.1),
        1,
        mod.CreateVector(0.85, 0.2, 0.2),
        1,
        mod.CreateVector(0.85, 0.2, 0.2),
        1,
        player
    );

    mod.AddUIText(
        team2TextName,
        mod.CreateVector(250, 56, 0),
        mod.CreateVector(160, 24, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        8,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.TEAM_SWITCH_JOIN_2),
        13,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIButton(
        closeButtonName,
        mod.CreateVector(130, 100, 0),
        mod.CreateVector(180, 34, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        7,
        mod.CreateVector(0.12, 0.12, 0.12),
        0.9,
        mod.UIBgFill.Solid,
        true,
        mod.CreateVector(0.2, 0.2, 0.2),
        1,
        mod.CreateVector(0.12, 0.12, 0.12),
        0.6,
        mod.CreateVector(0.1, 0.1, 0.1),
        1,
        mod.CreateVector(0.3, 0.3, 0.3),
        1,
        mod.CreateVector(0.3, 0.3, 0.3),
        1,
        player
    );

    mod.AddUIText(
        closeTextName,
        mod.CreateVector(140, 105, 0),
        mod.CreateVector(160, 24, 0),
        mod.UIAnchor.TopLeft,
        panel,
        false,
        8,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.TEAM_SWITCH_CLOSE),
        13,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        player
    );

    playerTeamSwitchUiMap.set(id, {
        hintTextName,
        panelName,
        panelLabelName,
        team1ButtonName,
        team2ButtonName,
        closeButtonName,
        team1TextName,
        team2TextName,
        closeTextName,
        panelVisible: false,
        tapCount: 0,
        lastTapTime: -1000,
        interactPoint: null,
        panelOpenedAt: -1000
    });

    const team1Button = mod.FindUIWidgetWithName(team1ButtonName);
    const team2Button = mod.FindUIWidgetWithName(team2ButtonName);
    const closeButton = mod.FindUIWidgetWithName(closeButtonName);
    if (team1Button) {
        mod.EnableUIButtonEvent(team1Button, mod.UIButtonEvent.ButtonDown, true);
        mod.EnableUIButtonEvent(team1Button, mod.UIButtonEvent.ButtonUp, true);
    }
    if (team2Button) {
        mod.EnableUIButtonEvent(team2Button, mod.UIButtonEvent.ButtonDown, true);
        mod.EnableUIButtonEvent(team2Button, mod.UIButtonEvent.ButtonUp, true);
    }
    if (closeButton) {
        mod.EnableUIButtonEvent(closeButton, mod.UIButtonEvent.ButtonDown, true);
        mod.EnableUIButtonEvent(closeButton, mod.UIButtonEvent.ButtonUp, true);
    }

    updateTeamSwitchButtonState(player);
}

/**
 * Utility for robust UI click routing.
 *
 * Some UI events can originate from child widgets (e.g., border/label).
 * This checks current widget and parents up to `maxDepth` for expected base names.
 */
function widgetOrAncestorMatchesName(
    startWidget: mod.UIWidget,
    expectedNames: string[],
    maxDepth: number = 8
): boolean {
    let current: mod.UIWidget | undefined = startWidget;
    for (let i = 0; i < maxDepth && current; i++) {
        const name = mod.GetUIWidgetName(current);
        for (let j = 0; j < expectedNames.length; j++) {
            const expected = expectedNames[j];
            if (name === expected || name === expected + "_BORDER" || name === expected + "_LABEL") {
                return true;
            }
        }
        current = mod.GetUIWidgetParent(current);
    }
    return false;
}

/**
 * Toggles team-switch panel visibility and synchronizes input mode.
 *
 * When visible:
 * - Enables UI input mode (cursor interactions).
 * - Ensures buttons are enabled and state is refreshed.
 *
 * When hidden:
 * - Disables UI input mode and returns control to gameplay.
 */
function setTeamSwitchPanelVisible(player: mod.Player, visible: boolean) {
    const id = mod.GetObjId(player);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui) return;

    const panel = mod.FindUIWidgetWithName(ui.panelName);
    const label = mod.FindUIWidgetWithName(ui.panelLabelName);
    const t1Button = mod.FindUIWidgetWithName(ui.team1ButtonName);
    const t2Button = mod.FindUIWidgetWithName(ui.team2ButtonName);
    const closeButton = mod.FindUIWidgetWithName(ui.closeButtonName);
    const t1Text = mod.FindUIWidgetWithName(ui.team1TextName);
    const t2Text = mod.FindUIWidgetWithName(ui.team2TextName);
    const closeText = mod.FindUIWidgetWithName(ui.closeTextName);

    if (panel) mod.SetUIWidgetVisible(panel, visible);
    if (label) mod.SetUIWidgetVisible(label, visible);
    if (t1Button) mod.SetUIWidgetVisible(t1Button, visible);
    if (t2Button) mod.SetUIWidgetVisible(t2Button, visible);
    if (closeButton) mod.SetUIWidgetVisible(closeButton, visible);
    if (t1Text) mod.SetUIWidgetVisible(t1Text, visible);
    if (t2Text) mod.SetUIWidgetVisible(t2Text, visible);
    if (closeText) mod.SetUIWidgetVisible(closeText, visible);

    ui.panelVisible = visible;
    ui.panelOpenedAt = visible ? mod.GetMatchTimeElapsed() : -1000;

    mod.EnableUIInputMode(visible, player);

    if (visible) {
        if (t1Button) mod.SetUIButtonEnabled(t1Button, true);
        if (t2Button) mod.SetUIButtonEnabled(t2Button, true);
        if (closeButton) mod.SetUIButtonEnabled(closeButton, true);
        updateTeamSwitchButtonState(player);
    }
}

/**
 * Legacy/local triple-tap counter tied to interact point callback path.
 * Opens/closes panel when 3 taps occur inside configured window.
 */
function processInteractTap(player: mod.Player) {
    const id = mod.GetObjId(player);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui) return;

    const now = mod.GetMatchTimeElapsed();

    if (now - ui.lastTapTime > TRIPLE_TAP_WINDOW_SECONDS) {
        ui.tapCount = 0;
    }

    ui.tapCount++;
    ui.lastTapTime = now;

    if (ui.tapCount >= 3) {
        ui.tapCount = 0;
        setTeamSwitchPanelVisible(player, !ui.panelVisible);
    }
}

/**
 * Deployment heuristic.
 * Portal type set here does not expose a direct "is deployed" API, so soldier states
 * are used to infer whether interact point management should be active.
 */
function isPlayerLikelyDeployed(player: mod.Player): boolean {
    return (
        mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) ||
        mod.GetSoldierState(player, mod.SoldierStateBool.IsDead) ||
        mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)
    );
}

/**
 * Spawns and enables a per-player interact point in front of the player (once).
 * Interact point is used as one of the team-switch trigger paths.
 */
function ensureTeamSwitchInteractPoint(player: mod.Player) {
    if (!player || !mod.IsPlayerValid(player)) return;
    if (!isPlayerLikelyDeployed(player)) return;

    const id = mod.GetObjId(player);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui) return;
    if (ui.interactPoint) return;

    const playerPosition = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
    const playerFacingDirection = mod.GetSoldierState(player, mod.SoldierStateVector.GetFacingDirection);
    if (!playerPosition || !playerFacingDirection) return;

    const interactPointPosition = mod.Add(
        mod.Add(playerPosition, playerFacingDirection),
        mod.CreateVector(0, 1.5, 0)
    );

    const interactPoint = mod.SpawnObject(
        mod.RuntimeSpawn_Common.InteractPoint,
        interactPointPosition,
        mod.CreateVector(0, 0, 0)
    ) as mod.InteractPoint;

    mod.EnableInteractPoint(interactPoint, true);
    ui.interactPoint = interactPoint;
}

/**
 * Best-effort cleanup of a player's interact point object.
 */
function removeTeamSwitchInteractPoint(playerOrId: mod.Player | number) {
    const id = mod.IsType(playerOrId, mod.Types.Player)
        ? mod.GetObjId(playerOrId as mod.Player)
        : (playerOrId as number);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui || !ui.interactPoint) return;

    try {
        mod.EnableInteractPoint(ui.interactPoint, false);
        mod.UnspawnObject(ui.interactPoint);
    } catch {
        // Best effort cleanup.
    }

    ui.interactPoint = null;
}

/**
 * Keeps team-switch buttons enabled/ready.
 * (This mode currently leaves both team buttons enabled by design.)
 */
function updateTeamSwitchButtonState(player: mod.Player) {
    const id = mod.GetObjId(player);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui) return;

    const t1Button = mod.FindUIWidgetWithName(ui.team1ButtonName);
    const t2Button = mod.FindUIWidgetWithName(ui.team2ButtonName);
    if (!t1Button || !t2Button) return;

    mod.SetUIButtonEnabled(t1Button, true);
    mod.SetUIButtonEnabled(t2Button, true);
}

/**
 * Forces return to deploy screen after team switch.
 * Double-call with short delay improves reliability across timing edges.
 */
async function forceUndeployPlayer(player: mod.Player): Promise<void> {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.UndeployPlayer(player);
    await mod.Wait(0.05);
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.UndeployPlayer(player);
}
/**
 * Objective icon state machine for one objective stack (A/B/C) from one player's POV.
 *
 * States:
 * - Neutral: shows neutral outer + neutral inner.
 * - Friendly: shows friendly outer + friendly inner.
 * - Enemy: shows enemy outer + enemy inner.
 *
 * The hard reset first guarantees mutually-exclusive visual states each tick.
 */
function updateSingleObjectiveVisibility(
    playerTeam: mod.Team,
    ownerTeam: mod.Team,
    neutralName: string,
    neutralInnerName: string,
    friendlyName: string,
    friendlyInnerName: string,
    enemyName: string,
    enemyInnerName: string
){
    // Resolve objective box visibility for neutral/friendly/enemy from this player's perspective.
    const neutral = mod.FindUIWidgetWithName(neutralName);
    const neutralInner = mod.FindUIWidgetWithName(neutralInnerName);
    const friendly = mod.FindUIWidgetWithName(friendlyName);
    const friendlyInner = mod.FindUIWidgetWithName(friendlyInnerName);
    const enemy = mod.FindUIWidgetWithName(enemyName);
    const enemyInner = mod.FindUIWidgetWithName(enemyInnerName);

    if (!neutral || !neutralInner || !friendly || !friendlyInner || !enemy || !enemyInner) return;

    // Hard reset first so only one state can be visible after this function.
    mod.SetUIWidgetVisible(neutral, false);
    mod.SetUIWidgetVisible(neutralInner, false);
    mod.SetUIWidgetVisible(friendly, false);
    mod.SetUIWidgetVisible(friendlyInner, false);
    mod.SetUIWidgetVisible(enemy, false);
    mod.SetUIWidgetVisible(enemyInner, false);

    // TRUE neutral detection
    if (
        !ownerTeam ||
        (!mod.Equals(ownerTeam, mod.GetTeam(1)) &&
         !mod.Equals(ownerTeam, mod.GetTeam(2)))
    ){
        mod.SetUIWidgetVisible(neutral, true);
        mod.SetUIWidgetVisible(neutralInner, true);
        return;
    }

    // If owner matches player team, show friendly color; otherwise show enemy color.
    if (mod.Equals(playerTeam, ownerTeam)){
        mod.SetUIWidgetVisible(friendly, true);
        mod.SetUIWidgetVisible(friendlyInner, true);
    } else {
        mod.SetUIWidgetVisible(enemy, true);
        mod.SetUIWidgetVisible(enemyInner, true);
    }
}

/**
 * Batch objective icon refresh for all players.
 * Resolves current owners once, then applies per-player perspective mapping.
 */
function updateAllObjectiveIcons(){

    // Refresh A/B/C objective ownership visuals for every active player HUD.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    // Resolve current owners once per tick, then apply to all players.
    const ownerA = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(100));
    const ownerB = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(101));
    const ownerC = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(102));

    for (let i = 0; i < count; i++){

        const player = mod.ValueInArray(players, i) as mod.Player;
        const id = mod.GetObjId(player);

        const hud = playerHudMap.get(id);
        if (!hud) continue;

        const playerTeam = mod.GetTeam(player);

        updateSingleObjectiveVisibility(
            playerTeam,
            ownerA,
            hud.objA_Neutral,
            hud.objA_NeutralInner,
            hud.objA_Friendly,
            hud.objA_FriendlyInner,
            hud.objA_Enemy,
            hud.objA_EnemyInner
        );

        updateSingleObjectiveVisibility(
            playerTeam,
            ownerB,
            hud.objB_Neutral,
            hud.objB_NeutralInner,
            hud.objB_Friendly,
            hud.objB_FriendlyInner,
            hud.objB_Enemy,
            hud.objB_EnemyInner
        );

        updateSingleObjectiveVisibility(
            playerTeam,
            ownerC,
            hud.objC_Neutral,
            hud.objC_NeutralInner,
            hud.objC_Friendly,
            hud.objC_FriendlyInner,
            hud.objC_Enemy,
            hud.objC_EnemyInner
        );
    }
}



// -----------------------------------------------------------------------------
// PLAYER EVENTS
// -----------------------------------------------------------------------------
/**
 * Join hook: initialize player and immediately sync HUD/objective visuals.
 */
export function OnPlayerJoinGame(player: mod.Player){
    initializePlayerState(player);
    // Force immediate sync so late-join players see correct score/objective states instantly.
    updateAllHudScores();
    updateAllObjectiveIcons();
}

/**
 * Per-player initialization entry point used by startup and join flow.
 */
function initializePlayerState(player: mod.Player){
    // Initialize per-player stat variables when they join.
    mod.SetVariable(mod.ObjectVariable(player, playerKills), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerCaptures), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerScore), 0);

    updatePlayerScoreBoard(player);
    createHUD(player);
    createTeamSwitchUi(player);
    ensureTeamSwitchInteractPoint(player);
}

/**
 * Writes tracked custom stats into this player's scoreboard row.
 */
function updatePlayerScoreBoard(player: mod.Player){
    // Push current custom stats into the player's scoreboard row.
    mod.SetScoreboardPlayerValues(
        player,
        mod.GetVariable(mod.ObjectVariable(player, playerScore)),
        mod.GetVariable(mod.ObjectVariable(player, playerKills)),
        mod.GetVariable(mod.ObjectVariable(player, playerDeaths)),
        mod.GetVariable(mod.ObjectVariable(player, playerCaptures)),
    );
}

/**
 * Kill event pathway (primary when event is available in this runtime).
 */
export function OnPlayerEarnKill(player: mod.Player){
    awardKillAndScore(player);
}

/**
 * Death event pathway.
 * - Always increments death for the victim.
 * - Optionally awards kill if killer is provided by runtime.
 */
export function OnPlayerDied(player: mod.Player, killer?: mod.Player){
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerDeaths)),1));
    updatePlayerScoreBoard(player);

    // Fallback path for experiences where killer is provided on death event.
    if (killer && mod.IsPlayerValid(killer) && !mod.Equals(killer, player)){
        awardKillAndScore(killer);
    }
}

/**
 * Centralized kill credit helper.
 * Consolidating this logic reduces divergence between kill/death event pathways.
 */
function awardKillAndScore(player: mod.Player){
    if (!player || !mod.IsPlayerValid(player)) return;

    mod.SetVariable(mod.ObjectVariable(player, playerKills),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerKills)),1));
    mod.SetVariable(mod.ObjectVariable(player, playerScore),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerScore)),100));
    updatePlayerScoreBoard(player);
}

/**
 * Capture event reward pipeline.
 * Awards captures/score to valid point owners and refreshes objective icon state.
 */
export function OnCapturePointCaptured(capturePoint: mod.CapturePoint){

    // Reward players on the captured point and refresh objective ownership widgets.
    const playersOnPoint = mod.GetPlayersOnPoint(capturePoint);
    const currentOwner = mod.GetCurrentOwnerTeam(capturePoint);
    const totalPlayersOnPoint = mod.CountOf(playersOnPoint);

    for (let i = 0; i < totalPlayersOnPoint; i++){

        const player = mod.ValueInArray(playersOnPoint, i);

        if (mod.Equals(mod.GetTeam(player), currentOwner)){

            mod.SetVariable(mod.ObjectVariable(player, playerCaptures),
                mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerCaptures)),1));

            mod.SetVariable(mod.ObjectVariable(player, playerScore),
                mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerScore)),200));

            updatePlayerScoreBoard(player);
            // Objective ownership changed, so refresh objective widgets after capture rewards.
            updateAllObjectiveIcons();
         }
    }
}

export function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
) {
    // Accept both edge events but apply actions on ButtonUp only.
    // This avoids accidental double-actions from press+release pairs.
    const isButtonUp = mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonUp);
    const isButtonDown = mod.Equals(eventUIButtonEvent, mod.UIButtonEvent.ButtonDown);
    if (!isButtonUp && !isButtonDown) return;

    const id = mod.GetObjId(eventPlayer);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui || !ui.panelVisible) return;

    const clickedName = mod.GetUIWidgetName(eventUIWidget);
    const t1Button = mod.FindUIWidgetWithName(ui.team1ButtonName);
    const t2Button = mod.FindUIWidgetWithName(ui.team2ButtonName);
    const closeButton = mod.FindUIWidgetWithName(ui.closeButtonName);

    // Resolve click target robustly: exact button, text, or descendant path.
    const isCloseClick =
        clickedName === ui.closeButtonName ||
        clickedName === ui.closeTextName ||
        (!!closeButton && mod.Equals(eventUIWidget, closeButton)) ||
        widgetOrAncestorMatchesName(eventUIWidget, [ui.closeButtonName, ui.closeTextName]);
    if (isCloseClick) {
        if (!isButtonUp) return;
        setTeamSwitchPanelVisible(eventPlayer, false);
        return;
    }

    const isTeam1Click =
        clickedName === ui.team1ButtonName ||
        clickedName === ui.team1TextName ||
        (!!t1Button && mod.Equals(eventUIWidget, t1Button)) ||
        widgetOrAncestorMatchesName(eventUIWidget, [ui.team1ButtonName, ui.team1TextName]);
    if (isTeam1Click) {
        if (!isButtonUp) return;
        mod.SetTeam(eventPlayer, mod.GetTeam(1));
        updateTeamSwitchButtonState(eventPlayer);
        setTeamSwitchPanelVisible(eventPlayer, false);
        void forceUndeployPlayer(eventPlayer);
        return;
    }

    const isTeam2Click =
        clickedName === ui.team2ButtonName ||
        clickedName === ui.team2TextName ||
        (!!t2Button && mod.Equals(eventUIWidget, t2Button)) ||
        widgetOrAncestorMatchesName(eventUIWidget, [ui.team2ButtonName, ui.team2TextName]);
    if (isTeam2Click) {
        if (!isButtonUp) return;
        mod.SetTeam(eventPlayer, mod.GetTeam(2));
        updateTeamSwitchButtonState(eventPlayer);
        setTeamSwitchPanelVisible(eventPlayer, false);
        void forceUndeployPlayer(eventPlayer);
    }
}

/**
 * Team switch callback used to keep UI button state in sync with actual team.
 */
export function OnPlayerSwitchTeam(eventPlayer: mod.Player, eventTeam: mod.Team) {
    updateTeamSwitchButtonState(eventPlayer);
}

/**
 * Per-player tick hook.
 *
 * Responsibilities:
 * - Triple-tap interact detection for opening/closing team-switch panel.
 * - Safety auto-close timeout to prevent stuck UI input mode.
 * - Interact point lifecycle management based on deploy state.
 */
export function OngoingPlayer(eventPlayer: mod.Player) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

    if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
        const id = mod.GetObjId(eventPlayer);
        const ui = playerTeamSwitchUiMap.get(id);
        if (ui) {
            setTeamSwitchPanelVisible(eventPlayer, !ui.panelVisible);
        }
    }

    const id = mod.GetObjId(eventPlayer);
    const ui = playerTeamSwitchUiMap.get(id);
    if (ui && ui.panelVisible && mod.GetMatchTimeElapsed() - ui.panelOpenedAt > 15) {
        setTeamSwitchPanelVisible(eventPlayer, false);
    }

    if (isPlayerLikelyDeployed(eventPlayer)) {
        ensureTeamSwitchInteractPoint(eventPlayer);
    } else {
        removeTeamSwitchInteractPoint(eventPlayer);
    }
}

/**
 * Interact point callback path for triple-tap handling.
 */
export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const id = mod.GetObjId(eventPlayer);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui || !ui.interactPoint) return;

    if (mod.GetObjId(eventInteractPoint) !== mod.GetObjId(ui.interactPoint)) return;
    processInteractTap(eventPlayer);
}

