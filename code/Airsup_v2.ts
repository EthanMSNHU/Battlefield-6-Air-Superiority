/**
 * Airsup_v2
 * Adds the first per-player HUD layer on top of the core Air Sup scoring and stat systems.
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

// HUD TRACKING
let hudCreated: number[] = [];

// -----------------------------------------------------------------------------
// INITIALIZE GAME MODE
// -----------------------------------------------------------------------------
export async function OnGameModeStarted() {

    // Reset per-match HUD state.
    hudCreated = [];

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

    mod.SetGameModeScore(mod.GetTeam(1),0);
    mod.SetGameModeScore(mod.GetTeam(2),0);

    setUpScoreBoard();

    // Build HUD for players already present when the mode starts.
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);
    for (let i = 0; i < count; i++){
        const player = mod.ValueInArray(players, i) as mod.Player;
        createHUD(player);
    }

    // Main mode tick: update tickets and scoreboard once per second.
    while(mod.GetMatchTimeRemaining() > 0) {

        await mod.Wait(1);

        updateTeamScores();
        updateScoreBoardTotal();
    }
}

// -----------------------------------------------------------------------------
// SCOREBOARD (UNCHANGED)
// -----------------------------------------------------------------------------
function updateScoreBoardTotal(){
    // Pull live team scores and mirror them into the scoreboard header.
    const score1 = mod.GetGameModeScore(mod.GetTeam(1));
    const score2 = mod.GetGameModeScore(mod.GetTeam(2));
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.score, score1),
        mod.Message(mod.stringkeys.score, score2)
    );
}


function setUpScoreBoard(){
    // Define custom 2-team scoreboard layout and column labels.
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.score, 0),
        mod.Message(mod.stringkeys.score, 0)
    );
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.SBHead1),
        mod.Message(mod.stringkeys.SBHead2),
        mod.Message(mod.stringkeys.SBHead3),
        mod.Message(mod.stringkeys.SBHead4),
    );
    mod.SetScoreboardColumnWidths(10,10,10,10);
}

// -----------------------------------------------------------------------------
// TEAM SCORING (UNCHANGED)
// -----------------------------------------------------------------------------
function getSecondsPerPoint(pointsHeld: number): number{
    // Ticket gain speed based on how many objectives a team owns.
    if (pointsHeld === 3) return 1;
    else if(pointsHeld == 2) return 5;
    else if(pointsHeld == 1) return 10;
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

    // Award score when each team reaches its current interval.
    if (team1ScoreTimer >= team1Rate && team1Rate > 0){
        team1ScoreTimer = 0;
        mod.SetGameModeScore(mod.GetTeam(1),
            mod.GetGameModeScore(mod.GetTeam(1)) + 1
        );
    }

    if (team2ScoreTimer >= team2Rate && team2Rate > 0){
        team2ScoreTimer = 0;
        mod.SetGameModeScore(mod.GetTeam(2),
            mod.GetGameModeScore(mod.GetTeam(2)) + 1
        );
    }
}


// -----------------------------------------------------------------------------
// HUD CREATION (VISUAL ONLY)
// -----------------------------------------------------------------------------
function createHUD(player: mod.Player){

    // Use object id to create unique widget names per player.
    const id = mod.GetObjId(player);

    // Prevent duplicate HUD creation for the same player.
    if (hudCreated.includes(id)) return;

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

    // Blue score box (left side).
    mod.AddUIText(
        "HUD_BLUE_SCORE_" + id,
        mod.CreateVector(-340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0.45,
        mod.UIBgFill.Blur,
        mod.Message(mod.stringkeys.score, 0),
        32,
        mod.CreateVector(0.3,0.6,1),
        1,
        mod.UIAnchor.Center,
        player
    );

    // Red score box (right side).
    mod.AddUIText(
        "HUD_RED_SCORE_" + id,
        mod.CreateVector(340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0.45,
        mod.UIBgFill.Blur,
        mod.Message(mod.stringkeys.score, 0),
        32,
        mod.CreateVector(1,0.3,0.3),
        1,
        mod.UIAnchor.Center,
        player
    );

    // Static bar backplates (visual only in v2).
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
        mod.Message(""),
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
        mod.Message(""),
        0,
        mod.CreateVector(1,1,1),
        0,
        mod.UIAnchor.Center,
        player
    );

    hudCreated.push(id);
}


// -----------------------------------------------------------------------------
// PLAYER EVENTS (UNCHANGED LOGIC)
// -----------------------------------------------------------------------------
export function OnPlayerJoinGame(eventPlayer: mod.Player){

    // Initialize per-player stats when they enter the match.
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerKills), 0);
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerDeaths),0 );
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerCaptures), 0);
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerScore), 0);

    updatePlayerScoreBoard(eventPlayer);

    createHUD(eventPlayer);
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


export function OnPlayerEarnKill(eventPlayer: mod.Player){
    // Reward kill and score, then refresh the row.
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerKills),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerKills)),1));
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerScore),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerScore)),100));
    updatePlayerScoreBoard(eventPlayer);
}


export function OnPlayerDied(eventPlayer: mod.Player){
    // Track deaths and refresh the row.
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerDeaths),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerDeaths)),1));
    updatePlayerScoreBoard(eventPlayer);
}


export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint){

    // Reward players currently on the point if their team owns it after capture.
    const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
    const currentOwner = mod.GetCurrentOwnerTeam(eventCapturePoint);
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

