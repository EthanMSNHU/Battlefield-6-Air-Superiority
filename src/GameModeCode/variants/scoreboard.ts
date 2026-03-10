//#region Scoreboard
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
//#endregion
