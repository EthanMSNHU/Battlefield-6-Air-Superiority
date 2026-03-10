//#region Capture Progress HUD Helpers
function getObjectiveLetterForCapturePointId(capturePointId: number): string {
    if (capturePointId === 100) return "A";
    if (capturePointId === 101) return "B";
    if (capturePointId === 102) return "C";
    return "?";
}

function isPlayerInCapturePoint(player: mod.Player, capturePoint: mod.CapturePoint): boolean {
    const playersOnPoint = mod.GetPlayersOnPoint(capturePoint);
    const totalOnPoint = mod.CountOf(playersOnPoint);
    const playerId = mod.GetObjId(player);

    for (let i = 0; i < totalOnPoint; i++) {
        const onPointPlayer = mod.ValueInArray(playersOnPoint, i) as mod.Player;
        if (!onPointPlayer) continue;
        if (mod.GetObjId(onPointPlayer) === playerId) return true;
    }

    return false;
}

function updatePlayerCaptureProgressHud(player: mod.Player) {
    if (!player || !mod.IsPlayerValid(player)) return;

    const id = mod.GetObjId(player);
    const hud = playerHudMap.get(id);
    if (!hud) return;

    const root = mod.FindUIWidgetWithName(hud.captureRootName);
    const title = mod.FindUIWidgetWithName(hud.captureTitleName);
    const percent = mod.FindUIWidgetWithName(hud.capturePercentName);
    const barFriendly = mod.FindUIWidgetWithName(hud.captureBarFriendlyName);
    const barEnemy = mod.FindUIWidgetWithName(hud.captureBarEnemyName);
    if (!root) return;

    const playerTeam = mod.GetTeam(player);
    const points = [100, 101, 102];

    let activePointId = -1;
    let activeProgress = 0.5;
    let activeProgressTeam: mod.Team | undefined = undefined;

    for (let i = 0; i < points.length; i++) {
        const pointId = points[i];
        const capturePoint = mod.GetCapturePoint(pointId);
        if (!isPlayerInCapturePoint(player, capturePoint)) continue;

        // Some runtimes report capture progress as 0..1, others as 0..100.
        const rawProgress = mod.GetCaptureProgress(capturePoint);
        const progress = rawProgress > 1 ? (rawProgress / 100) : rawProgress;
        const progressTeam = mod.GetOwnerProgressTeam(capturePoint);
        const clamped = Math.max(0, Math.min(1, progress));

        // Show HUD only while capture progress is actively moving.
        // This prevents stale full-red/full-blue bars after team switches.
        const inFlightCapture = clamped > 0.01 && clamped < 0.99;
        if (!inFlightCapture) continue;

        activePointId = pointId;
        activeProgress = clamped;
        activeProgressTeam = progressTeam;
        break;
    }

    const shouldShow = activePointId !== -1;
    mod.SetUIWidgetVisible(root, shouldShow);
    if (!shouldShow) return;

    const objectiveLetter = getObjectiveLetterForCapturePointId(activePointId);
    if (title) {
        mod.SetUITextLabel(title, mod.Message("Capturing Objective " + objectiveLetter));
    }

    let friendlyProgress = activeProgress;
    const progressTeamIsValid =
        !!activeProgressTeam &&
        (mod.Equals(activeProgressTeam, mod.GetTeam(1)) || mod.Equals(activeProgressTeam, mod.GetTeam(2)));

    if (progressTeamIsValid && activeProgressTeam && !mod.Equals(activeProgressTeam, playerTeam)) {
        friendlyProgress = 1 - activeProgress;
    }

    friendlyProgress = Math.max(0, Math.min(1, friendlyProgress));
    const enemyProgress = 1 - friendlyProgress;
    const friendlyWidth = Math.round(CAPTURE_HUD_BAR_WIDTH * friendlyProgress);
    const enemyWidth = Math.round(CAPTURE_HUD_BAR_WIDTH * enemyProgress);

    if (barFriendly) {
        mod.SetUIWidgetSize(barFriendly, mod.CreateVector(friendlyWidth, CAPTURE_HUD_BAR_HEIGHT, 0));
    }
    if (barEnemy) {
        mod.SetUIWidgetSize(barEnemy, mod.CreateVector(enemyWidth, CAPTURE_HUD_BAR_HEIGHT, 0));
    }

    const percentValue = Math.round(friendlyProgress * 100);
    if (percent) {
        mod.SetUITextLabel(percent, mod.Message(percentValue + "%"));
    }
}

function hidePlayerCaptureProgressHud(player: mod.Player) {
    if (!player || !mod.IsPlayerValid(player)) return;
    const id = mod.GetObjId(player);
    const hud = playerHudMap.get(id);
    if (!hud) return;

    const root = mod.FindUIWidgetWithName(hud.captureRootName);
    if (root) {
        mod.SetUIWidgetVisible(root, false);
    }
}
//#endregion
