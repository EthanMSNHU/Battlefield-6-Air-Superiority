//#region Objective Icon Updates
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
//#endregion
