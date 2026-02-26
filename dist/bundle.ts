// --- BUNDLED TYPESCRIPT OUTPUT ---
// @ts-nocheck

// --- SOURCE: code\Airsup_v4.ts ---
// ============================================================
// GAME MODE VARIABLES
// ============================================================

const playerKills = 0;
const playerDeaths = 1;
const playerScore = 2;
const playerCaptures = 3;

let team1ScoreTimer = 0;
let team2ScoreTimer = 0;

// ============================================================
// HUD TRACKING
// ============================================================

interface PlayerHud {
    blueTextName: string;
    redTextName: string;
}

let playerHudMap: { [key: number]: PlayerHud } = {};

// ============================================================
// INITIALIZE GAME MODE
// ============================================================

export async function OnGameModeStarted() {

    playerHudMap = {};

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

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++){
        const player = mod.ValueInArray(players, i) as mod.Player;
        createHUD(player);
    }

    while(mod.GetMatchTimeRemaining() > 0) {

        await mod.Wait(1);

        updateTeamScores();
        updateScoreBoardTotal();
    }
}

// ============================================================
// SCOREBOARD
// ============================================================

function updateScoreBoardTotal(){
    const score1 = mod.GetGameModeScore(mod.GetTeam(1));
    const score2 = mod.GetGameModeScore(mod.GetTeam(2));

    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.score, score1),
        mod.Message(mod.stringkeys.score, score2)
    );
}

function setUpScoreBoard(){
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

// ============================================================
// TEAM SCORING
// ============================================================

function getSecondsPerPoint(pointsHeld: number): number{
    if (pointsHeld === 3) return 1;
    else if(pointsHeld == 2) return 5;
    else if(pointsHeld == 1) return 10;
    return 0;
}

function updateTeamScores(){

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

    team1ScoreTimer++;
    team2ScoreTimer++;

    const team1Rate = getSecondsPerPoint(team1PointsHeld);
    const team2Rate = getSecondsPerPoint(team2PointsHeld);

    let scoreChanged = false;

    if (team1ScoreTimer >= team1Rate && team1Rate > 0){
        team1ScoreTimer = 0;
        mod.SetGameModeScore(mod.GetTeam(1), mod.GetGameModeScore(mod.GetTeam(1)) + 1);
        scoreChanged = true;
    }

    if (team2ScoreTimer >= team2Rate && team2Rate > 0){
        team2ScoreTimer = 0;
        mod.SetGameModeScore(mod.GetTeam(2), mod.GetGameModeScore(mod.GetTeam(2)) + 1);
        scoreChanged = true;
    }

    if (scoreChanged){
        refreshAllPlayerHUDScores();
    }
}

// ============================================================
// HUD REFRESH
// ============================================================

function refreshAllPlayerHUDScores() {

    const team1Score = mod.GetGameModeScore(mod.GetTeam(1));
    const team2Score = mod.GetGameModeScore(mod.GetTeam(2));

    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {

        const player = mod.ValueInArray(players, i) as mod.Player;
        const id = mod.GetObjId(player);

        const root = mod.FindUIWidgetWithName("HUD_ROOT_" + id);
        if (!root) continue;

        const playerTeam = mod.GetTeam(player);

        let friendlyScore;
        let enemyScore;

        if (mod.Equals(playerTeam, mod.GetTeam(1))) {
            friendlyScore = team1Score;
            enemyScore = team2Score;
        } else {
            friendlyScore = team2Score;
            enemyScore = team1Score;
        }

        mod.AddUIText(
            "HUD_BLUE_SCORE_TEXT_" + id,
            mod.CreateVector(-340, 12, 0),
            mod.CreateVector(90, 45, 0),
            mod.UIAnchor.TopCenter,
            root,
            true,
            6,
            mod.CreateVector(0,0,0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.score, friendlyScore),
            32,
            mod.CreateVector(0.3,0.6,1),
            1,
            mod.UIAnchor.Center,
            player
        );

        mod.AddUIText(
            "HUD_RED_SCORE_TEXT_" + id,
            mod.CreateVector(340, 12, 0),
            mod.CreateVector(90, 45, 0),
            mod.UIAnchor.TopCenter,
            root,
            true,
            6,
            mod.CreateVector(0,0,0),
            0,
            mod.UIBgFill.None,
            mod.Message(mod.stringkeys.score, enemyScore),
            32,
            mod.CreateVector(1,0.3,0.3),
            1,
            mod.UIAnchor.Center,
            player
        );
    }
}

// ============================================================
// HUD CREATION
// ============================================================

function createHUD(player: mod.Player){

    const id = mod.GetObjId(player);
    if (playerHudMap[id]) return;

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

    mod.AddUIText(
        "HUD_BLUE_SCORE_TEXT_" + id,
        mod.CreateVector(-340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.score, 0),
        32,
        mod.CreateVector(0.3,0.6,1),
        1,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIText(
        "HUD_RED_SCORE_TEXT_" + id,
        mod.CreateVector(340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.score, 0),
        32,
        mod.CreateVector(1,0.3,0.3),
        1,
        mod.UIAnchor.Center,
        player
    );

    playerHudMap[id] = { blueTextName: "", redTextName: "" };
}

// ============================================================
// PLAYER EVENTS
// ============================================================

export function OnPlayerJoinGame(eventPlayer: mod.Player){

    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerKills), 0);
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerDeaths), 0);
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerCaptures), 0);
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerScore), 0);

    updatePlayerScoreBoard(eventPlayer);
    createHUD(eventPlayer);
}

function updatePlayerScoreBoard(player: mod.Player){
    mod.SetScoreboardPlayerValues(
        player,
        mod.GetVariable(mod.ObjectVariable(player, playerScore)),
        mod.GetVariable(mod.ObjectVariable(player, playerKills)),
        mod.GetVariable(mod.ObjectVariable(player, playerDeaths)),
        mod.GetVariable(mod.ObjectVariable(player, playerCaptures)),
    );
}

export function OnPlayerEarnKill(eventPlayer: mod.Player){
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerKills),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerKills)),1));
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerScore),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerScore)),100));
    updatePlayerScoreBoard(eventPlayer);
}

export function OnPlayerDied(eventPlayer: mod.Player){
    mod.SetVariable(mod.ObjectVariable(eventPlayer, playerDeaths),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerDeaths)),1));
    updatePlayerScoreBoard(eventPlayer);
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint){

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
