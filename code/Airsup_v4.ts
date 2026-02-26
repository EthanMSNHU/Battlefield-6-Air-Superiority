/**
 * Airsup_v4
 * Stabilizes HUD updates using authoritative team state and setter-based widget updates.
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

// Authoritative state
// Local source of truth for team scores; HUD and scoreboard headers read from this.
let gameState = {
    team1Score: 0,
    team2Score: 0
};

// HUD MAP (store widget names only)
// Per-player registry of widget names so updates use setters instead of re-creating UI.
interface PlayerHud {
    blueScoreName: string;
    redScoreName: string;
}

let playerHudMap: Map<number, PlayerHud> = new Map();


// -----------------------------------------------------------------------------
// INITIALIZE GAME MODE
// -----------------------------------------------------------------------------
export async function OnGameModeStarted() {

    // Reset timers and authoritative score state at match start.
    team1ScoreTimer = 0;
    team2ScoreTimer = 0;

    gameState.team1Score = 0;
    gameState.team2Score = 0;

    // Configure the three capture points used by this mode.
    let capturePointA = mod.GetCapturePoint(100);
    let capturePointB = mod.GetCapturePoint(101);
    let capturePointC = mod.GetCapturePoint(102);

    mod.EnableGameModeObjective(capturePointA, true);
    mod.EnableGameModeObjective(capturePointB, true);
    mod.EnableGameModeObjective(capturePointC, true);

    mod.SetCapturePointCapturingTime(capturePointA,2.5);
    mod.SetCapturePointNeutralizationTime(capturePointA,2.5);
    mod.SetCapturePointCapturingTime(capturePointB,2.5);
    mod.SetCapturePointNeutralizationTime(capturePointB,2.5);
    mod.SetCapturePointCapturingTime(capturePointC,2.5);
    mod.SetCapturePointNeutralizationTime(capturePointC,2.5);

    mod.SetMaxCaptureMultiplier(capturePointA, 1);
    mod.SetMaxCaptureMultiplier(capturePointB, 1);
    mod.SetMaxCaptureMultiplier(capturePointC, 1);

    mod.SetGameModeScore(mod.GetTeam(1), 0);
    mod.SetGameModeScore(mod.GetTeam(2), 0);

    // Initialize scoreboard and team header labels.
    setUpScoreBoard();
    updateScoreBoardHeader();

    // Main mode tick: update tickets once per second.
    while(mod.GetMatchTimeRemaining() > 0) {
        await mod.Wait(1);
        updateTeamScores();
    }
}


// -----------------------------------------------------------------------------
// SCOREBOARD
// -----------------------------------------------------------------------------
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
function getSecondsPerPoint(pointsHeld: number): number{
    // Ticket gain speed based on how many objectives a team owns.
    if (pointsHeld === 3) return 1;
    if (pointsHeld === 2) return 5;
    if (pointsHeld === 1) return 10;
    return 0;
}

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
function updateAllHudScores(){

    // Update each player's left/right HUD score labels by team perspective.
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
        // Only label text is updated here; no widget creation happens in this update path.
    }
}

// -----------------------------------------------------------------------------
// HUD CREATION (CREATE ONCE)
// -----------------------------------------------------------------------------
function createHUD(player: mod.Player){

    // Use object id for unique per-player widget names.
    const id = mod.GetObjId(player);
    // Prevent duplicate HUD creation for the same player.
    if (playerHudMap.has(id)) return;

    // Root container for all custom HUD widgets.
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

    const blueName = "HUD_BLUE_SCORE_" + id;
    const redName = "HUD_RED_SCORE_" + id;

    // BLUE SCORE BACKGROUND
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

    // BLUE SCORE TEXT
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

    // RED SCORE BACKGROUND
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

    // RED SCORE TEXT
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
    // =========================
// STATIC BAR BACKPLATES
// -----------------------------------------------------------------------------
mod.AddUIText(
    "HUD_BLUE_BAR_BG_" + id,
    mod.CreateVector(-145, 25, 0),
    mod.CreateVector(280, 20, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    4,
    mod.CreateVector(0,0,0),
    0.35,
    mod.UIBgFill.Blur,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_RED_BAR_BG_" + id,
    mod.CreateVector(145, 25, 0),
    mod.CreateVector(280, 20, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    4,
    mod.CreateVector(0,0,0),
    0.35,
    mod.UIBgFill.Blur,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
// -----------------------------------------------------------------------------
// OBJECTIVE BOXES + LETTERS
// -----------------------------------------------------------------------------
const OBJ_Y = 70;
const OBJ_SIZE = 46;
const OBJ_SPACING = 90;
const OBJ_BG_COLOR = mod.CreateVector(0.15, 0.15, 0.15);
const LETTER_COLOR = mod.CreateVector(1,1,1);

// BOX A
mod.AddUIText(
    "HUD_OBJ_BOX_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    OBJ_BG_COLOR,
    0.8,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// BOX B
mod.AddUIText(
    "HUD_OBJ_BOX_B_" + id,
    mod.CreateVector(0, OBJ_Y, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    OBJ_BG_COLOR,
    0.8,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// BOX C
mod.AddUIText(
    "HUD_OBJ_BOX_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    OBJ_BG_COLOR,
    0.8,
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
    mod.CreateVector(-OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    15,
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
    "HUD_OBJ_LETTER_B_" + id,
    mod.CreateVector(0, OBJ_Y, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    15,
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
    "HUD_OBJ_LETTER_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    15,
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

    // Store only the widgets that need runtime mutation.
    playerHudMap.set(id, {
        blueScoreName: blueName,
        redScoreName: redName
    });
}

// -----------------------------------------------------------------------------
// PLAYER EVENTS (RESTORED EXACT LOGIC)
// -----------------------------------------------------------------------------
export function OnPlayerJoinGame(player: mod.Player){

    const id = mod.GetObjId(player);

    // Initialize per-player stat variables when they join.
    mod.SetVariable(mod.ObjectVariable(player, playerKills), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerCaptures), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerScore), 0);

    updatePlayerScoreBoard(player);
    createHUD(player);
    updateAllHudScores();
}


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


export function OnPlayerEarnKill(player: mod.Player){
    // Reward kill and score, then refresh the row.
    mod.SetVariable(mod.ObjectVariable(player, playerKills),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerKills)),1));
    mod.SetVariable(mod.ObjectVariable(player, playerScore),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerScore)),100));
    updatePlayerScoreBoard(player);
}


export function OnPlayerDied(player: mod.Player){
    // Track deaths and refresh the row.
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerDeaths)),1));
    updatePlayerScoreBoard(player);
}


export function OnCapturePointCaptured(capturePoint: mod.CapturePoint){

    // Reward players currently on the point if their team owns it after capture.
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
        }
    }
}

