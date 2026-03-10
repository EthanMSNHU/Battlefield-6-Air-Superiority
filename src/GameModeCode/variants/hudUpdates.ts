//#region HUD Updates
// -----------------------------------------------------------------------------
// HUD UPDATE (SETTERS ONLY)
// -----------------------------------------------------------------------------
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
    // MAX_SCORE defines full bar length; values above target continue beyond full width.

    const MAX_SCORE = GAME_MODE_TARGET_SCORE;
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
//#endregion
