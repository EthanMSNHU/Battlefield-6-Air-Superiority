//#region Initialize Game Mode
// -----------------------------------------------------------------------------
// INITIALIZE GAME MODE
// -----------------------------------------------------------------------------
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

    mod.SetCapturePointCapturingTime(capturePointA,3.5);
    mod.SetCapturePointNeutralizationTime(capturePointA,3.5);
    mod.SetCapturePointCapturingTime(capturePointB,3.5);
    mod.SetCapturePointNeutralizationTime(capturePointB,3.5);
    mod.SetCapturePointCapturingTime(capturePointC,3.5);
    mod.SetCapturePointNeutralizationTime(capturePointC,3.5);

    mod.SetMaxCaptureMultiplier(capturePointA, 1);
    mod.SetMaxCaptureMultiplier(capturePointB, 1);
    mod.SetMaxCaptureMultiplier(capturePointC, 1);

    mod.SetGameModeScore(mod.GetTeam(1), 0);
    mod.SetGameModeScore(mod.GetTeam(2), 0);
    mod.SetGameModeTargetScore(GAME_MODE_TARGET_SCORE);

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
//#endregion
