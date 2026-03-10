//#region HUD Creation
// -----------------------------------------------------------------------------
// HUD CREATION (CREATE ONCE)
// -----------------------------------------------------------------------------
function createHUD(player: mod.Player){

    // Use object id for unique per-player widget names.
    const id = mod.GetObjId(player);
    // Prevent duplicate HUD creation for the same player.
    if (playerHudMap.has(id)) return;

    // =====================================================
    // DEFINE ALL CONSTANTS FIRST
    // =====================================================

    const blueName = "HUD_BLUE_SCORE_" + id;
    const redName = "HUD_RED_SCORE_" + id;

    const blueBarFillName = "HUD_BLUE_BAR_FILL_" + id;
    const redBarFillName = "HUD_RED_BAR_FILL_" + id;
    const captureRootName = "HUD_CAPTURE_ROOT_" + id;
    const captureTitleName = "HUD_CAPTURE_TITLE_" + id;
    const capturePercentName = "HUD_CAPTURE_PERCENT_" + id;
    const captureBarBgName = "HUD_CAPTURE_BAR_BG_" + id;
    const captureBarFriendlyName = "HUD_CAPTURE_BAR_FRIENDLY_" + id;
    const captureBarEnemyName = "HUD_CAPTURE_BAR_ENEMY_" + id;

    const objA_Neutral = "HUD_OBJ_A_NEUTRAL_" + id;
    const objA_NeutralInner = "HUD_OBJ_A_NEUTRAL_INNER_" + id;
    const objA_Friendly = "HUD_OBJ_A_FRIENDLY_" + id;
    const objA_FriendlyInner = "HUD_OBJ_A_FRIENDLY_INNER_" + id;
    const objA_Enemy = "HUD_OBJ_A_ENEMY_" + id;
    const objA_EnemyInner = "HUD_OBJ_A_ENEMY_INNER_" + id;

    const objB_Neutral = "HUD_OBJ_B_NEUTRAL_" + id;
    const objB_NeutralInner = "HUD_OBJ_B_NEUTRAL_INNER_" + id;
    const objB_Friendly = "HUD_OBJ_B_FRIENDLY_" + id;
    const objB_FriendlyInner = "HUD_OBJ_B_FRIENDLY_INNER_" + id;
    const objB_Enemy = "HUD_OBJ_B_ENEMY_" + id;
    const objB_EnemyInner = "HUD_OBJ_B_ENEMY_INNER_" + id;

    const objC_Neutral = "HUD_OBJ_C_NEUTRAL_" + id;
    const objC_NeutralInner = "HUD_OBJ_C_NEUTRAL_INNER_" + id;
    const objC_Friendly = "HUD_OBJ_C_FRIENDLY_" + id;
    const objC_FriendlyInner = "HUD_OBJ_C_FRIENDLY_INNER_" + id;
    const objC_Enemy = "HUD_OBJ_C_ENEMY_" + id;
    const objC_EnemyInner = "HUD_OBJ_C_ENEMY_INNER_" + id;

    const OBJ_Y = 70;
    const OBJ_SIZE = 46;
    const OBJ_INNER_SIZE = OBJ_SIZE - 8;
    const OBJ_SPACING = 90;
    const OBJ_LETTER_PLATE_SIZE = OBJ_SIZE - 14;
    const OBJ_LETTER_PLATE_COLOR = mod.CreateVector(0,0,0);
    const OBJ_LETTER_PLATE_ALPHA = 0;
    const LETTER_COLOR = mod.CreateVector(1,1,1);

    const COLOR_NEUTRAL = mod.CreateVector(0.39, 0.39, 0.39);
    const COLOR_NEUTRAL_INNER = mod.CreateVector(0, 0, 0);
    const COLOR_FRIENDLY = mod.CreateVector(0.45, 0.75, 1);
    const COLOR_FRIENDLY_INNER = mod.CreateVector(0.05, 0.2, 0.5);
    const COLOR_ENEMY = mod.CreateVector(1, 0.6, 0.6);
    const COLOR_ENEMY_INNER = mod.CreateVector(0.45, 0.05, 0.05);
    const NEUTRAL_ALPHA = 1;
    const NEUTRAL_INNER_ALPHA = 0.39;
    const FRIENDLY_INNER_ALPHA = 0.75;
    const ENEMY_INNER_ALPHA = 0.75;

    // =====================================================
    // CREATE ROOT
    // =====================================================

    mod.AddUIContainer(
        "HUD_ROOT_" + id,
        mod.CreateVector(0, 48, 0),
        mod.CreateVector(1200, 150, 0),
        mod.UIAnchor.TopCenter,
        mod.GetUIRoot(),
        true,
        8,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        player
    );

    const root = mod.FindUIWidgetWithName("HUD_ROOT_" + id);
    if (!root) return;
    // Early return avoids null-parent UI calls if root failed for any reason.

    // =====================================================
    // HUD VISUAL BUILD (STATIC CREATION PHASE)
    // =====================================================
    // From here down, widgets are only created once.
    // Runtime changes later happen through SetUITextLabel/SetUIWidgetSize/SetUIWidgetVisible.

    // --- BLUE SCORE BG ---
    mod.AddUIText(
        "HUD_BLUE_SCORE_BG_" + id,
        mod.CreateVector(-340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        5,
        mod.CreateVector(0.05,0.1,0.2),
        0.85,
        mod.UIBgFill.Solid,
        mod.Message(" "),
        0,
        mod.CreateVector(1,1,1),
        0,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIText(
        blueName,
        mod.CreateVector(-340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.score, gameState.team1Score),
        32,
        mod.CreateVector(0.3,0.6,1),
        1,
        mod.UIAnchor.Center,
        player
    );

    // --- RED SCORE BG ---
    mod.AddUIText(
        "HUD_RED_SCORE_BG_" + id,
        mod.CreateVector(340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        5,
        mod.CreateVector(0.2,0.05,0.05),
        0.85,
        mod.UIBgFill.Solid,
        mod.Message(" "),
        0,
        mod.CreateVector(1,1,1),
        0,
        mod.UIAnchor.Center,
        player
    );

    mod.AddUIText(
        redName,
        mod.CreateVector(340, 12, 0),
        mod.CreateVector(90, 45, 0),
        mod.UIAnchor.TopCenter,
        root,
        true,
        6,
        mod.CreateVector(0,0,0),
        0,
        mod.UIBgFill.None,
        mod.Message(mod.stringkeys.score, gameState.team2Score),
        32,
        mod.CreateVector(1,0.3,0.3),
        1,
        mod.UIAnchor.Center,
        player
    );

    // --- BAR BACKGROUNDS ---
    mod.AddUIText("HUD_BLUE_BAR_BG_" + id,
        mod.CreateVector(-145, 25, 0),
        mod.CreateVector(280, 20, 0),
        mod.UIAnchor.TopCenter, root, true, 4,
        mod.CreateVector(0,0,0), 0.35, mod.UIBgFill.Blur,
        mod.Message(" "), 0, mod.CreateVector(1,1,1), 0,
        mod.UIAnchor.Center, player);

    mod.AddUIText("HUD_RED_BAR_BG_" + id,
        mod.CreateVector(145, 25, 0),
        mod.CreateVector(280, 20, 0),
        mod.UIAnchor.TopCenter, root, true, 4,
        mod.CreateVector(0,0,0), 0.35, mod.UIBgFill.Blur,
        mod.Message(" "), 0, mod.CreateVector(1,1,1), 0,
        mod.UIAnchor.Center, player);

    // --- BAR FILLS ---
    mod.AddUIContainer(
        blueBarFillName,
        mod.CreateVector(305, 25, 0),
        mod.CreateVector(0, 20, 0),
        mod.UIAnchor.TopLeft,
        root,
        true,
        5,
        mod.CreateVector(0.2,0.55,1),
        1,
        mod.UIBgFill.Solid,
        player
    );

    mod.AddUIContainer(
        redBarFillName,
        mod.CreateVector(879, 25, 0),
        mod.CreateVector(0, 20, 0),
        mod.UIAnchor.TopLeft,
        root,
        true,
        5,
        mod.CreateVector(1,0.25,0.25),
        1,
        mod.UIBgFill.Solid,
        player
    );

    // --- CAPTURE PROGRESS HUD (shown only while this player captures an objective) ---
    mod.AddUIContainer(
        captureRootName,
        mod.CreateVector(-1, 109, 0),
        mod.CreateVector(360, 64, 0),
        mod.UIAnchor.TopCenter,
        root,
        false,
        9,
        mod.CreateVector(0, 0, 0),
        0,
        mod.UIBgFill.None,
        player
    );

    const captureRoot = mod.FindUIWidgetWithName(captureRootName);
    if (captureRoot) {
        mod.AddUIContainer(
            captureBarBgName,
            mod.CreateVector(0, 22, 0),
            mod.CreateVector(CAPTURE_HUD_BAR_WIDTH, CAPTURE_HUD_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            captureRoot,
            true,
            9,
            mod.CreateVector(0, 0, 0),
            0.45,
            mod.UIBgFill.Solid,
            player
        );

        const captureBarBg = mod.FindUIWidgetWithName(captureBarBgName);
        if (captureBarBg) {
            mod.AddUIContainer(
                captureBarFriendlyName,
                mod.CreateVector(-10, -8.5, 0),
                mod.CreateVector(Math.floor(CAPTURE_HUD_BAR_WIDTH / 2), CAPTURE_HUD_BAR_HEIGHT, 0),
                mod.UIAnchor.TopLeft,
                captureBarBg,
                true,
                10,
                mod.CreateVector(0.2, 0.55, 1),
                1,
                mod.UIBgFill.Solid,
                player
            );

            mod.AddUIContainer(
                captureBarEnemyName,
                mod.CreateVector(-10, -8.5, 0),
                mod.CreateVector(Math.floor(CAPTURE_HUD_BAR_WIDTH / 2), CAPTURE_HUD_BAR_HEIGHT, 0),
                mod.UIAnchor.TopRight,
                captureBarBg,
                true,
                10,
                mod.CreateVector(1, 0.25, 0.25),
                1,
                mod.UIBgFill.Solid,
                player
            );
        }

    }

// -----------------------------------------------------------------------------
// OBJECTIVE STACKS
// -----------------------------------------------------------------------------
// Each objective (A/B/C) uses three overlapping state widgets:
// neutral, friendly, enemy. Visibility toggles decide which color plate is shown.
// -----------------------------------------------------------------------------
// A STACK
// -----------------------------------------------------------------------------
// LETTER BACKING A
mod.AddUIText(
    "HUD_OBJ_LETTER_BG_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_LETTER_PLATE_SIZE, OBJ_LETTER_PLATE_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    11,
    OBJ_LETTER_PLATE_COLOR,
    OBJ_LETTER_PLATE_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// LETTER A
mod.AddUIText(
    "HUD_OBJ_LETTER_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    100, // stable depth to avoid projection offset/clipping
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_A),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

// LETTER B
mod.AddUIText(
    "HUD_OBJ_LETTER_BG_B_" + id,
    mod.CreateVector(0, OBJ_Y, 0),
    mod.CreateVector(OBJ_LETTER_PLATE_SIZE, OBJ_LETTER_PLATE_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    11,
    OBJ_LETTER_PLATE_COLOR,
    OBJ_LETTER_PLATE_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_B_" + id,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    100,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_B),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

// LETTER C
mod.AddUIText(
    "HUD_OBJ_LETTER_BG_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y, 0),
    mod.CreateVector(OBJ_LETTER_PLATE_SIZE, OBJ_LETTER_PLATE_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    11,
    OBJ_LETTER_PLATE_COLOR,
    OBJ_LETTER_PLATE_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    100,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_C),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);
// Neutral (default visible)
// Start with neutral visible so UI is valid before first ownership update pass.
mod.AddUIText(
    objA_Neutral,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    COLOR_NEUTRAL,
    NEUTRAL_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
mod.AddUIText(
    objA_NeutralInner,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    3,
    COLOR_NEUTRAL_INNER,
    NEUTRAL_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// Friendly
mod.AddUIText(
    objA_Friendly,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_FRIENDLY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
mod.AddUIText(
    objA_FriendlyInner,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_FRIENDLY_INNER,
    FRIENDLY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);

// Enemy
mod.AddUIText(
    objA_Enemy,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_ENEMY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);
mod.AddUIText(
    objA_EnemyInner,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_ENEMY_INNER,
    ENEMY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player
);




// -----------------------------------------------------------------------------
// B STACK
// -----------------------------------------------------------------------------
mod.AddUIText(objB_Neutral,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    COLOR_NEUTRAL,
    NEUTRAL_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objB_NeutralInner,
    mod.CreateVector(0, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    3,
    COLOR_NEUTRAL_INNER,
    NEUTRAL_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objB_Friendly,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_FRIENDLY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objB_FriendlyInner,
    mod.CreateVector(0, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_FRIENDLY_INNER,
    FRIENDLY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objB_Enemy,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_ENEMY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);




// -----------------------------------------------------------------------------
// C STACK
// -----------------------------------------------------------------------------
mod.AddUIText(objC_Neutral,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    2,
    COLOR_NEUTRAL,
    NEUTRAL_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objC_NeutralInner,
    mod.CreateVector(OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    3,
    COLOR_NEUTRAL_INNER,
    NEUTRAL_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objC_Friendly,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_FRIENDLY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objB_EnemyInner,
    mod.CreateVector(0, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_ENEMY_INNER,
    ENEMY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objC_FriendlyInner,
    mod.CreateVector(OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_FRIENDLY_INNER,
    FRIENDLY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

mod.AddUIText(objC_Enemy,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    2,
    COLOR_ENEMY,
    1,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);
mod.AddUIText(objC_EnemyInner,
    mod.CreateVector(OBJ_SPACING, OBJ_Y + 2, 0),
    mod.CreateVector(OBJ_INNER_SIZE, OBJ_INNER_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    false,
    3,
    COLOR_ENEMY_INNER,
    ENEMY_INNER_ALPHA,
    mod.UIBgFill.Solid,
    mod.Message(" "),
    0,
    mod.CreateVector(1,1,1),
    0,
    mod.UIAnchor.Center,
    player);

// ---------------------------------------------------------------------------
// LETTER FRONT PASS
// ---------------------------------------------------------------------------
// Render letters last so they always stay visible over solid objective plates.
mod.AddUIText(
    "HUD_OBJ_LETTER_FRONT_A_" + id,
    mod.CreateVector(-OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    12,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_A),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_FRONT_B_" + id,
    mod.CreateVector(0, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    12,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_B),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);

mod.AddUIText(
    "HUD_OBJ_LETTER_FRONT_C_" + id,
    mod.CreateVector(OBJ_SPACING, OBJ_Y - 2, 0),
    mod.CreateVector(OBJ_SIZE, OBJ_SIZE, 0),
    mod.UIAnchor.TopCenter,
    root,
    true,
    12,
    mod.CreateVector(0,0,0),
    0,
    mod.UIBgFill.None,
    mod.Message(mod.stringkeys.OBJ_C),
    30,
    LETTER_COLOR,
    1,
    mod.UIAnchor.Center,
    player
);




    // ===============================================================================================================================================================
    // STORE MAP LAST
    // ===============================================================================================================================================================

    playerHudMap.set(id, {
        blueScoreName: blueName,
        redScoreName: redName,
        blueBarFillName,
        redBarFillName,
        objA_Neutral,
        objA_NeutralInner,
        objA_Friendly,
        objA_FriendlyInner,
        objA_Enemy,
        objA_EnemyInner,
        objB_Neutral,
        objB_NeutralInner,
        objB_Friendly,
        objB_FriendlyInner,
        objB_Enemy,
        objB_EnemyInner,
        objC_Neutral,
        objC_NeutralInner,
        objC_Friendly,
        objC_FriendlyInner,
        objC_Enemy,
        objC_EnemyInner,
        captureRootName,
        captureTitleName,
        capturePercentName,
        captureBarFriendlyName,
        captureBarEnemyName
    });
}
//#endregion
