//#region Team Scoring
// -----------------------------------------------------------------------------
// TEAM SCORING
// -----------------------------------------------------------------------------
function getSecondsPerPoint(pointsHeld: number): number{
    // Ticket gain speed based on how many objectives a team owns.
    if (pointsHeld === 3) return 1;
    if (pointsHeld === 2) return 3;
    if (pointsHeld === 1) return 6;
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
//#endregion
