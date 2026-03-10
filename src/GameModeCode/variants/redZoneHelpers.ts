//#region Red Zone Helpers
function getTeamNumber(team: mod.Team): number {
    // Normalize engine Team object into numeric Team 1 / Team 2 identifiers.
    if (mod.Equals(team, mod.GetTeam(1))) return 1;
    if (mod.Equals(team, mod.GetTeam(2))) return 2;
    return 0;
}

function isRedZoneTrigger(triggerId: number): boolean {
    // Fast filter so area-trigger handlers only process red zone triggers.
    return triggerId === TEAM1_REDZONE_TRIGGER_ID || triggerId === TEAM2_REDZONE_TRIGGER_ID;
}

function getRedZoneOwnerTeamNumber(triggerId: number): number {
    // Team that owns this HQ red zone (friendlies are exempt, enemies are punished).
    if (triggerId === TEAM1_REDZONE_TRIGGER_ID) return 1;
    if (triggerId === TEAM2_REDZONE_TRIGGER_ID) return 2;
    return 0;
}

function clearRedZoneStateForPlayer(playerOrId: mod.Player | number): void {
    const pid = mod.IsType(playerOrId, mod.Types.Player)
        ? mod.GetObjId(playerOrId as mod.Player)
        : (playerOrId as number);
    const state = playerRedZoneStateMap.get(pid);
    if (!state) return;

    // Invalidate pending timer checks before deleting state.
    state.token++;
    playerRedZoneStateMap.delete(pid);
    // Hide warning box immediately whenever state is cleared.
    hideRedZoneWarningForPlayerId(pid);
}

function isEnemyInsideRedZone(player: mod.Player, triggerId: number): boolean {
    // True only when player is on the opposite team of this HQ zone owner.
    if (!player || !mod.IsPlayerValid(player)) return false;
    const zoneOwnerTeam = getRedZoneOwnerTeamNumber(triggerId);
    if (zoneOwnerTeam === 0) return false;
    const playerTeam = getTeamNumber(mod.GetTeam(player));
    if (playerTeam === 0) return false;

    return playerTeam !== zoneOwnerTeam;
}

function blowUpPlayerOrVehicle(player: mod.Player): void {
    // If inside a vehicle, destroy vehicle first for expected "blow up" behavior.
    // Otherwise kill infantry directly.
    if (!player || !mod.IsPlayerValid(player)) return;

    const isInVehicle = mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle);
    if (isInVehicle) {
        try {
            const vehicle = mod.GetVehicleFromPlayer(player);
            if (vehicle) {
                mod.Kill(vehicle);
                return;
            }
        } catch {
            // Fallback to soldier kill if vehicle reference is unavailable.
        }
    }

    mod.Kill(player);
}

function ensureRedZoneWarningUi(player: mod.Player): void {
    // Create once per player; reused for all future red-zone entries.
    if (!player || !mod.IsPlayerValid(player)) return;
    const playerId = mod.GetObjId(player);
    if (playerRedZoneUiMap.has(playerId)) return;

    const rootName = "HUD_REDZONE_WARNING_ROOT_" + playerId;
    const titleName = "HUD_REDZONE_WARNING_TITLE_" + playerId;
    const textName = "HUD_REDZONE_WARNING_TEXT_" + playerId;

    mod.AddUIContainer(
        rootName,
        mod.CreateVector(0, -110, 0),
        mod.CreateVector(760, 120, 0),
        mod.UIAnchor.Center,
        mod.GetUIRoot(),
        false,
        40,
        mod.CreateVector(0, 0, 0),
        0.58,
        mod.UIBgFill.Blur,
        player
    );

    const root = mod.FindUIWidgetWithName(rootName);
    if (!root) return;

    mod.AddUIText(
        titleName,
        mod.CreateVector(0, -24, 0),
        mod.CreateVector(740, 40, 0),
        mod.UIAnchor.Center,
        root,
        true,
        41,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        // Use literal text here to avoid runtime "unknown string" when custom keys are not yet published.
        mod.Message("Out of bounds"),
        30,
        mod.CreateVector(1, 1, 1),
        1,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIText(
        textName,
        mod.CreateVector(0, 22, 0),
        mod.CreateVector(740, 100, 0),
        mod.UIAnchor.Center,
        root,
        true,
        41,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        // Reuse built-in score key as a safe numeric formatter for countdown text.
        mod.Message(mod.stringkeys.score, REDZONE_KILL_DELAY_SECONDS),
        34,
        mod.CreateVector(1, 0.25, 0.25),
        1,
        mod.UIAnchor.Center,
        player
    );

    // Cache widget names for fast runtime lookup.
    playerRedZoneUiMap.set(playerId, { rootName, titleName, textName });
}

function setRedZoneWarningVisible(player: mod.Player, visible: boolean): void {
    // Toggle warning overlay visibility without rebuilding widgets.
    if (!player || !mod.IsPlayerValid(player)) return;
    const playerId = mod.GetObjId(player);
    const ui = playerRedZoneUiMap.get(playerId);
    if (!ui) return;

    const root = mod.FindUIWidgetWithName(ui.rootName);
    if (root) mod.SetUIWidgetVisible(root, visible);
}

function setRedZoneWarningText(player: mod.Player, secondsRemaining: number): void {
    // Update numeric countdown label (currently uses built-in score key as reliable fallback).
    if (!player || !mod.IsPlayerValid(player)) return;
    const playerId = mod.GetObjId(player);
    const ui = playerRedZoneUiMap.get(playerId);
    if (!ui) return;

    const text = mod.FindUIWidgetWithName(ui.textName);
    if (!text) return;

    const clampedSeconds = Math.max(0, secondsRemaining);
    // Round up to tenths so players never see "0.0" before the actual kill check completes.
    const display = Math.ceil(clampedSeconds * 10) / 10;
    mod.SetUITextLabel(text, mod.Message(mod.stringkeys.score, display));
}

function hideRedZoneWarningForPlayerId(playerId: number): void {
    // Best-effort hide by player id (used by cleanup paths where Player object may be unavailable).
    const ui = playerRedZoneUiMap.get(playerId);
    if (!ui) return;

    const root = mod.FindUIWidgetWithName(ui.rootName);
    if (root) mod.SetUIWidgetVisible(root, false);
}

async function resolveRedZoneTimeout(
    player: mod.Player,
    playerId: number,
    zoneTriggerId: number,
    token: number
): Promise<void> {
    // Timer loop stays active only while token/zone/player validity checks remain true.
    // Any exit/team-switch/death clears state and naturally cancels this loop.
    let elapsed = 0;
    while (elapsed < REDZONE_KILL_DELAY_SECONDS) {
        const state = playerRedZoneStateMap.get(playerId);
        if (!state) return;
        if (state.token !== token) return;
        if (state.zoneTriggerId !== zoneTriggerId) return;
        if (!player || !mod.IsPlayerValid(player)) {
            clearRedZoneStateForPlayer(playerId);
            return;
        }
        if (!isEnemyInsideRedZone(player, zoneTriggerId)) {
            clearRedZoneStateForPlayer(playerId);
            return;
        }

        const remaining = REDZONE_KILL_DELAY_SECONDS - elapsed;
        try {
            // UI updates are intentionally isolated from kill logic with try/catch.
            setRedZoneWarningText(player, remaining);
            setRedZoneWarningVisible(player, true);
        } catch {
            // Never let UI text issues block red-zone kill enforcement.
        }

        await mod.Wait(REDZONE_UI_TICK_SECONDS);
        elapsed += REDZONE_UI_TICK_SECONDS;
    }

    const finalState = playerRedZoneStateMap.get(playerId);
    if (!finalState) return;
    if (finalState.token !== token) return;
    if (finalState.zoneTriggerId !== zoneTriggerId) return;
    if (!player || !mod.IsPlayerValid(player)) {
        clearRedZoneStateForPlayer(playerId);
        return;
    }
    if (!isEnemyInsideRedZone(player, zoneTriggerId)) {
        clearRedZoneStateForPlayer(playerId);
        return;
    }

    // Player remained in enemy HQ through full timeout; apply destruction.
    blowUpPlayerOrVehicle(player);
    clearRedZoneStateForPlayer(playerId);
}

function startRedZoneCountdownForPlayer(player: mod.Player, zoneTriggerId: number): void {
    // Begin (or refresh) per-player violation timer when entering enemy HQ red zone.
    if (!player || !mod.IsPlayerValid(player)) return;
    const playerId = mod.GetObjId(player);
    ensureRedZoneWarningUi(player);

    const existing = playerRedZoneStateMap.get(playerId);
    // Already counting down for this same zone; avoid duplicate async loops.
    if (existing && existing.zoneTriggerId === zoneTriggerId) return;

    // New token invalidates any earlier async timer still running for this player.
    const nextToken = (existing?.token ?? 0) + 1;
    playerRedZoneStateMap.set(playerId, {
        zoneTriggerId,
        token: nextToken
    });

    void resolveRedZoneTimeout(player, playerId, zoneTriggerId, nextToken);
}
//#endregion
