//#region Team Switch UI
// -----------------------------------------------------------------------------
// TEAM SWITCH UI
// -----------------------------------------------------------------------------
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

function isPlayerLikelyDeployed(player: mod.Player): boolean {
    return (
        mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive) ||
        mod.GetSoldierState(player, mod.SoldierStateBool.IsDead) ||
        mod.GetSoldierState(player, mod.SoldierStateBool.IsManDown)
    );
}

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

async function forceUndeployPlayer(player: mod.Player): Promise<void> {
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.UndeployPlayer(player);
    await mod.Wait(0.05);
    if (!player || !mod.IsPlayerValid(player)) return;
    mod.UndeployPlayer(player);
}
//#endregion
