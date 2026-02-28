/**
 * Airsup_v1_1
 * Air Sup baseline with triple-tap interact team-switch HUD panel.
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

const TRIPLE_TAP_WINDOW_SECONDS = 1.25;

interface PlayerTeamSwitchUi {
    hintTextName: string;
    debugTapTextName: string;
    debugClickTextName: string;
    panelName: string;
    panelLabelName: string;
    team1ButtonName: string;
    team2ButtonName: string;
    closeButtonName: string;
    team1TextName: string;
    team2TextName: string;
    closeTextName: string;
    panelVisible: boolean;
    tapCount: number;
    lastTapTime: number;
    interactPoint: mod.InteractPoint | null;
    lastDebugTapCount: number;
    panelOpenedAt: number;
}

const playerTeamSwitchUiMap: Map<number, PlayerTeamSwitchUi> = new Map();

// TWL-style interact multi-click detector.
class InteractMultiClickDetector {
    private static readonly STATES: Record<number, { lastIsInteracting: boolean; clickCount: number; sequenceStartTime: number }> = {};
    private static readonly WINDOW_MS = 2000;
    private static readonly REQUIRED_CLICKS = 3;

    public static checkMultiClick(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        const isInteracting = mod.GetSoldierState(player, mod.SoldierStateBool.IsInteracting);

        let state = this.STATES[playerId];
        if (!state) {
            this.STATES[playerId] = state = {
                lastIsInteracting: isInteracting,
                clickCount: 0,
                sequenceStartTime: 0
            };
        }

        if (isInteracting === state.lastIsInteracting) return false;
        state.lastIsInteracting = isInteracting;

        // Count only press edges.
        if (!isInteracting) return false;

        const now = Date.now();

        if (state.clickCount > 0 && now - state.sequenceStartTime > this.WINDOW_MS) {
            state.clickCount = 0;
        }

        if (state.clickCount === 0) {
            state.sequenceStartTime = now;
            state.clickCount = 1;
            return false;
        }

        if (++state.clickCount !== this.REQUIRED_CLICKS) return false;

        state.clickCount = 0;
        return true;
    }

    public static getTapProgress(player: mod.Player): number {
        const state = this.STATES[mod.GetObjId(player)];
        if (!state) return 0;
        return state.clickCount;
    }
}

// -----------------------------------------------------------------------------
// INITIALIZE GAME MODE
// -----------------------------------------------------------------------------
export async function OnGameModeStarted() {
    team1ScoreTimer = 0;
    team2ScoreTimer = 0;
    playerTeamSwitchUiMap.clear();

    const capturePointA = mod.GetCapturePoint(100);
    const capturePointB = mod.GetCapturePoint(101);
    const capturePointC = mod.GetCapturePoint(102);

    mod.EnableGameModeObjective(capturePointA, true);
    mod.EnableGameModeObjective(capturePointB, true);
    mod.EnableGameModeObjective(capturePointC, true);

    mod.SetCapturePointCapturingTime(capturePointA, 2.5);
    mod.SetCapturePointNeutralizationTime(capturePointA, 2.5);
    mod.SetCapturePointCapturingTime(capturePointB, 2.5);
    mod.SetCapturePointNeutralizationTime(capturePointB, 2.5);
    mod.SetCapturePointCapturingTime(capturePointC, 2.5);
    mod.SetCapturePointNeutralizationTime(capturePointC, 2.5);

    mod.SetMaxCaptureMultiplier(capturePointA, 1);
    mod.SetMaxCaptureMultiplier(capturePointB, 1);
    mod.SetMaxCaptureMultiplier(capturePointC, 1);

    mod.SetGameModeScore(mod.GetTeam(1), 0);
    mod.SetGameModeScore(mod.GetTeam(2), 0);

    setUpScoreBoard();
    initializeAllCurrentPlayers();

    while (mod.GetMatchTimeRemaining() > 0) {
        await mod.Wait(1);
        updateTeamScores();
        updateScoreBoardTotal();
    }
}

function initializeAllCurrentPlayers() {
    const players = mod.AllPlayers();
    const count = mod.CountOf(players);

    for (let i = 0; i < count; i++) {
        const player = mod.ValueInArray(players, i) as mod.Player;
        initializePlayerState(player);
    }
}

// -----------------------------------------------------------------------------
// SCOREBOARD
// -----------------------------------------------------------------------------
function updateScoreBoardTotal() {
    const score1 = mod.GetGameModeScore(mod.GetTeam(1));
    const score2 = mod.GetGameModeScore(mod.GetTeam(2));

    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.score, score1),
        mod.Message(mod.stringkeys.score, score2)
    );
}

function setUpScoreBoard() {
    mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
    mod.SetScoreboardHeader(
        mod.Message(mod.stringkeys.score, 0),
        mod.Message(mod.stringkeys.score, 0)
    );
    mod.SetScoreboardColumnNames(
        mod.Message(mod.stringkeys.SBHead1),
        mod.Message(mod.stringkeys.SBHead2),
        mod.Message(mod.stringkeys.SBHead3),
        mod.Message(mod.stringkeys.SBHead4)
    );
    mod.SetScoreboardColumnWidths(10, 10, 10, 10);
}

// -----------------------------------------------------------------------------
// TEAM SCORING
// -----------------------------------------------------------------------------
function getSecondsPerPoint(pointsHeld: number): number {
    if (pointsHeld === 3) return 1;
    if (pointsHeld === 2) return 5;
    if (pointsHeld === 1) return 10;
    return 0;
}

function updateTeamScores() {
    let team1PointsHeld = 0;
    let team2PointsHeld = 0;

    const ownerA = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(100));
    const ownerB = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(101));
    const ownerC = mod.GetCurrentOwnerTeam(mod.GetCapturePoint(102));

    if (mod.Equals(ownerA, mod.GetTeam(1))) team1PointsHeld++;
    else if (mod.Equals(ownerA, mod.GetTeam(2))) team2PointsHeld++;

    if (mod.Equals(ownerB, mod.GetTeam(1))) team1PointsHeld++;
    else if (mod.Equals(ownerB, mod.GetTeam(2))) team2PointsHeld++;

    if (mod.Equals(ownerC, mod.GetTeam(1))) team1PointsHeld++;
    else if (mod.Equals(ownerC, mod.GetTeam(2))) team2PointsHeld++;

    team1ScoreTimer++;
    team2ScoreTimer++;

    const team1Rate = getSecondsPerPoint(team1PointsHeld);
    const team2Rate = getSecondsPerPoint(team2PointsHeld);

    if (team1Rate > 0 && team1ScoreTimer >= team1Rate) {
        team1ScoreTimer = 0;
        mod.SetGameModeScore(mod.GetTeam(1), mod.GetGameModeScore(mod.GetTeam(1)) + 1);
    }

    if (team2Rate > 0 && team2ScoreTimer >= team2Rate) {
        team2ScoreTimer = 0;
        mod.SetGameModeScore(mod.GetTeam(2), mod.GetGameModeScore(mod.GetTeam(2)) + 1);
    }
}

// -----------------------------------------------------------------------------
// TEAM SWITCH UI
// -----------------------------------------------------------------------------
function createTeamSwitchUi(player: mod.Player) {
    const id = mod.GetObjId(player);
    if (playerTeamSwitchUiMap.has(id)) return;

    const hintTextName = "HUD_TEAM_SWITCH_HINT_" + id;
    const debugTapTextName = "HUD_TEAM_SWITCH_DEBUG_TAP_" + id;
    const debugClickTextName = "HUD_TEAM_SWITCH_DEBUG_CLICK_" + id;
    const panelName = "HUD_TEAM_SWITCH_PANEL_" + id;
    const panelLabelName = "HUD_TEAM_SWITCH_LABEL_" + id;
    const team1ButtonName = "HUD_TEAM_SWITCH_T1_" + id;
    const team2ButtonName = "HUD_TEAM_SWITCH_T2_" + id;
    const closeButtonName = "HUD_TEAM_SWITCH_CLOSE_" + id;
    const team1TextName = "HUD_TEAM_SWITCH_T1_TEXT_" + id;
    const team2TextName = "HUD_TEAM_SWITCH_T2_TEXT_" + id;
    const closeTextName = "HUD_TEAM_SWITCH_CLOSE_TEXT_" + id;

    // Always-visible hint text.
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

    // Hidden panel root container.
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
        debugTapTextName,
        debugClickTextName,
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
        lastDebugTapCount: -1,
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

function setTeamSwitchTapDebugText(player: mod.Player, message: mod.Message) {
    const id = mod.GetObjId(player);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui) return;

    const debugWidget = mod.FindUIWidgetWithName(ui.debugTapTextName);
    if (!debugWidget) return;

    mod.SetUITextLabel(debugWidget, message);
}

function setTeamSwitchClickDebugText(player: mod.Player, message: mod.Message) {
    const id = mod.GetObjId(player);
    const ui = playerTeamSwitchUiMap.get(id);
    if (!ui) return;

    const debugWidget = mod.FindUIWidgetWithName(ui.debugClickTextName);
    if (!debugWidget) return;

    mod.SetUITextLabel(debugWidget, message);
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

    // Enables cursor-like UI control mode while panel is visible.
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
    // Portal has no direct IsPlayerDeployed API in this type set; infer from soldier states.
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
    setTeamSwitchTapDebugText(player, mod.Message(mod.stringkeys.TEAM_SWITCH_DEBUG_ARMED));
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

    if (mod.IsType(playerOrId, mod.Types.Player)) {
        setTeamSwitchTapDebugText(playerOrId as mod.Player, mod.Message(mod.stringkeys.TEAM_SWITCH_DEBUG_WAIT));
    }
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

// -----------------------------------------------------------------------------
// PLAYER EVENTS
// -----------------------------------------------------------------------------
export function OnPlayerJoinGame(eventPlayer: mod.Player) {
    initializePlayerState(eventPlayer);
}

function initializePlayerState(player: mod.Player) {
    mod.SetVariable(mod.ObjectVariable(player, playerKills), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerDeaths), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerCaptures), 0);
    mod.SetVariable(mod.ObjectVariable(player, playerScore), 0);

    updatePlayerScoreBoard(player);
    createTeamSwitchUi(player);
    ensureTeamSwitchInteractPoint(player);
}

function updatePlayerScoreBoard(player: mod.Player) {
    mod.SetScoreboardPlayerValues(
        player,
        mod.GetVariable(mod.ObjectVariable(player, playerScore)),
        mod.GetVariable(mod.ObjectVariable(player, playerKills)),
        mod.GetVariable(mod.ObjectVariable(player, playerDeaths)),
        mod.GetVariable(mod.ObjectVariable(player, playerCaptures))
    );
}

export function OnPlayerEarnKill(eventPlayer: mod.Player) {
    mod.SetVariable(
        mod.ObjectVariable(eventPlayer, playerKills),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerKills)), 1)
    );
    mod.SetVariable(
        mod.ObjectVariable(eventPlayer, playerScore),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerScore)), 100)
    );

    updatePlayerScoreBoard(eventPlayer);
}

export function OnPlayerDied(eventPlayer: mod.Player) {
    mod.SetVariable(
        mod.ObjectVariable(eventPlayer, playerDeaths),
        mod.Add(mod.GetVariable(mod.ObjectVariable(eventPlayer, playerDeaths)), 1)
    );

    updatePlayerScoreBoard(eventPlayer);
}

export function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint) {
    const playersOnPoint = mod.GetPlayersOnPoint(eventCapturePoint);
    const currentOwner = mod.GetCurrentOwnerTeam(eventCapturePoint);
    const totalPlayersOnPoint = mod.CountOf(playersOnPoint);

    for (let i = 0; i < totalPlayersOnPoint; i++) {
        const player = mod.ValueInArray(playersOnPoint, i) as mod.Player;
        if (!mod.Equals(mod.GetTeam(player), currentOwner)) continue;

        mod.SetVariable(
            mod.ObjectVariable(player, playerCaptures),
            mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerCaptures)), 1)
        );
        mod.SetVariable(
            mod.ObjectVariable(player, playerScore),
            mod.Add(mod.GetVariable(mod.ObjectVariable(player, playerScore)), 200)
        );

        updatePlayerScoreBoard(player);
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
    if (!ui) return;

    const clickedName = mod.GetUIWidgetName(eventUIWidget);
    setTeamSwitchClickDebugText(eventPlayer, mod.Message("TS Debug: click " + clickedName));
    if (!ui.panelVisible) return;
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
    updateTeamSwitchButtonState(eventPlayer);
}

export function OngoingPlayer(eventPlayer: mod.Player) {
    if (!eventPlayer || !mod.IsPlayerValid(eventPlayer)) return;

    // Primary trigger path: triple tap Interact (E) using edge-based detector.
    if (InteractMultiClickDetector.checkMultiClick(eventPlayer)) {
        const id = mod.GetObjId(eventPlayer);
        const ui = playerTeamSwitchUiMap.get(id);
        if (ui) {
            setTeamSwitchTapDebugText(eventPlayer, mod.Message(mod.stringkeys.TEAM_SWITCH_DEBUG_TRIPLE));
            setTeamSwitchPanelVisible(eventPlayer, !ui.panelVisible);
        }
    }

    const id = mod.GetObjId(eventPlayer);
    const ui = playerTeamSwitchUiMap.get(id);
    if (ui) {
        const progress = InteractMultiClickDetector.getTapProgress(eventPlayer);
        if (progress !== ui.lastDebugTapCount && progress > 0) {
            ui.lastDebugTapCount = progress;
            setTeamSwitchTapDebugText(
                eventPlayer,
                mod.Message(mod.stringkeys.TEAM_SWITCH_DEBUG_TAP, progress)
            );
        } else if (progress === 0 && ui.lastDebugTapCount !== 0) {
            ui.lastDebugTapCount = 0;
        }

        // Safety: never leave player stuck in UI mode forever.
        if (ui.panelVisible && mod.GetMatchTimeElapsed() - ui.panelOpenedAt > 15) {
            setTeamSwitchPanelVisible(eventPlayer, false);
            setTeamSwitchTapDebugText(eventPlayer, mod.Message(mod.stringkeys.TEAM_SWITCH_DEBUG_TIMEOUT));
        }
    }

    if (isPlayerLikelyDeployed(eventPlayer)) {
        ensureTeamSwitchInteractPoint(eventPlayer);
    } else {
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
