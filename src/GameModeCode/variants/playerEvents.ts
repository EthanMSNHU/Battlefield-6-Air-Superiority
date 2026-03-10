//#region Player Events
// -----------------------------------------------------------------------------
// PLAYER EVENTS
// -----------------------------------------------------------------------------
export function OnPlayerJoinGame(player: mod.Player){
    // Fresh join should not inherit stale red-zone state.
    clearRedZoneStateForPlayer(player);
    initializePlayerState(player);
    // Force immediate sync so late-join players see correct score/objective states instantly.
    updateAllHudScores();
    updateAllObjectiveIcons();
    updatePlayerCaptureProgressHud(player);
}

function initializePlayerState(player: mod.Player){
    // Initialize per-player stat variables when they join.
    mod.SetVariable(mod.ObjectVariable(player, playerKills), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerCaptures), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerScore), 0);

    updatePlayerScoreBoard(player);
    createHUD(player);
    // Pre-build red-zone warning UI once so first violation shows instantly.
    ensureRedZoneWarningUi(player);
    createTeamSwitchUi(player);
    ensureTeamSwitchInteractPoint(player);
    updatePlayerCaptureProgressHud(player);
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
    awardKillAndScore(player);
}

export function OnPlayerDied(player: mod.Player, killer?: mod.Player){
    // Death clears any active red-zone timer/overlay.
    clearRedZoneStateForPlayer(player);
    // Track deaths and refresh the row.
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerDeaths)),1));
    updatePlayerScoreBoard(player);

    // Fallback path for experiences where killer is provided on death event.
    if (killer && mod.IsPlayerValid(killer) && !mod.Equals(killer, player)){
        awardKillAndScore(killer);
    }
}

function awardKillAndScore(player: mod.Player){
    if (!player || !mod.IsPlayerValid(player)) return;

    mod.SetVariable(mod.ObjectVariable(player, playerKills),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerKills)),1));
    mod.SetVariable(mod.ObjectVariable(player, playerScore),
        mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerScore)),100));
    updatePlayerScoreBoard(player);
}

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
            updatePlayerCaptureProgressHud(player);
         }
    }
}

export function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
) {
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

export function OnPlayerSwitchTeam(eventPlayer: mod.Player, eventTeam: mod.Team) {
    // Team switch invalidates current red-zone context and countdown.
    clearRedZoneStateForPlayer(eventPlayer);
    updateTeamSwitchButtonState(eventPlayer);
    hidePlayerCaptureProgressHud(eventPlayer);
    updatePlayerCaptureProgressHud(eventPlayer);
}

export function OnPlayerEnterAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!eventAreaTrigger) return;

    const triggerId = mod.GetObjId(eventAreaTrigger);
    if (!isRedZoneTrigger(triggerId)) return;

    if (!isEnemyInsideRedZone(eventPlayer, triggerId)) {
        // Friendly re-entry into own HQ zone should always clear warning/timers.
        clearRedZoneStateForPlayer(eventPlayer);
        return;
    }

    // Enemy entered opposing HQ zone; start countdown-to-destruction flow.
    startRedZoneCountdownForPlayer(eventPlayer, triggerId);
}

export function OnPlayerExitAreaTrigger(eventPlayer: mod.Player, eventAreaTrigger: mod.AreaTrigger) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;
    if (!eventAreaTrigger) return;

    const triggerId = mod.GetObjId(eventAreaTrigger);
    if (!isRedZoneTrigger(triggerId)) return;

    const playerId = mod.GetObjId(eventPlayer);
    const state = playerRedZoneStateMap.get(playerId);
    if (!state) return;
    if (state.zoneTriggerId !== triggerId) return;

    // Leaving the active violating zone cancels timer and hides warning overlay.
    clearRedZoneStateForPlayer(playerId);
}

export function OngoingPlayer(eventPlayer: mod.Player) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

    updatePlayerCaptureProgressHud(eventPlayer);

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
        hidePlayerCaptureProgressHud(eventPlayer);
        removeTeamSwitchInteractPoint(eventPlayer);
    }
}

export function OnPlayerInteract(eventPlayer: mod.Player, eventInteractPoint: mod.InteractPoint) {
    const id = mod.GetObjId(eventPlayer);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui || !ui.interactPoint) return;

    if (mod.GetObjId(eventInteractPoint) !== mod.GetObjId(ui.interactPoint)) return;
    processInteractTap(eventPlayer);
}
//#endregion
