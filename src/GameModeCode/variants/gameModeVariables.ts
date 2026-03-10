//#region Game Mode Variables
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
const GAME_MODE_TARGET_SCORE = 200;
// Enemy-HQ red zone trigger IDs (set from map AreaTrigger ObjIds).
const TEAM1_REDZONE_TRIGGER_ID = 104;
const TEAM2_REDZONE_TRIGGER_ID = 105;
// Time an enemy may stay inside opposing HQ red zone before destruction.
const REDZONE_KILL_DELAY_SECONDS = 5;
// UI refresh cadence for the red zone countdown text.
const REDZONE_UI_TICK_SECONDS = 0.1;
// Authoritative state
// Local source of truth for team scores; scoreboard and HUD derive from this object.
let gameState = {
    team1Score: 0,
    team2Score: 0
};

interface PlayerRedZoneState {
    // Which HQ trigger this player is currently violating.
    zoneTriggerId: number;
    // Cancellation token for async timer loops; incrementing invalidates older loops.
    token: number;
}

// Per-player runtime red zone state (only populated while inside an enemy HQ red zone).
const playerRedZoneStateMap: Map<number, PlayerRedZoneState> = new Map();

interface PlayerRedZoneUi {
    // Root warning box container.
    rootName: string;
    // Static warning title text.
    titleName: string;
    // Dynamic countdown text.
    textName: string;
}

// Per-player UI widget registry for red zone warning overlay.
const playerRedZoneUiMap: Map<number, PlayerRedZoneUi> = new Map();

interface PlayerTeamSwitchUi {
    // Widget names and transient state for this player's team-switch panel instance.
    hintTextName: string;
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
    panelOpenedAt: number;
}

// Per-player registry used by interact handlers and button events to resolve the right UI widgets.
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
}




// HUD MAP (store widget names only)
// Per-player registry of all HUD widgets that need runtime updates.
interface PlayerHud {
    // Score text labels (friendly on left, enemy on right after team-relative mapping).
    blueScoreName: string;
    redScoreName: string;
    // Dynamic bar fill containers.
    blueBarFillName: string;
    redBarFillName: string;

    // Objective A state widgets (only one should be visible at a time).
    objA_Neutral: string;
    objA_NeutralInner: string;
    objA_Friendly: string;
    objA_FriendlyInner: string;
    objA_Enemy: string;
    objA_EnemyInner: string;

    // Objective B state widgets.
    objB_Neutral: string;
    objB_NeutralInner: string;
    objB_Friendly: string;
    objB_FriendlyInner: string;
    objB_Enemy: string;
    objB_EnemyInner: string;

    // Objective C state widgets.
    objC_Neutral: string;
    objC_NeutralInner: string;
    objC_Friendly: string;
    objC_FriendlyInner: string;
    objC_Enemy: string;
    objC_EnemyInner: string;

    // Live capture HUD (shown only while this player is actively capturing a point).
    captureRootName: string;
    captureTitleName: string;
    capturePercentName: string;
    captureBarFriendlyName: string;
    captureBarEnemyName: string;
}

let playerHudMap: Map<number, PlayerHud> = new Map();

const CAPTURE_HUD_BAR_WIDTH = 260;
const CAPTURE_HUD_BAR_HEIGHT = 16;
// Shared capture HUD dimensions keep initial widget creation and runtime fill math aligned.
//#endregion
